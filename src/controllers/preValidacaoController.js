const preValidacaoService = require('../services/preValidacaoService');

async function preValidarUploads(req, res) {
  try {
    const resultados = await preValidacaoService.preValidarArquivos(req.files || []);
    res.json(resultados);
  } catch (err) {
    console.error('[PRE-VALIDACAO] Erro ao validar arquivos:', err);
    res.status(500).json({ error: 'Erro ao pré-validar arquivos.' });
  }
}

module.exports = {
  preValidarUploads
};
