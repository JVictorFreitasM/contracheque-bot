const prisma = require('../lib/prisma');
const configuracaoService = require('../services/configuracaoService');
const filaEnvio = require('../queues/envioContrachequeQueue');
const redis = require('../config/redis');

// Formatar previsao
const formatarTempo = (segundos) => {
  if (!segundos || segundos < 0) return '00:00';
  const mins = Math.floor(segundos / 60);
  const secs = Math.floor(segundos % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

async function getDadosProcessamento() {
  try {
    // 1. Descobrir o lote atual
    const ultimoEnvio = await prisma.envio.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { competencia: true }
    });
    
    const loteAtual = ultimoEnvio?.competencia || 'Nenhum lote';

    // 2. Contagens para o lote
    let total = 0, enviados = 0, erros = 0, restantes = 0, processados = 0;
    
    if (loteAtual !== 'Nenhum lote') {
      const stats = await prisma.envio.groupBy({
        by: ['status'],
        where: { competencia: loteAtual },
        _count: { _all: true }
      });

      stats.forEach(stat => {
        total += stat._count._all;
        if (stat.status === 'ENVIADO') enviados += stat._count._all;
        else if (stat.status === 'ERRO' || stat.status === 'ERRO_ENVIO' || stat.status === 'ERRO_PDF') erros += stat._count._all;
        else if (stat.status === 'PENDENTE' || stat.status === 'PROCESSANDO') restantes += stat._count._all;
      });
      processados = enviados + erros;
    }

    // 3. Tempo medio e previsao
    const config = await configuracaoService.obterConfiguracao();
    const tempoMedio = config.intervalo_envio || 30; // em segundos
    const segundosRestantes = restantes * tempoMedio;
    const previsaoTermino = formatarTempo(segundosRestantes);

    // 4. Status online (mock simplificado de disponibilidade por enquanto)
    const redisOnline = await redis.ping().then(() => true).catch(() => false);
    // Para o worker, vamos considerar que ele esta rodando caso o redis esteja
    const workers = await filaEnvio.getWorkers();
    const workerOnline = workers.length > 0;
    
    // Evolution vamos considerar online caso tenhamos URL configurada e não vazia
    const evolutionOnline = !!config.evolution_url;

    return {
      loteAtual,
      total,
      processados,
      enviados,
      erros,
      restantes,
      tempoMedio,
      previsaoTermino,
      workerOnline,
      redisOnline,
      evolutionOnline
    };
  } catch (error) {
    console.error('Erro ao obter dados de processamento:', error);
    return null;
  }
}

async function getProcessamentoStatus(req, res) {
  const dados = await getDadosProcessamento();
  if (!dados) {
    return res.status(500).json({ error: 'Erro ao processar status' });
  }
  res.json(dados);
}

function streamProcessamentoStatus(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.flushHeaders();

  // Enviar os dados logo que a conexão abrir
  getDadosProcessamento().then(dados => {
    if (dados) {
      res.write(`data: ${JSON.stringify(dados)}\n\n`);
    }
  });

  const intervalo = setInterval(async () => {
    const dados = await getDadosProcessamento();
    if (dados) {
      res.write(`data: ${JSON.stringify(dados)}\n\n`);
    }
  }, 3000); // Atualiza a cada 3 segundos

  req.on('close', () => {
    clearInterval(intervalo);
    res.end();
  });
}

module.exports = {
  getProcessamentoStatus,
  streamProcessamentoStatus
};
