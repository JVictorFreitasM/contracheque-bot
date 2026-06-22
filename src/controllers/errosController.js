// src/controllers/errosController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

/**
 * Retrieve processing records that ended with an error.
 * Includes various error statuses defined in statusEnvio.js.
 */
async function getErros(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const errorStatuses = [
      STATUS.ERRO_ENVIO,
      STATUS.ERRO_PDF,
      STATUS.SEM_TELEFONE,
      STATUS.FUNCIONARIO_NAO_ENCONTRADO,
      STATUS.NOME_DIVERGENTE,
    ];

    let whereClause = { status: { in: errorStatuses } };

    if (search) {
      const searchNum = parseInt(search);
      whereClause = {
        ...whereClause,
        OR: [
          { nomeFuncionario: { contains: search, mode: 'insensitive' } },
          { mensagemErro: { contains: search, mode: 'insensitive' } },
        ],
      };
      
      // If search string is a valid number, we also search by exact 'codigoFuncionario' (matrícula)
      if (!isNaN(searchNum)) {
        whereClause.OR.push({ codigoFuncionario: searchNum });
      }
    }

    const [erros, total] = await Promise.all([
      prisma.envio.findMany({
        where: whereClause,
        select: {
          id: true,
          nomeFuncionario: true,
          cpf: true,
          competencia: true,
          arquivoPdf: true,
          status: true,
          dataProcessamento: true,
          mensagemErro: true,
        },
        orderBy: { dataProcessamento: 'desc' },
        skip,
        take: limit,
      }),
      prisma.envio.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: erros,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Erro ao buscar registros de erro:', err);
    res.status(500).json({ error: 'Falha ao obter erros' });
  }
}

module.exports = { getErros };
