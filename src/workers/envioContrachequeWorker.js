const { Worker } = require('bullmq');
const n8nService = require('../services/n8nService');
const envioRepository = require('../repositories/envioRepository');
const arquivoService = require('../services/arquivoService');
const logger = require('../config/logger');
require('dotenv').config();

const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
};

logger.info('[WORKER] Iniciando...');

const worker = new Worker(
    'envio-contracheque',
    async (job) => {
        if (job.data.isTeste) {
            logger.info(`[WORKER - MODO TESTE] Iniciando processamento do job ${job.id}`);
        } else {
            logger.info(`[WORKER] Iniciando processamento do job ${job.id}`);
        }

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
            logger.info(`[WORKER] Enviando PDF para n8n via webhook: ${caminhoPdf}`);
            
            await n8nService.enviarPdf(telefone, caminhoPdf, nomeFuncionario, cpf, competencia);

            await envioRepository.criar({
                codigoFuncionario,
                cpf,
                competencia,
                nomeFuncionario,
                arquivoPdf: caminhoPdf,
                hashArquivo,
                status: 'ENVIADO'
            });

            // Mover para processados APENAS em caso de sucesso absoluto
            arquivoService.moverParaProcessados(caminhoPdf);

            logger.info(`[WORKER] Job ${job.id} concluído com sucesso. Arquivo movido para processados: ${caminhoPdf}`);

        } catch (erro) {
            logger.error(`[WORKER] Erro no job ${job.id}: ${erro.message}`);
            
            // Só move pra erro e registra se esgotaram as tentativas
            if (job.attemptsMade >= job.opts.attempts) {
                await envioRepository.criar({
                    codigoFuncionario,
                    cpf,
                    competencia,
                    nomeFuncionario,
                    arquivoPdf: caminhoPdf,
                    hashArquivo,
                    status: 'ERRO',
                    mensagemErro: erro.message
                });

                arquivoService.moverParaErro(caminhoPdf);
                logger.error(`[WORKER] Job ${job.id} falhou definitivamente. Arquivo movido para erro.`);
            }
            
            throw erro; // Lança erro para o BullMQ tentar novamente se necessário
        }
    },
    {
        connection,
        concurrency: 5
    }
);

worker.on('ready', () => {
    logger.info('[WORKER] Conectado ao Redis');
});

worker.on('completed', (job) => {
    logger.info(`[WORKER] Job ${job.id} finalizado`);
});

worker.on('failed', (job, err) => {
    logger.error(`[WORKER] Job ${job?.id} falhou na tentativa ${job?.attemptsMade}. Erro: ${err.message}`);
});

worker.on('error', (err) => {
    logger.error(`[WORKER] Erro crítico no worker: ${err.message}`);
});