const { Worker } = require('bullmq');
const evolutionSenderService = require('../services/evolutionSenderService');
const { criptografarPdf } = require('../services/pdfEncryptService');
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
            caminhoPdf,
            envioId, // Novo campo injetado em caso de reenvio
            traceId
        } = job.data;

        let caminhoFinal = null;
        try {
            logger.info(JSON.stringify({
                traceId,
                cpf,
                telefone,
                arquivo: caminhoPdf,
                status: "processing",
                timestamp: new Date().toISOString()
            }));

            // Criptografar PDF
            const resultado = await criptografarPdf(
                caminhoPdf,
                caminhoPdf.replace('.pdf', '_secure.pdf'),
                cpf
            );
            caminhoFinal = resultado.caminhoSaida;
            
            const response = await evolutionSenderService.enviarPdfDireto({
                telefone,
                caminhoPdf: caminhoFinal,
                nomeFuncionario,
                competencia
            });



            if (envioId) {
                // Se é um reenvio, o registro já existe, basta atualizar
                await envioRepository.atualizar(envioId, {
                    status: 'ENVIADO',
                    mensagemErro: null,
                    ultimoErro: null,
                    dataEnvio: new Date()
                });
            } else {
                // Primeiro envio, deve criar o registro
                await envioRepository.criar({
                    codigoFuncionario,
                    cpf,
                    competencia,
                    nomeFuncionario,
                    arquivoPdf: caminhoPdf,
                    hashArquivo,
                    status: 'ENVIADO',
                    dataEnvio: new Date()
                });
            }

            arquivoService.moverParaProcessados(caminhoPdf);

            logger.info(JSON.stringify({
                traceId,
                cpf,
                telefone,
                arquivo: caminhoPdf,
                status: "sent",
                timestamp: new Date().toISOString(),
                evolutionResponse: response,
                retryCount: job.attemptsMade
            }));

            // Delay de 1 segundo para rate limit (1 envio/seg)
            await new Promise(r => setTimeout(r, 1000));

        } catch (erro) {
            logger.error(`[WORKER] Erro no job ${job.id}: ${erro.message}`);
            
            // Só move pra erro e registra se esgotaram as tentativas
            if (job.attemptsMade >= job.opts.attempts) {
                if (envioId) {
                    await envioRepository.atualizar(envioId, {
                        status: 'ERRO',
                        mensagemErro: erro.message,
                        ultimoErro: erro.message
                    });
                } else {
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
                }

                arquivoService.moverParaErro(caminhoPdf);
                logger.error(JSON.stringify({
                    traceId,
                    cpf,
                    telefone,
                    arquivo: caminhoPdf,
                    status: "failed",
                    timestamp: new Date().toISOString(),
                    evolutionResponse: erro.response ? erro.response.data : erro.message,
                    retryCount: job.attemptsMade
                }));
            }
            
            throw erro; // Lança erro para o BullMQ tentar novamente se necessário
        } finally {
            // Apagar arquivo criptografado temporário para economizar espaço
            const fs = require('fs');
            if (caminhoFinal && fs.existsSync(caminhoFinal)) {
                fs.unlinkSync(caminhoFinal);
            }
        }
    },
    {
        connection,
        concurrency: 1
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