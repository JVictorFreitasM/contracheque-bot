const reenvioService = require('../services/reenvioService');

async function reenviarContracheque(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    await reenvioService.reenviar(id);

    return res.json({
      success: true,
      message: 'Contracheque enviado para fila de reenvio.'
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

async function reenviarTodosErros(req, res) {
  try {
    const adicionados = await reenvioService.reenviarTodosErros();

    return res.json({
      success: true,
      message: `${adicionados} contracheques enviados para fila de reenvio.`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  reenviarContracheque,
  reenviarTodosErros
};
