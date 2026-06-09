const pdfService = require('./pdfService');
const funcionarioRepository = require('../repositories/funcionarioRepository');
const envioRepository = require('../repositories/envioRepository');

const logger =
    require('../config/logger');

const arquivoService =
    require('./arquivoService');

const normalizarNome =
    require('../utils/normalizarNome');

const STATUS =
    require('../utils/statusEnvio');

async function processarArquivo(caminhoPdf) {

    try {

        logger.info(
            `Iniciando processamento do arquivo: ${caminhoPdf}`
        );

        const texto =
            await pdfService.extrairTextoDoPdf(
                caminhoPdf
            );

        const dadosPdf =
            pdfService.extrairFuncionario(
                texto
            );

        logger.info(
            `Dados extraídos do PDF. Código: ${dadosPdf?.codigo ?? 'N/A'} | Nome: ${dadosPdf?.nome ?? 'N/A'}`
        );

        if (!dadosPdf) {

            logger.warn(
                `Não foi possível identificar funcionário no PDF: ${caminhoPdf}`
            );

            await envioRepository.criar({

                arquivoPdf: caminhoPdf,

                status:
                    STATUS.ERRO_PDF,

                mensagemErro:
                    'Não foi possível identificar funcionário no PDF'

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

            return {

                sucesso: false,

                status:
                    STATUS.ERRO_PDF

            };

        }

        const funcionario =
            await funcionarioRepository.buscarPorCodigo(
                dadosPdf.codigo
            );

        if (!funcionario) {

            logger.warn(
                `Funcionário não encontrado. Código: ${dadosPdf.codigo}`
            );

            await envioRepository.criar({

                codigoFuncionario:
                    dadosPdf.codigo,

                nomeFuncionario:
                    dadosPdf.nome,

                arquivoPdf:
                    caminhoPdf,

                status:
                    STATUS.FUNCIONARIO_NAO_ENCONTRADO

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

            return {

                sucesso: false,

                status:
                    STATUS.FUNCIONARIO_NAO_ENCONTRADO

            };

        }

        logger.info(
            `Funcionário encontrado. Código: ${funcionario.codigo} | Nome: ${funcionario.nome}`
        );

        const nomePdf =
            normalizarNome(
                dadosPdf.nome
            );

        const nomeBanco =
            normalizarNome(
                funcionario.nome
            );

        if (nomePdf !== nomeBanco) {

            logger.warn(
                `Nome divergente. Código: ${funcionario.codigo} | PDF: ${dadosPdf.nome} | Banco: ${funcionario.nome}`
            );

            await envioRepository.criar({

                codigoFuncionario:
                    funcionario.codigo,

                nomeFuncionario:
                    funcionario.nome,

                arquivoPdf:
                    caminhoPdf,

                status:
                    STATUS.NOME_DIVERGENTE,

                mensagemErro:
                    `PDF: ${dadosPdf.nome} | BANCO: ${funcionario.nome}`

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

            return {

                sucesso: false,

                status:
                    STATUS.NOME_DIVERGENTE

            };

        }

        if (!funcionario.telefone) {

            logger.warn(
                `Funcionário sem telefone. Código: ${funcionario.codigo} | Nome: ${funcionario.nome}`
            );

            await envioRepository.criar({

                codigoFuncionario:
                    funcionario.codigo,

                nomeFuncionario:
                    funcionario.nome,

                arquivoPdf:
                    caminhoPdf,

                status:
                    STATUS.SEM_TELEFONE

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

            return {

                sucesso: false,

                status:
                    STATUS.SEM_TELEFONE

            };

        }

        /*
        FUTURO

        await whatsappService.enviarPdf(
            funcionario.telefone,
            caminhoPdf
        );
        */

        logger.info(
            `Arquivo validado com sucesso. Código: ${funcionario.codigo} | Nome: ${funcionario.nome}`
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

        return {

            sucesso: true,

            status:
                STATUS.PROCESSADO

        };

    } catch (erro) {

        logger.error(
            `Erro ao processar ${caminhoPdf}: ${erro.stack}`
        );

        try {

            await envioRepository.criar({

                arquivoPdf:
                    caminhoPdf,

                status:
                    STATUS.ERRO_PDF,

                mensagemErro:
                    erro.message

            });

            arquivoService.moverParaErro(
                caminhoPdf
            );

        } catch (erroInterno) {

            logger.error(
                `Falha ao registrar erro do arquivo ${caminhoPdf}: ${erroInterno.message}`
            );

        }

        return {

            sucesso: false,

            status:
                STATUS.ERRO_PDF

        };

    }

}

module.exports = {
    processarArquivo
};