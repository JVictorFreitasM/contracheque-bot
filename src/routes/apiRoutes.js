// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

// Controllers
const { getMetrics } = require('../controllers/metricsController');
const { getStatus, getHealth } = require('../controllers/statusController');
const handleUpload = require('../controllers/uploadsController');
const { preValidarUploads } = require('../controllers/preValidacaoController');
const { getPendentes } = require('../controllers/pendentesController');
const { getErros } = require('../controllers/errosController');
const { getLotes, getLoteProgresso, cancelLote, reprocessarLote, reprocessarErros, reprocessarPendentes, getReprocessamentosLote } = require('../controllers/lotesController');
const { getFuncionarios } = require('../controllers/funcionariosController');
const { getRelatorios } = require('../controllers/relatoriosController');
const { reenviarContracheque, reenviarTodosErros } = require('../controllers/reenvioController');
const { getProcessamentoStatus, streamProcessamentoStatus } = require('../controllers/processamentoController');

const monitoramentoController = (req, res) => {
  res.json({
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    jobs: { awaiting: 0, active: 0, completed: 0, failed: 0 }
  });
};
const configuracoesController = require('../controllers/configuracoesController');

// Rotas
router.get('/dashboard/indicadores', getMetrics);
router.get('/status/servicos', getStatus);
router.get('/health', getHealth);
router.post('/uploads', require('../middlewares/multerUpload'), handleUpload);
router.post('/uploads/pre-validar', require('../middlewares/multerUpload'), preValidarUploads);
router.get('/pendentes', getPendentes);
router.get('/erros', getErros);
router.get('/lotes', getLotes);
router.get('/lotes/:id/progresso', getLoteProgresso);
router.post('/lotes/:id/cancelar', cancelLote);
router.post('/lotes/:id/reprocessar', reprocessarLote);
router.post('/lotes/:id/reprocessar-erros', reprocessarErros);
router.post('/lotes/:id/reprocessar-pendentes', reprocessarPendentes);
router.get('/lotes/:id/reprocessamentos', getReprocessamentosLote);
router.get('/funcionarios', getFuncionarios);
router.get('/relatorios', getRelatorios);
router.post('/contracheques/:id/reenviar', reenviarContracheque);
router.post('/contracheques/reenviar-erros', reenviarTodosErros);
router.get('/monitoramento', monitoramentoController);
router.get('/processamento/status', getProcessamentoStatus);
router.get('/processamento/stream', streamProcessamentoStatus);
router.route('/configuracoes').get(configuracoesController.obterConfiguracoes).put(configuracoesController.atualizarConfiguracoes);

module.exports = router;
