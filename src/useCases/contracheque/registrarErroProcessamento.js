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
    dadosPdf,
    hashArquivo
}) {

    logger.warn(
        `[PROCESSAMENTO] Registrando erro. Status: ${status}`
    );

    const novoCaminho =
        arquivoService.moverParaErro(
            caminhoPdf
        );

    await envioRepository.criar({

        codigoFuncionario:
            funcionario?.codigo ??
            dadosPdf?.codigo,

        cpf:
            funcionario?.cpf,

        competencia:
            dadosPdf?.competencia,

        nomeFuncionario:
            funcionario?.nome ??
            dadosPdf?.nome,

        arquivoPdf:
            novoCaminho,

        hashArquivo,

        status,

        mensagemErro

    });

    logger.warn(
        `[PROCESSAMENTO] Arquivo movido para pasta de erro: ${novoCaminho}`
    );

    return {

        sucesso: false,

        status

    };

}

module.exports =
    registrarErroProcessamento;