require('dotenv').config();

const logger =
    require('./config/logger');

const processadorPasta =
    require('./services/processadorPastaService');

async function iniciar() {

    logger.info(
        '====================================='
    );

    logger.info(
        'BOT DE CONTRACHEQUES INICIADO'
    );

    logger.info(
        '====================================='
    );

    try {

        await processadorPasta.processarPasta();

    } catch (erro) {

        logger.error(
            erro
        );

    }

}

iniciar();