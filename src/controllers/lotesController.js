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

module.exports = { getLotes };
