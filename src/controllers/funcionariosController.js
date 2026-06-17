// src/controllers/funcionariosController.js
const prisma = require('../lib/prisma');

// List all employees with basic info
async function getFuncionarios(req, res) {
  try {
    const funcionarios = await prisma.funcionario.findMany({
      select: {
        cpf: true,
        codigo: true,
        nome: true,
        telefone: true,
        email: true,
        ativo: true,
        ultimaSincronizacao: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: 'asc' },
    });
    res.json(funcionarios);
  } catch (err) {
    console.error('Erro ao buscar funcionários:', err);
    res.status(500).json({ error: 'Falha ao obter funcionários' });
  }
}

module.exports = { getFuncionarios };
