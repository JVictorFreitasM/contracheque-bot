// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

const { idpAuth } = require('../config/idpAuth');
const { requireAuth } = idpAuth;

// Controllers
const { getMe } = require('../controllers/authController');
const { getMetrics } = require('../controllers/metricsController');
const { getStatus, getHealth } = require('../controllers/statusController');
const handleUpload = require('../controllers/uploadsController');
const { preValidarUploads } = require('../controllers/preValidacaoController');
const { getPendentes } = require('../controllers/pendentesController');
const { getErros } = require('../controllers/errosController');
const { getLotes, getLoteProgresso, cancelLote, reprocessarLote, reprocessarErros, reprocessarPendentes, getReprocessamentosLote } = require('../controllers/lotesController');
const { getFuncionarios, atualizarBloqueioContracheque } = require('../controllers/funcionariosController');
const { getRelatorios, exportarRelatorios } = require('../controllers/relatoriosController');
const { reenviarContracheque, reenviarTodosErros } = require('../controllers/reenvioController');
const { getProcessamentoStatus, streamProcessamentoStatus } = require('../controllers/processamentoController');
const { receberWebhook } = require('../controllers/webhookController');
const { getStatus: getWkStatus } = require('../controllers/wkStatusController');
const { getAgendamentos, cancelarAgendamento } = require('../controllers/agendamentosController');

const monitoramentoController = (req, res) => {
  res.json({
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    jobs: { awaiting: 0, active: 0, completed: 0, failed: 0 }
  });
};
const configuracoesController = require('../controllers/configuracoesController');

// Rotas
router.get('/me', requireAuth, getMe);
router.get('/dashboard/indicadores', requireAuth, getMetrics);
router.get('/status/servicos', requireAuth, getStatus);
router.get('/health', requireAuth, getHealth);
router.post('/uploads', requireAuth, require('../middlewares/multerUpload'), handleUpload);
router.post('/uploads/pre-validar', requireAuth, require('../middlewares/multerUpload'), preValidarUploads);
router.get('/pendentes', requireAuth, getPendentes);
router.get('/erros', requireAuth, getErros);
router.get('/lotes', requireAuth, getLotes);
router.get('/lotes/:id/progresso', requireAuth, getLoteProgresso);
router.post('/lotes/:id/cancelar', requireAuth, cancelLote);
router.post('/lotes/:id/reprocessar', requireAuth, reprocessarLote);
router.post('/lotes/:id/reprocessar-erros', requireAuth, reprocessarErros);
router.post('/lotes/:id/reprocessar-pendentes', requireAuth, reprocessarPendentes);
router.get('/lotes/:id/reprocessamentos', requireAuth, getReprocessamentosLote);
router.get('/funcionarios', requireAuth, getFuncionarios);
router.patch('/funcionarios/:id/bloqueio-contracheque', requireAuth, atualizarBloqueioContracheque);
router.get('/relatorios', requireAuth, getRelatorios);
router.get('/relatorios/exportar', requireAuth, exportarRelatorios);
router.post('/contracheques/:id/reenviar', requireAuth, reenviarContracheque);
router.post('/contracheques/reenviar-erros', requireAuth, reenviarTodosErros);
router.get('/monitoramento', requireAuth, monitoramentoController);
router.get('/processamento/status', requireAuth, getProcessamentoStatus);
router.get('/processamento/stream', requireAuth, streamProcessamentoStatus);
router.route('/configuracoes').get(requireAuth, configuracoesController.obterConfiguracoes).put(requireAuth, configuracoesController.atualizarConfiguracoes);
// NÃO aplicar requireAuth aqui: a Evolution API não faz login via IdP, ela autentica
// via EVOLUTION_WEBHOOK_TOKEN próprio (query string, validado em webhookController).
// Ver OS 08-B, seção 2.
router.post('/webhooks/evolution', receberWebhook);
router.get('/wk/status', requireAuth, getWkStatus);
router.get('/agendamentos', requireAuth, getAgendamentos);
router.post('/agendamentos/:id/cancelar', requireAuth, cancelarAgendamento);

module.exports = router;
