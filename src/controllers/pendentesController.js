// src/controllers/pendentesController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

// Lista PDFs pendentes (status PENDENTE)
async function getPendentes(req, res) {
  try {
    const pendentes = await prisma.envio.findMany({
      where: { status: STATUS.PENDENTE },
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
    });
    res.json(pendentes);
  } catch (err) {
    console.error('Erro ao buscar pendentes:', err);
    res.status(500).json({ error: 'Falha ao obter pendentes' });
  }
}

module.exports = { getPendentes };
