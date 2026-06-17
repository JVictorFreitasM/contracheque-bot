const cron = require('node-cron');
const Redis = require('ioredis');
const logger = require('../config/logger');
const processadorLote = require('../services/processadorLoteService');
const wkService = require('../services/wkService');
require('dotenv').config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
});

async function iniciarAgendamento() {
    logger.info('[CRON] Agendador iniciado');

    // Executa todo dia às 03:00 da manhã para sincronização de ERP
    cron.schedule('0 3 * * *', async () => {
        logger.info('[CRON] Disparando sincronização diária programada (03:00)');
        try {
            await wkService.sincronizarFuncionarios();
        } catch (erro) {
            logger.error(`[CRON] Erro na sincronização diária: ${erro.message}`);
        }
    });

    // Executa todo dia à meia-noite
    cron.schedule('0 0 * * *', async () => {
        await verificarEProcessar();
    });

    // Também verifica na inicialização, caso o app tenha reiniciado no meio do dia
    await verificarEProcessar();
}

async function verificarEProcessar() {
    try {
        const diaAtual = new Date().getDate();
        const diaConfigurado = parseInt(process.env.DIA_ENVIO_CONTRACHEQUES || '5', 10);

        if (diaAtual === diaConfigurado) {
            const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const chaveRedis = `lote_processado_${dataHoje}`;

            const jaProcessou = await redis.get(chaveRedis);

            if (!jaProcessou) {
                logger.info(`[CRON] Hoje é dia ${diaConfigurado}. Iniciando sincronização e processamento do lote...`);
                
                // Marca como processado com expiração de 24 horas (86400 segundos)
                await redis.set(chaveRedis, 'true', 'EX', 86400);

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
                    await redis.del(chaveRedis);
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
    verificarEProcessar
};
