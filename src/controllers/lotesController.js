// src/controllers/lotesController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

function encodeLoteId(competencia) {
  return Buffer.from(competencia, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeLoteId(id) {
  const normalized = id.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function normalizeLoteStatus(statuses) {
  if (statuses.includes(STATUS.PROCESSANDOFINALIZADOCANCELADO)) {
    return 'cancelado';
  }
  if (statuses.includes(STATUS.ERRO_ENVIO) || statuses.includes(STATUS.ERRO_PDF) || statuses.includes(STATUS.FUNCIONARIO_NAO_ENCONTRADO) || statuses.includes(STATUS.NOME_DIVERGENTE) || statuses.includes(STATUS.SEM_TELEFONE) || statuses.includes(STATUS.ERRO)) {
    return 'erro';
  }
  if (statuses.includes(STATUS.PROCESSANDO) || statuses.includes(STATUS.REENVIANDO)) {
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
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const whereClause = search ? {
      competencia: { contains: search, mode: 'insensitive' }
    } : {};

    // Get total distinct lotes
    const distinctLotes = await prisma.envio.findMany({
      where: whereClause,
      distinct: ['competencia'],
      select: { competencia: true }
    });
    const total = distinctLotes.length;
    const totalPages = Math.ceil(total / limit);

    if (total === 0) {
      return res.json({ data: [], page, limit, total, totalPages });
    }

    // Get paginated lotes using groupBy
    const paginatedGroups = await prisma.envio.groupBy({
      by: ['competencia'],
      _max: { dataProcessamento: true },
      _count: { id: true },
      where: whereClause,
      orderBy: {
        _max: { dataProcessamento: 'desc' }
      },
      skip,
      take: limit
    });

    const competencias = paginatedGroups.map(g => g.competencia);

    // Get statuses for these lotes to determine final status
    const enviosStatus = await prisma.envio.findMany({
      where: { competencia: { in: competencias } },
      select: { competencia: true, status: true }
    });

    const statusMap = new Map();
    enviosStatus.forEach(env => {
      const key = env.competencia || 'Sem competência';
      if (!statusMap.has(key)) statusMap.set(key, []);
      statusMap.get(key).push(env.status);
    });

    const lotes = paginatedGroups.map(g => {
      const comp = g.competencia || 'Sem competência';
      const sList = statusMap.get(comp) || [];
      return {
        id: encodeLoteId(comp),
        nome: comp,
        competencia: comp,
        quantidade: g._count.id,
        status: normalizeLoteStatus(sList),
        data: g._max.dataProcessamento ? g._max.dataProcessamento.toISOString().split('T')[0] : null,
      };
    });

    res.json({
      data: lotes,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Erro ao buscar lotes:', err);
    res.status(500).json({ error: 'Falha ao obter lotes' });
  }
}

async function getLoteProgresso(req, res) {
  try {
    const id = req.params.id;
    const competencia = decodeLoteId(id);

    if (!competencia) {
      return res.status(400).json({ error: 'Identificador de lote inválido.' });
    }

    const stats = await prisma.envio.groupBy({
      by: ['status'],
      where: { competencia },
      _count: { _all: true }
    });

    if (!stats.length) {
      return res.status(404).json({ error: 'Lote não encontrado.' });
    }

    let total = 0;
    let erros = 0;
    let pendentes = 0;
    let cancelados = 0;

    stats.forEach((stat) => {
      total += stat._count._all;
      if (stat.status === STATUS.ERRO || stat.status === STATUS.ERRO_ENVIO || stat.status === STATUS.ERRO_PDF) {
        erros += stat._count._all;
      }
      if (stat.status === STATUS.PENDENTE || stat.status === STATUS.PROCESSANDO || stat.status === STATUS.REENVIANDO) {
        pendentes += stat._count._all;
      }
      if (stat.status === STATUS.PROCESSANDOFINALIZADOCANCELADO) {
        cancelados += stat._count._all;
      }
    });

    const processados = total - pendentes;

    res.json({
      competencia,
      total_pdfs: total,
      processados,
      erros,
      pendentes,
      cancelados
    });
  } catch (err) {
    console.error('Erro ao buscar progresso do lote:', err);
    res.status(500).json({ error: 'Falha ao obter progresso do lote.' });
  }
}

async function cancelLote(req, res) {
  try {
    const id = req.params.id;
    const competencia = decodeLoteId(id);

    if (!competencia) {
      return res.status(400).json({ error: 'Identificador de lote inválido.' });
    }

    // Atualiza envios pendentes/processando/re-enviando do lote para cancelado.
    await prisma.envio.updateMany({
      where: {
        competencia,
        status: {
          in: [STATUS.PENDENTE, STATUS.PROCESSANDO, STATUS.REENVIANDO]
        }
      },
      data: {
        status: STATUS.PROCESSANDOFINALIZADOCANCELADO,
        mensagemErro: 'Lote cancelado pelo usuário.'
      }
    });

    // Remove trabalhos futuros da fila que ainda não foram processados.
    const jobs = await require('../queues/envioContrachequeQueue').getJobs(['waiting', 'delayed', 'paused']);
    for (const job of jobs) {
      if (job.data && job.data.competencia === competencia) {
        await job.remove();
      }
    }

    res.json({ success: true, message: 'Lote cancelado com sucesso.' });
  } catch (err) {
    console.error('Erro ao cancelar lote:', err);
    res.status(500).json({ error: 'Falha ao cancelar o lote.' });
  }
}

async function reprocessarLote(req, res) {
  return handleReprocessamento(req, res, 'full');
}

async function reprocessarErros(req, res) {
  return handleReprocessamento(req, res, 'errors');
}

async function reprocessarPendentes(req, res) {
  return handleReprocessamento(req, res, 'pendentes');
}

async function handleReprocessamento(req, res, tipo) {
  try {
    const id = req.params.id;
    const competencia = decodeLoteId(id);

    if (!competencia) {
      return res.status(400).json({ error: 'Identificador de lote inválido.' });
    }

    const reprocessamentoService = require('../services/reprocessamentoService');

    let quantidade = 0;
    if (tipo === 'full') {
      quantidade = await reprocessamentoService.reprocessarLote(competencia, req.user?.email || 'manual');
    } else if (tipo === 'errors') {
      quantidade = await reprocessamentoService.reprocessarErros(competencia, req.user?.email || 'manual');
    } else if (tipo === 'pendentes') {
      quantidade = await reprocessamentoService.reprocessarPendentes(competencia, req.user?.email || 'manual');
    }

    res.json({ success: true, quantidade, message: 'Reprocessamento iniciado com sucesso.' });
  } catch (err) {
    console.error('Erro ao reprocessar lote:', err);
    res.status(500).json({ error: 'Falha ao iniciar reprocessamento do lote.' });
  }
}

async function getReprocessamentosLote(req, res) {
  try {
    const id = req.params.id;
    const competencia = decodeLoteId(id);

    if (!competencia) {
      return res.status(400).json({ error: 'Identificador de lote inválido.' });
    }

    const registros = await prisma.reprocessamentoLote.findMany({
      where: { competencia },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: registros });
  } catch (err) {
    console.error('Erro ao buscar histórico de reprocessamento:', err);
    res.status(500).json({ error: 'Falha ao buscar histórico de reprocessamento.' });
  }
}

module.exports = { getLotes, getLoteProgresso, cancelLote, reprocessarLote, reprocessarErros, reprocessarPendentes, getReprocessamentosLote };

