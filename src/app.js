const express = require('express');
const path = require('path');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const envioContrachequeQueue = require('./queues/envioContrachequeQueue');
const processadorLote = require('./services/processadorLoteService');
const logger = require('./config/logger');
const apiRouter = require('./routes/apiRoutes'); // novo router API

const app = express();
app.use(express.json());

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(envioContrachequeQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Rotas API
app.use('/api', apiRouter);

// Rota manual para iniciar lote (mantida)
app.post('/api/processar-lote', async (req, res) => {
  logger.info('[API] Solicitação manual de processamento de lote recebida');
  try {
    // Executa em background para não travar a requisição
    processadorLote.processarPasta().catch(erro => {
      logger.error(`[API] Erro no processamento do lote: ${erro.message}`);
    });
    res.status(202).json({ message: 'Processamento do lote iniciado com sucesso.' });
  } catch (error) {
    logger.error(`[API] Erro ao iniciar processamento do lote: ${error.message}`);
    res.status(500).json({ error: 'Erro ao iniciar processamento.' });
  }
});

// Servir frontend estático (build)
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
// Fallback para SPA
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

module.exports = app;
