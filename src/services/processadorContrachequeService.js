const logger =
    require('../config/logger');

const envioRepository =
    require('../repositories/envioRepository');

const arquivoService =
    require('./arquivoService');

const STATUS =
    require('../utils/statusEnvio');

const extrairDadosPdf =
    require('../useCases/contracheque/extrairDadosPdf');

const localizarFuncionario =
    require('../useCases/contracheque/localizarFuncionario');

const validarNomeFuncionario =
    require('../useCases/contracheque/validarNomeFuncionario');

const validarTelefoneFuncionario =
    require('../useCases/contracheque/validarTelefoneFuncionario');

const enviarContracheque =
    require('../useCases/contracheque/enviarContracheque');

const registrarErroProcessamento =
    require('../useCases/contracheque/registrarErroProcessamento');

async function processarArquivo(
    caminhoPdf
) {

    let dadosPdf = null;
    let funcionario = null;

    try {

        logger.info(
            `[PROCESSADOR] Iniciando processamento do arquivo: ${caminhoPdf}`
        );

        dadosPdf =
            await extrairDadosPdf(
                caminhoPdf
            );

        funcionario =
            await localizarFuncionario(
                dadosPdf
            );

        validarNomeFuncionario(
            funcionario,
            dadosPdf
        );

        const telefone =
            validarTelefoneFuncionario(
                funcionario
            );

        await enviarContracheque(
            funcionario,
            telefone,
            caminhoPdf
        );

        await envioRepository.criar({

            codigoFuncionario:
                funcionario.codigo,

            nomeFuncionario:
                funcionario.nome,

            arquivoPdf:
                caminhoPdf,

            status:
                STATUS.PROCESSADO

        });

        arquivoService.moverParaProcessados(
            caminhoPdf
        );

        logger.info(
            `[PROCESSADOR] Arquivo processado com sucesso: ${caminhoPdf}`
        );

        return {

            sucesso: true,

            status:
                STATUS.PROCESSADO

        };

    } catch (erro) {

        logger.error(
            `[PROCESSADOR] Erro ao processar arquivo ${caminhoPdf}: ${erro.message}`
        );

        return await registrarErroProcessamento({

            caminhoPdf,

            status:
                erro.status ||
                STATUS.ERRO_PDF,

            mensagemErro:
                erro.message,

            funcionario,

            dadosPdf

        });

    }

}

module.exports = {
    processarArquivo
};