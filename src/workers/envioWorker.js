const { Worker } =
    require('bullmq');

const connection =
    require('../config/redis');

const whatsappService =
    require('../services/whatsappService');

const logger =
    require('../config/logger');

new Worker(

    'envio-contracheque',

    async (job) => {

        logger.info(
            `[WORKER] Processando envio para ${job.data.telefone}`
        );

        await whatsappService.enviarPdf(

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