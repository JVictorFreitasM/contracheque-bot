const whatsappService =
    require('../../services/whatsappService');

const logger =
    require('../../config/logger');

const STATUS =
    require('../../utils/statusEnvio');

async function enviarContracheque(
    telefone,
    caminhoPdf
) {

    logger.info(
        `[WHATSAPP] Iniciando envio para ${telefone}`
    );

    const resultado =
        await whatsappService.enviarPdf(
            telefone,
            caminhoPdf
        );

    if (!resultado.sucesso) {

        logger.error(
            `[WHATSAPP] Falha no envio para ${telefone}`
        );

        const erro =
            new Error(
                resultado.erro || 'Falha no envio'
            );

        erro.status =
            STATUS.ERRO_ENVIO;

        throw erro;

    }

    logger.info(
        `[WHATSAPP] PDF enviado com sucesso para ${telefone}`
    );

    return resultado;

}

module.exports =
    enviarContracheque;