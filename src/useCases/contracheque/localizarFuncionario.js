const funcionarioRepository =
    require('../../repositories/funcionarioRepository');

const logger =
    require('../../config/logger');

const STATUS =
    require('../../utils/statusEnvio');

async function localizarFuncionario(
    dadosPdf
) {

    logger.info(
        `[FUNCIONARIO] Buscando código ${dadosPdf.codigo}`
    );

    const funcionario =
        await funcionarioRepository.buscarPorCodigo(
            dadosPdf.codigo
        );

    if (!funcionario) {

        logger.warn(
            `[FUNCIONARIO] Código ${dadosPdf.codigo} não encontrado`
        );

        const erro =
            new Error(
                'Funcionário não encontrado'
            );

        erro.status =
            STATUS.FUNCIONARIO_NAO_ENCONTRADO;

        throw erro;

    }

    logger.info(
        `[FUNCIONARIO] Encontrado: ${funcionario.codigo} - ${funcionario.nome}`
    );

    return funcionario;

}

module.exports =
    localizarFuncionario;