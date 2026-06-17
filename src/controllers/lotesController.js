// src/controllers/lotesController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

function normalizeLoteStatus(statuses) {
  if (statuses.includes(STATUS.ERRO_ENVIO) || statuses.includes(STATUS.ERRO_PDF) || statuses.includes(STATUS.FUNCIONARIO_NAO_ENCONTRADO) || statuses.includes(STATUS.NOME_DIVERGENTE) || statuses.includes(STATUS.SEM_TELEFONE) || statuses.includes(STATUS.ERRO)) {
    return 'erro';
  }
  if (statuses.includes(STATUS.PROCESSANDO)) {
    return 'processando';
  }
  if (statuses.includes(STATUS.ENVIADO)) {
    return 'concluido';
  }
  if (statuses.includes(STATUS.PENDENTE)) {
    return 'processando';
  }
  return 'pendente';
}

async function getLotes(req, res) {
  try {
    const envios = await prisma.envio.findMany({
      select: {
        competencia: true,
        status: true,
        dataProcessamento: true,
        nomeFuncionario: true,
        cpf: true,
      },
      orderBy: { dataProcessamento: 'desc' },
    });

    const lotesMap = new Map();

    envios.forEach((envio) => {
      const key = envio.competencia || 'Sem competência';
      const lote = lotesMap.get(key) || {
        nome: key,
        competencia: key,
        quantidade: 0,
        statusList: [],
        ultimaAtualizacao: envio.dataProcessamento,
      };

      lote.quantidade += 1;
      lote.statusList.push(envio.status);
      if (envio.dataProcessamento && envio.dataProcessamento > lote.ultimaAtualizacao) {
        lote.ultimaAtualizacao = envio.dataProcessamento;
      }
      lotesMap.set(key, lote);
    });

    const lotes = Array.from(lotesMap.values()).map((lote) => ({
      nome: lote.nome,
      competencia: lote.competencia,
      quantidade: lote.quantidade,
      status: normalizeLoteStatus(lote.statusList),
      data: lote.ultimaAtualizacao ? lote.ultimaAtualizacao.toISOString().split('T')[0] : null,
    }));

    res.json(lotes);
  } catch (err) {
    console.error('Erro ao buscar lotes:', err);
    res.status(500).json({ error: 'Falha ao obter lotes' });
  }
}

module.exports = { getLotes };
