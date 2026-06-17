// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

// Controllers
const { getMetrics } = require('../controllers/metricsController');
const { getStatus } = require('../controllers/statusController');
const handleUpload = require('../controllers/uploadsController');
const { getPendentes } = require('../controllers/pendentesController');
const { getErros } = require('../controllers/errosController');
const { getLotes } = require('../controllers/lotesController');
const { getFuncionarios } = require('../controllers/funcionariosController');
const { getRelatorios } = require('../controllers/relatoriosController');

const monitoramentoController = (req, res) => {
  res.json({
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    jobs: { awaiting: 0, active: 0, completed: 0, failed: 0 }
  });
};
const configuracoesController = (req, res) => {
  if (req.method === 'GET') return res.json({});
  if (req.method === 'PUT') return res.json({ message: 'Configurações atualizadas' });
};

// Rotas
router.get('/dashboard/indicadores', getMetrics);
router.get('/status/servicos', getStatus);
router.post('/uploads', require('../middlewares/multerUpload'), handleUpload);
router.get('/pendentes', getPendentes);
router.get('/erros', getErros);
router.get('/lotes', getLotes);
router.get('/funcionarios', getFuncionarios);
router.get('/relatorios', getRelatorios);
router.get('/monitoramento', monitoramentoController);
router.route('/configuracoes').get(configuracoesController).put(configuracoesController);

module.exports = router;
