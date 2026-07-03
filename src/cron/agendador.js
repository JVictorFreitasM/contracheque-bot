const cron = require('node-cron');
const logger = require('../config/logger');
const processadorLote = require('../services/processadorLoteService');
const wkService = require('../services/wkService');
const redis = require('../config/redis');
const agendamentoLoteRepository = require('../repositories/agendamentoLoteRepository');
const configuracaoService = require('../services/configuracaoService');
// Fallback apenas para rodar fora do Docker (dev local); em produção as variáveis
// vêm do docker-compose (env_file/environment), nunca embutidas na imagem.
require('dotenv').config();

async function iniciarAgendamento() {
    logger.info('[CRON] Agendador iniciado');

    // Executa todo dia à meia-noite
    cron.schedule('0 0 * * *', async () => {
        await verificarEProcessar();
    });

    // Verifica a cada minuto se há agendamentos de lote (upload com data/hora
    // específica) prontos para disparar
    cron.schedule('* * * * *', async () => {
        await verificarAgendamentosLote();
    });

    // Verifica a cada minuto se o horário configurado para a sincronização
    // diária com o ERP (Configuracao.sincronizacao_hora/minuto) já chegou
    cron.schedule('* * * * *', async () => {
        await verificarESincronizarErp();
    });

    // Também verifica na inicialização, caso o app tenha reiniciado no meio do dia
    // ou exatamente no minuto configurado para a sincronização
    await verificarEProcessar();
    await verificarESincronizarErp();
}

async function verificarESincronizarErp() {
    try {
        const config = await configuracaoService.obterConfiguracao();

        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        if (horaAtual === config.sincronizacao_hora && minutoAtual === config.sincronizacao_minuto) {
            const dataHoje = agora.toISOString().split('T')[0];
            const chaveRedis = `sincronizacao_erp_executada_${dataHoje}`;

            let jaExecutou = false;
            try {
                jaExecutou = await redis.get(chaveRedis);
            } catch (redisError) {
                logger.error(`[CRON] Falha ao acessar o Redis para checar sincronização: ${redisError.message}`);
                return;
            }

            if (!jaExecutou) {
                try {
                    await redis.set(chaveRedis, 'true', 'EX', 86400);
                } catch (setError) {
                    logger.error(`[CRON] Falha ao marcar sincronização no Redis: ${setError.message}`);
                    return;
                }

                logger.info(`[CRON] Disparando sincronização diária programada (${String(config.sincronizacao_hora).padStart(2, '0')}:${String(config.sincronizacao_minuto).padStart(2, '0')})`);
                try {
                    await wkService.sincronizarFuncionarios();
                } catch (erro) {
                    logger.error(`[CRON] Erro na sincronização diária: ${erro.message}`);
                    // Remove a marcação para permitir nova tentativa no próximo minuto, caso o erro seja transitório
                    try {
                        await redis.del(chaveRedis);
                    } catch (delError) {
                        logger.error(`[CRON] Falha ao remover marcação do Redis após erro: ${delError.message}`);
                    }
                }
            }
        }
    } catch (erro) {
        logger.error(`[CRON] Erro ao verificar horário de sincronização: ${erro.message}`);
    }
}

async function verificarAgendamentosLote() {
    try {
        const agora = new Date();
        const pendentesVencidos = await agendamentoLoteRepository.buscarPendentesVencidos(agora);

        for (const agendamento of pendentesVencidos) {
            const chaveLock = `agendamento_lote_lock_${agendamento.id}`;

            let lockAdquirido = false;
            try {
                // SET NX EX: só adquire a trava se ninguém mais estiver processando este agendamento
                const resultado = await redis.set(chaveLock, 'true', 'EX', 300, 'NX');
                lockAdquirido = resultado === 'OK';
            } catch (redisError) {
                logger.error(`[CRON] Falha ao acessar o Redis para o agendamento ${agendamento.id}: ${redisError.message}`);
                continue;
            }

            if (!lockAdquirido) {
                continue;
            }

            logger.info(`[CRON] Disparando agendamento de lote ${agendamento.id} (previsto para ${agendamento.dataHoraEnvio.toISOString()}), ${agendamento.arquivos.length} arquivo(s).`);

            try {
                await processadorLote.processarPasta({ arquivos: agendamento.arquivos });
                await agendamentoLoteRepository.marcarExecutado(agendamento.id);
                logger.info(`[CRON] Agendamento de lote ${agendamento.id} concluído.`);
            } catch (erro) {
                logger.error(`[CRON] Erro ao processar agendamento de lote ${agendamento.id}: ${erro.message}`);
            }
        }
    } catch (erro) {
        logger.error(`[CRON] Erro ao verificar agendamentos de lote: ${erro.message}`);
    }
}

async function verificarEProcessar() {
    try {
        const diaAtual = new Date().getDate();
        const diaConfigurado = parseInt(process.env.DIA_ENVIO_CONTRACHEQUES || '5', 10);

        if (diaAtual === diaConfigurado) {
            const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const chaveRedis = `lote_processado_${dataHoje}`;

            let jaProcessou = false;
            try {
              jaProcessou = await redis.get(chaveRedis);
            } catch (redisError) {
              logger.error(`[CRON] Falha ao acessar o Redis: ${redisError.message}`);
              return;
            }

            if (!jaProcessou) {
                logger.info(`[CRON] Hoje é dia ${diaConfigurado}. Iniciando sincronização e processamento do lote...`);
                
                // Marca como processado com expiração de 24 horas (86400 segundos)
                try {
                  await redis.set(chaveRedis, 'true', 'EX', 86400);
                } catch (setError) {
                  logger.error(`[CRON] Falha ao atualizar o Redis: ${setError.message}`);
                  return;
                }

                // Dispara a sincronização FORÇADA ANTES do lote, para garantir dados atualizados
                try {
                    await wkService.sincronizarFuncionarios();
                    
                    // Se sincronizou com sucesso, dispara o processamento
                    processadorLote.processarPasta().catch(erro => {
                        logger.error(`[CRON] Erro no processamento do lote: ${erro.message}`);
                    });
                } catch (syncError) {
                    logger.error(`[CRON] A sincronização do ERP falhou! O processamento de PDFs foi ABORTADO para evitar envio com dados obsoletos.`);
                    // Remove a marcação do redis, permitindo que tente de novo se corrigirem o problema
                    try {
                      await redis.del(chaveRedis);
                    } catch (delError) {
                      logger.error(`[CRON] Falha ao remover a marcação do Redis: ${delError.message}`);
                    }
                }

            } else {
                logger.info(`[CRON] O processamento do dia ${dataHoje} já foi realizado anteriormente.`);
            }
        } else {
            logger.info(`[CRON] Hoje é dia ${diaAtual}, o dia de envio configurado é ${diaConfigurado}. Aguardando.`);
        }
    } catch (erro) {
        logger.error(`[CRON] Erro ao verificar e processar agendamento: ${erro.message}`);
    }
}

module.exports = {
    iniciarAgendamento,
    verificarEProcessar,
    verificarAgendamentosLote,
    verificarESincronizarErp
};
