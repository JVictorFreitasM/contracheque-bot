const {
    obterTelefoneWhatsapp
} = require('../../utils/telefoneUtils');

const logger =
    require('../../config/logger');

const STATUS =
    require('../../utils/statusEnvio');

function validarTelefoneFuncionario(
    funcionario
) {
    logger.info(
        `[TELEFONE] ${JSON.stringify({
            telefone: funcionario.telefone,
            dddTelefone: funcionario.dddTelefone,
            celular: funcionario.celular,
            dddCelular: funcionario.dddCelular
        })}`
    );
    const telefone =
        obterTelefoneWhatsapp(
            funcionario
        );

    if (!telefone) {

        logger.warn(
            `[VALIDACAO_TELEFONE] Funcionário sem telefone. Código: ${funcionario.codigo}`
        );

        const erro =
            new Error(
                'Funcionário sem telefone'
            );

        erro.status =
            STATUS.SEM_TELEFONE;

        throw erro;

    }

    logger.info(
        `[VALIDACAO_TELEFONE] Telefone encontrado: ${telefone}`
    );
    
    return telefone;

}

module.exports =
    validarTelefoneFuncionario;