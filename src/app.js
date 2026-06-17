const express = require('express');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const envioContrachequeQueue = require('./queues/envioContrachequeQueue');
const processadorLote = require('./services/processadorLoteService');
const logger = require('./config/logger');

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

// Rota manual
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

module.exports = app;
