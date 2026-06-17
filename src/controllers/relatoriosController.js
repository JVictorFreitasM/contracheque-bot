// src/controllers/relatoriosController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

async function getRelatorios(req, res) {
  try {
    const totalEnvios = await prisma.envio.count();
    const porStatus = await prisma.envio.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const totalFuncionarios = await prisma.funcionario.count();
    const ativos = await prisma.funcionario.count({ where: { ativo: true } });
    const inativos = await prisma.funcionario.count({ where: { ativo: false } });

    const statusMap = porStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    res.json({
      totalEnvios,
      status: {
        pendente: statusMap[STATUS.PENDENTE] || 0,
        processando: statusMap[STATUS.PROCESSANDO] || 0,
        enviado: statusMap[STATUS.ENVIADO] || 0,
        erro: statusMap[STATUS.ERRO] || 0,
      },
      totalFuncionarios,
      funcionarios: {
        ativos,
        inativos,
      },
    });
  } catch (err) {
    console.error('Erro ao buscar relatórios:', err);
    res.status(500).json({ error: 'Falha ao obter relatórios' });
  }
}

module.exports = { getRelatorios };
