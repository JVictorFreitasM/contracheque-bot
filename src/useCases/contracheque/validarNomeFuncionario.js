const normalizarNome =
    require('../../utils/normalizarNome');

const logger =
    require('../../config/logger');

const STATUS =
    require('../../utils/statusEnvio');

function validarNomeFuncionario(
    funcionario,
    dadosPdf
) {

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
            `[VALIDACAO_NOME] Divergência. PDF: ${dadosPdf.nome} | Banco: ${funcionario.nome}`
        );

        const erro =
            new Error(
                'Nome divergente'
            );

        erro.status =
            STATUS.NOME_DIVERGENTE;

        throw erro;

    }

    logger.info(
        `[VALIDACAO_NOME] Nome validado`
    );

}

module.exports =
    validarNomeFuncionario;