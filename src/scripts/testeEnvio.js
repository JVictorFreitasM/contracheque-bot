require('dotenv').config();
const logger = require('../config/logger');
const processadorLote = require('../services/processadorLoteService');
const wkService = require('../services/wkService');

async function iniciarTeste() {
    logger.info('=====================================');
    logger.info('INICIANDO MODO DE TESTE (ENVIO IMEDIATO)');
    logger.info('=====================================');

    try {
        // Importa e inicializa o worker temporariamente para que o processo de teste seja autossuficiente
        require('../workers/envioContrachequeWorker');
        logger.info('[TESTE] Worker iniciado localmente para o teste.');

        logger.info('[TESTE] Forçando sincronização prévia com ERP...');
        await wkService.sincronizarFuncionarios();
        logger.info('[TESTE] Sincronização prévia concluída.');

        await processadorLote.processarPasta({
            ignorarDataEnvio: true,
            isTeste: true
        });

        logger.info('[TESTE] Processamento do lote iniciado. Acompanhe os logs do worker para finalização.');

    } catch (erro) {
        logger.error(`[TESTE] Erro ao executar teste: ${erro.message}`);
    }
}

iniciarTeste();
