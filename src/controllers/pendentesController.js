// src/controllers/pendentesController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

async function getPendentes(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let whereClause = { status: STATUS.PENDENTE };

    if (search) {
      const searchNum = parseInt(search);
      whereClause = {
        ...whereClause,
        OR: [
          { nomeFuncionario: { contains: search, mode: 'insensitive' } },
        ],
      };
      
      // If search string is a valid number, we also search by exact 'codigoFuncionario' (matrícula)
      if (!isNaN(searchNum)) {
        whereClause.OR.push({ codigoFuncionario: searchNum });
      }
    }

    const [pendentes, total] = await Promise.all([
      prisma.envio.findMany({
        where: whereClause,
        select: {
          id: true,
          nomeFuncionario: true,
          cpf: true,
          telefone: true,
          competencia: true,
          arquivoPdf: true,
          status: true,
          dataProcessamento: true,
        },
        orderBy: { dataProcessamento: 'desc' },
        skip,
        take: limit,
      }),
      prisma.envio.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: pendentes,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Erro ao buscar pendentes:', err);
    res.status(500).json({ error: 'Falha ao obter pendentes' });
  }
}

module.exports = { getPendentes };
