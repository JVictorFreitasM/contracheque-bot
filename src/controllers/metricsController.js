const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

// Dashboard metrics
async function getMetrics(req, res) {
  try {
    const pendentes = await prisma.envio.count({ where: { status: STATUS.PENDENTE } });
    const enviados = await prisma.envio.count({ where: { status: STATUS.ENVIADO } });
    const erros = await prisma.envio.count({ where: { status: STATUS.ERRO } });
    const duplicidades = await prisma.envio.count({ where: { status: STATUS.DUPLICADO_HASH } });
    const funcionariosSincronizados = await prisma.funcionario.count();
    // última sincronização – assume campo ultimaSincronizacao em Funcionario
    const ultimaSincronizacao = await prisma.funcionario.findFirst({
      orderBy: { ultimaSincronizacao: 'desc' },
      select: { ultimaSincronizacao: true }
    });
    const proximoLote = process.env.DIA_ENVIO_CONTRACHEQUES || null;
    const distribuicao = {
      enviados,
      pendentes,
      erros,
      duplicados,
    };
    res.json({
      pendentes,
      enviados,
      erros,
      duplicidades,
      funcionariosSincronizados,
      ultimaSincronizacao: ultimaSincronizacao?.ultimaSincronizacao ?? null,
      proximoLote,
      distribuicao,
    });
  } catch (err) {
    console.error('Erro ao buscar métricas:', err);
    res.status(500).json({ error: 'Falha ao obter métricas' });
  }
}

module.exports = { getMetrics };
