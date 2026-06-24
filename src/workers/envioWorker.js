const { Worker } =
    require('bullmq');

const connection =
    require('../config/redis');

const evolutionSenderService =
    require('../services/evolutionSenderService');

const configuracaoService =
    require('../services/configuracaoService');

const logger =
    require('../config/logger');

function esperar(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

new Worker(

    'envio-contracheque',

    async (job) => {

        logger.info(
            `[WORKER] Processando envio para ${job.data.telefone}`
        );

        await evolutionSenderService.enviarPdfDireto({
            telefone: job.data.telefone,
            caminhoPdf: job.data.caminhoPdf,
            nomeFuncionario: job.data.nomeFuncionario,
            competencia: job.data.competencia
        });

        logger.info(
            `[WORKER] PDF enviado para ${job.data.telefone}`
        );

        const config =
            await configuracaoService.obterConfiguracao();
        const intervalo =
            config.intervalo_envio || 30;
        logger.info(
            `[WORKER] Aguardando ${intervalo}s`
        );
        await esperar(
            intervalo * 1000
        );

    },

    {
        connection,
        concurrency: 1
    }

);

logger.info(
    '[WORKER] Worker iniciado'
);