// src/controllers/errosController.js
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

/**
 * Retrieve processing records that ended with an error.
 * Includes various error statuses defined in statusEnvio.js.
 */
async function getErros(req, res) {
  try {
    const errorStatuses = [
      STATUS.ERRO_ENVIO,
      STATUS.ERRO_PDF,
      STATUS.SEM_TELEFONE,
      STATUS.FUNCIONARIO_NAO_ENCONTRADO,
      STATUS.NOME_DIVERGENTE,
    ];
    const erros = await prisma.envio.findMany({
      where: { status: { in: errorStatuses } },
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
    });
    res.json(erros);
  } catch (err) {
    console.error('Erro ao buscar registros de erro:', err);
    res.status(500).json({ error: 'Falha ao obter erros' });
  }
}

module.exports = { getErros };
