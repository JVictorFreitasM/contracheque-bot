const fs = require('fs');
const path = require('path');

const processadorContracheque =
    require('./processadorContrachequeService');

const logger =
    require('../config/logger');

async function processarPasta() {

    const pastaUploads =
        path.resolve('uploads');

    if (!fs.existsSync(pastaUploads)) {

        logger.error(
            `Pasta de uploads não encontrada: ${pastaUploads}`
        );

        return;
    }

    const arquivos =
        fs.readdirSync(
            pastaUploads
        );

    const pdfs =
        arquivos.filter(
            arquivo =>
                arquivo
                    .toLowerCase()
                    .endsWith('.pdf')
        );

    logger.info(
        `Iniciando processamento. ${pdfs.length} PDF(s) encontrados.`
    );

    let processados = 0;
    let erros = 0;

    const estatisticas = {

        PROCESSADO: 0,

        FUNCIONARIO_NAO_ENCONTRADO: 0,

        NOME_DIVERGENTE: 0,

        SEM_TELEFONE: 0,

        ERRO_PDF: 0

    };

    for (const pdf of pdfs) {

        const caminhoCompleto =
            path.join(
                pastaUploads,
                pdf
            );

        logger.info(
            `==========================================================================================\n
            Processando arquivo: ${pdf}`
        );

        try {

            const resultado =
                await processadorContracheque
                    .processarArquivo(
                        caminhoCompleto
                    );

            if (resultado.sucesso) {

                processados++;

                logger.info(
                    `${pdf} processado com sucesso. Status: ${resultado.status}`
                );

            } else {

                erros++;

                logger.warn(
                    `${pdf} processado com erro. Status: ${resultado.status}`
                );

            }

            if (
                estatisticas[
                    resultado.status
                ] !== undefined
            ) {

                estatisticas[
                    resultado.status
                ]++;

            }

        } catch (erro) {

            erros++;

            logger.error(
                `Erro inesperado ao processar ${pdf}: ${erro.stack}`
            );

        }

    }

    const resumo = `
======================================
RESUMO DO PROCESSAMENTO
======================================

PDFs encontrados:
${pdfs.length}

Processados:
${processados}

Erros:
${erros}

--------------------------------------

PROCESSADO:
${estatisticas.PROCESSADO}

FUNCIONARIO_NAO_ENCONTRADO:
${estatisticas.FUNCIONARIO_NAO_ENCONTRADO}

NOME_DIVERGENTE:
${estatisticas.NOME_DIVERGENTE}

SEM_TELEFONE:
${estatisticas.SEM_TELEFONE}

ERRO_PDF:
${estatisticas.ERRO_PDF}

======================================
`;

    console.log(resumo);

    logger.info(
        resumo.replace(/\n/g, ' ')
    );

}

module.exports = {
    processarPasta
};