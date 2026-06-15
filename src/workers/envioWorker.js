const { Worker } =
    require('bullmq');

const connection =
    require('../config/redis');

const n8nService =
    require('../services/n8nService');

const logger =
    require('../config/logger');

new Worker(

    'envio-contracheque',

    async (job) => {

        logger.info(
            `[WORKER] Processando envio para ${job.data.telefone}`
        );

        await n8nService.enviarPdf(

            job.data.telefone,

            job.data.caminhoPdf

        );

        logger.info(
            `[WORKER] PDF enviado para ${job.data.telefone}`
        );

    },

    {
        connection
    }

);

logger.info(
    '[WORKER] Worker iniciado'
);