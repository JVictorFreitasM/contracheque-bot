const envioRepository =
    require('../../repositories/envioRepository');

const arquivoService =
    require('../../services/arquivoService');

const logger =
    require('../../config/logger');

async function registrarErroProcessamento({
    caminhoPdf,
    status,
    mensagemErro,
    funcionario,
    dadosPdf
}) {

    logger.warn(
        `[PROCESSAMENTO] Registrando erro. Status: ${status}`
    );

    await envioRepository.criar({

        codigoFuncionario:
            funcionario?.codigo ??
            dadosPdf?.codigo,

        nomeFuncionario:
            funcionario?.nome ??
            dadosPdf?.nome,

        arquivoPdf:
            caminhoPdf,

        status,

        mensagemErro

    });

    arquivoService.moverParaErro(
        caminhoPdf
    );

    logger.warn(
        `[PROCESSAMENTO] Arquivo movido para pasta de erro: ${caminhoPdf}`
    );

    return {

        sucesso: false,

        status

    };

}

module.exports =
    registrarErroProcessamento;