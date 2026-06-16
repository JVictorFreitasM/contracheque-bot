const { Worker } = require('bullmq');
const n8nService =
    require('../services/n8nService');

const envioRepository =
    require('../repositories/envioRepository');

const arquivoService =
    require('../services/arquivoService');

require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
};

console.log('[WORKER] Iniciando...');

const worker = new Worker(
    'envio-contracheque',

    async (job) => {

        console.log(
            `[WORKER] Processando job ${job.id}`
        );

        const {
            codigoFuncionario,
            nomeFuncionario,
            cpf,
            competencia,
            hashArquivo,
            telefone,
            caminhoPdf
        } = job.data;

        try {

            await n8nService.enviarPdf(
                telefone,
                caminhoPdf
            );

            await envioRepository.criar({

                codigoFuncionario,

                cpf,

                competencia,

                nomeFuncionario,

                arquivoPdf:
                    caminhoPdf,

                hashArquivo,

                status:
                    'ENVIADO'

            });

            logger.info(
                `[PROCESSADOR] Job enviado para fila: ${caminhoPdf}`
            );

        } catch (erro) {

            await envioRepository.criar({

                codigoFuncionario,

                cpf,

                competencia,

                nomeFuncionario,

                arquivoPdf:
                    caminhoPdf,

                hashArquivo,

                status:
                    'ERRO',

                mensagemErro:
                    erro.message

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

            console.log(
                `[WORKER] Arquivo movido para erro`
            );
        }

    },

    {
        connection,
        concurrency: 5
    }
);

worker.on('ready', () => {
    console.log(
        '[WORKER] Conectado ao Redis'
    );
});

worker.on('completed', (job) => {
    console.log(
        `[WORKER] Job ${job.id} concluído`
    );
});

worker.on('failed', (job, err) => {
    console.error(
        `[WORKER] Job ${job?.id} falhou`
    );

    console.error(err);
});

worker.on('error', (err) => {
    console.error(
        '[WORKER] Erro'
    );

    console.error(err);
});