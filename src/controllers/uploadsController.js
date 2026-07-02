// src/controllers/uploadsController.js
const agendamentoLoteRepository = require('../repositories/agendamentoLoteRepository');
const logger = require('../config/logger');

module.exports = async (req, res) => {
  // Multer middleware already saved files to uploads directory
  const fileNames = Array.isArray(req.files) ? req.files.map((file) => file.originalname) : [];

  const { dataHoraEnvio } = req.body || {};

  if (!dataHoraEnvio) {
    // Comportamento padrão: sem data/hora informada, o lote fica na pasta de
    // uploads para ser pego pelo agendamento padrão do cron (DIA_ENVIO_CONTRACHEQUES)
    return res.status(201).json({
      message: 'Upload concluído',
      files: fileNames
    });
  }

  const dataParseada = new Date(dataHoraEnvio);
  if (Number.isNaN(dataParseada.getTime())) {
    return res.status(400).json({ error: 'dataHoraEnvio inválida. Use um formato ISO 8601.' });
  }

  try {
    const agendamento = await agendamentoLoteRepository.criar({
      dataHoraEnvio: dataParseada,
      arquivos: fileNames,
      criadoPor: req.user?.email || null
    });

    logger.info(`[UPLOAD] Agendamento de lote criado (id=${agendamento.id}) para ${dataParseada.toISOString()} com ${fileNames.length} arquivo(s).`);

    res.status(201).json({
      message: 'Upload concluído e agendado com sucesso',
      files: fileNames,
      agendamento
    });
  } catch (erro) {
    logger.error(`[UPLOAD] Falha ao criar agendamento de lote: ${erro.message}`);
    res.status(500).json({ error: 'Upload concluído, mas falhou ao criar o agendamento do lote.' });
  }
};
