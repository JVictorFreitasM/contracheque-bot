const { Worker } = require('bullmq');
const evolutionSenderService = require('../services/evolutionSenderService');
const configuracaoService = require('../services/configuracaoService');
const { criptografarPdf } = require('../services/pdfEncryptService');
const envioRepository = require('../repositories/envioRepository');
const funcionarioRepository = require('../repositories/funcionarioRepository');
const arquivoService = require('../services/arquivoService');
const logger = require('../config/logger');
const { STATUS } = require('../utils/statusEnvio');
// Fallback apenas para rodar fora do Docker (dev local); em produção as variáveis
// vêm do docker-compose (env_file/environment), nunca embutidas na imagem.
require('dotenv').config();

const connection = require('../config/redis');

logger.info('[WORKER] Iniciando...');

// TODO: opção B — hoje o intervalo é lido uma única vez na inicialização e
// usado para configurar o `limiter` do Worker. Mudanças em intervalo_envio
// feitas na tela de Configurações só têm efeito após reiniciar o worker
// (ex.: `docker restart contracheque-worker`), pois o BullMQ não permite
// alterar o limiter de um Worker já criado sem fechá-lo e recriá-lo.
async function iniciarWorker() {
    const config = await configuracaoService.obterConfiguracao();
    const intervaloMs = (config.intervalo_envio || 30) * 1000;

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
            traceId
        } = job.data;
        let { envioId } = job.data; // Novo campo injetado em caso de reenvio; reatribuído após criação do registro

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

            const envioRecord = envioId ? await envioRepository.buscarPorId(envioId) : null;
        if (envioRecord && envioRecord.status === STATUS.PROCESSANDOFINALIZADOCANCELADO) {
            logger.info(`[WORKER] Job ${job.id} cancelado antes do envio porque o lote foi interrompido.`);
            return;
        }

        const funcionario = await funcionarioRepository.buscarPorCodigo(codigoFuncionario);
        if (funcionario?.bloqueia_contracheque) {
            logger.info(JSON.stringify({
                traceId,
                codigoFuncionario,
                nomeFuncionario,
                status: 'BLOQUEADO',
                arquivo: caminhoPdf,
                mensagem: 'Envio bloqueado pelo sistema (funcionário opt-out)',
                timestamp: new Date().toISOString()
            }));

            if (envioId) {
                await envioRepository.atualizar(envioId, {
                    status: 'BLOQUEADO',
                    arquivoPdf: caminhoPdf,
                    mensagemErro: null,
                    ultimoErro: null,
                    dataEnvio: null
                });
            }

            try {
                const novoCaminhoBloqueado = arquivoService.moverParaProcessados(caminhoPdf);
                if (envioId) {
                    await envioRepository.atualizar(envioId, { arquivoPdf: novoCaminhoBloqueado });
                }
            } catch (erroMove) {
                logger.error(`[WORKER] Envio ${envioId} marcado como BLOQUEADO, mas falhou ao mover arquivo para processados/: ${erroMove.message}. Arquivo permanece em uploads/.`);
            }

            return;
        }

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

            const whatsappMessageId = response?.key?.id || null;

            // 1. Marca ENVIADO no banco IMEDIATAMENTE após o sucesso do envio,
            //    antes de qualquer operação de arquivo que possa falhar.
            if (envioId) {
                // Se é um reenvio, o registro já existe, basta atualizar
                await envioRepository.atualizar(envioId, {
                    status: 'ENVIADO',
                    arquivoPdf: caminhoPdf,
                    mensagemErro: null,
                    ultimoErro: null,
                    dataEnvio: new Date(),
                    whatsappMessageId,
                    statusEntregaWhatsapp: null,
                    dataEntregaWhatsapp: null,
                    dataLeituraWhatsapp: null
                });
            } else {
                // Primeiro envio, deve criar o registro
                const envioCriado = await envioRepository.criar({
                    codigoFuncionario,
                    cpf,
                    competencia,
                    nomeFuncionario,
                    arquivoPdf: caminhoPdf,
                    hashArquivo,
                    status: 'ENVIADO',
                    dataEnvio: new Date(),
                    whatsappMessageId
                });
                envioId = envioCriado.id;
            }

            // 2. Só DEPOIS do status estar salvo, tenta mover o arquivo.
            //    Falha aqui é só "limpeza pendente" — não deve derrubar o job nem
            //    fazer o BullMQ reprocessar um envio que já foi concluído com sucesso.
            try {
                const novoCaminhoEnviado = arquivoService.moverParaProcessados(caminhoPdf);
                await envioRepository.atualizar(envioId, { arquivoPdf: novoCaminhoEnviado });
            } catch (erroMove) {
                logger.error(`[WORKER] Envio ${envioId} concluído com sucesso, mas falhou ao mover arquivo para processados/: ${erroMove.message}. Arquivo permanece em uploads/.`);
            }

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


        } catch (erro) {
            logger.error(`[WORKER] Erro no job ${job.id}: ${erro.message}`);
            
            // Só move pra erro e registra se esgotaram as tentativas
            if (job.attemptsMade >= job.opts.attempts) {
                if (envioId) {
                    await envioRepository.atualizar(envioId, {
                        status: 'ERRO',
                        arquivoPdf: caminhoPdf,
                        mensagemErro: erro.message,
                        ultimoErro: erro.message
                    });
                } else {
                    const envioCriado = await envioRepository.criar({
                        codigoFuncionario,
                        cpf,
                        competencia,
                        nomeFuncionario,
                        arquivoPdf: caminhoPdf,
                        hashArquivo,
                        status: 'ERRO',
                        mensagemErro: erro.message
                    });
                    envioId = envioCriado.id;
                }

                try {
                    const novoCaminhoErro = arquivoService.moverParaErro(caminhoPdf);
                    await envioRepository.atualizar(envioId, { arquivoPdf: novoCaminhoErro });
                } catch (erroMove) {
                    logger.error(`[WORKER] Envio ${envioId} marcado como ERRO, mas falhou ao mover arquivo para erro/: ${erroMove.message}. Arquivo permanece em uploads/.`);
                }

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
        concurrency: 1,
        limiter: {
            max: 1,
            duration: intervaloMs
        }
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

    logger.info(`[WORKER] Rate limiter configurado: 1 envio a cada ${intervaloMs / 1000}s`);

    return worker;
}

iniciarWorker().catch((erro) => {
    logger.error(`[WORKER] Falha ao iniciar worker: ${erro.message}`);
    process.exit(1);
});