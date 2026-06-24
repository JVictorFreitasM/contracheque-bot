// src/controllers/funcionariosController.js
const prisma = require('../lib/prisma');

async function getFuncionarios(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    let whereClause = {};

    if (search) {
      const searchNum = parseInt(search);
      whereClause = {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
        ],
      };
      
      // If search string is a valid number, we also search by exact 'codigo' (matrícula)
      if (!isNaN(searchNum)) {
        whereClause.OR.push({ codigo: searchNum });
      }
    }

    const [funcionarios, total] = await Promise.all([
      prisma.funcionario.findMany({
        where: whereClause,
        select: {
          cpf: true,
          codigo: true,
          nome: true,
          telefone: true,
          email: true,
          ativo: true,
          bloqueia_contracheque: true,
          ultimaSincronizacao: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { nome: 'asc' },
        skip,
        take: limit,
      }),
      prisma.funcionario.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      data: funcionarios,
      page,
      limit,
      total,
      totalPages
    });
  } catch (err) {
    console.error('Erro ao buscar funcionários:', err);
    res.status(500).json({ error: 'Falha ao obter funcionários' });
  }
}

async function atualizarBloqueioContracheque(req, res) {
  try {
    const codigo = parseInt(req.params.id, 10);
    const { bloqueia_contracheque } = req.body;

    if (typeof bloqueia_contracheque !== 'boolean') {
      return res.status(400).json({ error: 'bloqueia_contracheque deve ser booleano' });
    }

    await prisma.funcionario.update({
      where: { codigo },
      data: { bloqueia_contracheque }
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao atualizar bloqueio de contracheque:', err);
    res.status(500).json({ error: 'Falha ao atualizar bloqueio de contracheque' });
  }
}

module.exports = { getFuncionarios, atualizarBloqueioContracheque };
