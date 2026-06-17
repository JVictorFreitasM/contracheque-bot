require('dotenv').config();

const logger = require('./config/logger');
const app = require('./app');
const agendador = require('./cron/agendador');

const PORT = process.env.PORT || 3000;

async function iniciar() {
    logger.info('=====================================');
    logger.info('BOT DE CONTRACHEQUES INICIADO');
    logger.info('=====================================');

    try {
        app.listen(PORT, () => {
            logger.info(`[SERVER] Express iniciado na porta ${PORT}`);
            logger.info(`[BULL BOARD] Disponível em http://localhost:${PORT}/admin/queues`);
        });

        // Inicia o agendador de tarefas
        await agendador.iniciarAgendamento();

        // Inicia o Worker
        require('./workers/envioContrachequeWorker');
        logger.info('[WORKER] Inicializado junto com a aplicação principal');

    } catch (erro) {
        logger.error(`Erro crítico ao iniciar: ${erro.message}`);
    }
}

iniciar();