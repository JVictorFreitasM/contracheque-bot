const pdfService =
    require('../../services/pdfService');

const logger =
    require('../../config/logger');

const STATUS =
    require('../../utils/statusEnvio');

async function extrairDadosPdf(
    caminhoPdf
) {

    logger.info(
        `[PDF] Extraindo texto do arquivo: ${caminhoPdf}`
    );

    const texto =
        await pdfService.extrairTextoDoPdf(
            caminhoPdf
        );

    const dadosPdf =
        pdfService.extrairFuncionario(
            texto
        );

    if (!dadosPdf) {

        logger.warn(
            `[PDF] Funcionário não identificado no arquivo: ${caminhoPdf}`
        );

        const erro =
            new Error(
                'Funcionário não identificado no PDF'
            );

        erro.status =
            STATUS.ERRO_PDF;

        throw erro;

    }

    logger.info(
        `[PDF] Código: ${dadosPdf.codigo} | Nome: ${dadosPdf.nome} | Competencia ${dadosPdf.competencia}`
    );

    return dadosPdf;

}

module.exports =
    extrairDadosPdf;