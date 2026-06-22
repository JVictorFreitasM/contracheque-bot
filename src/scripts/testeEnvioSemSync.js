require('dotenv').config();
const logger = require('../config/logger');
const processadorLote = require('../services/processadorLoteService');

async function iniciarTesteSemSync() {
    logger.info('=====================================');
    logger.info('INICIANDO TESTE (SEM SINCRONIZAÇÃO ERP)');
    logger.info('=====================================');

    try {
        // Importa e inicializa o worker temporariamente para que o processo de teste seja autossuficiente
        require('../workers/envioContrachequeWorker');
        logger.info('[TESTE] Worker iniciado localmente para o teste.');

        // Pulando a sincronização com ERP intencionalmente
        logger.info('[TESTE] Sincronização com o ERP pulada. Usando apenas dados locais do Banco.');

        await processadorLote.processarPasta({
            ignorarDataEnvio: true,
            isTeste: true
        });

        logger.info('[TESTE] Processamento do lote iniciado. Acompanhe os logs do worker para finalização.');

    } catch (erro) {
        logger.error(`[TESTE] Erro ao executar teste: ${erro.message}`);
    }
}

iniciarTesteSemSync();
