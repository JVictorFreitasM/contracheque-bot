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

const gerarHashArquivo =
    require('../utils/gerarHashArquivo');

const envioContrachequeQueue =
    require('../queues/envioContrachequeQueue');

async function processarArquivo(
    caminhoPdf
) {

    let dadosPdf = null;
    let funcionario = null;

    try {

        logger.info(
            `[PROCESSADOR] Iniciando processamento do arquivo: ${caminhoPdf}`
        );

        // =====================================
        // HASH DO ARQUIVO
        // =====================================

        const hashArquivo =
            gerarHashArquivo(caminhoPdf);

        logger.info(
            `[HASH]${hashArquivo}`
        )
        
        const envioPorHash =
            await envioRepository.buscarPorHash(
                hashArquivo
            );

        if (envioPorHash) {

            logger.warn(
                `[DUPLICADO] Arquivo já processado anteriormente`
            );

            return {
                sucesso: false,
                status: 'DUPLICADO_HASH'
            };
        }

        // =====================================
        // EXTRAÇÃO PDF
        // =====================================

        dadosPdf =
            await extrairDadosPdf(
                caminhoPdf
            );

        logger.info(
            `[PDF] Código: ${dadosPdf.codigo} | Nome: ${dadosPdf.nome} | Competência: ${dadosPdf.competencia}`
        );

        // =====================================
        // FUNCIONÁRIO
        // =====================================

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

        // =====================================
        // CPF + COMPETÊNCIA
        // =====================================

        if (
            funcionario.cpf &&
            dadosPdf.competencia
        ) {

            const envioExistente =
                await envioRepository
                    .buscarPorCpfCompetencia(
                        funcionario.cpf,
                        dadosPdf.competencia
                    );

            if (envioExistente) {

                logger.warn(
                    `[DUPLICADO] CPF ${funcionario.cpf} já recebeu contracheque da competência ${dadosPdf.competencia}`
                );

                return {
                    sucesso: false,
                    status: 'DUPLICADO_COMPETENCIA'
                };
            }

        }

        // =====================================
        // ENVIO
        // =====================================

        await envioContrachequeQueue.add(
            'enviar',
            {
                codigoFuncionario:
                    funcionario.codigo,

                nomeFuncionario:
                    funcionario.nome,

                cpf:
                    funcionario.cpf,

                competencia:
                    dadosPdf.competencia,

                hashArquivo,

                telefone,

                caminhoPdf
            }
        );
        // =====================================
        // REGISTRO
        // =====================================

        
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

            dadosPdf,

            hashArquivo

        });

    }

}

module.exports = {
    processarArquivo
};