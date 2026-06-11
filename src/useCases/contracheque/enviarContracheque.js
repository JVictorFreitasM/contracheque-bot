const envioQueue =
    require('../../queues/envioQueue');

const logger =
    require('../../config/logger');

async function enviarContracheque(
    funcionario,
    telefone,
    caminhoPdf
) {

    logger.info(
        `[FILA] Criando job para envio do PDF para ${telefone}`
    );

    const job =
    await envioQueue.add(

        'enviar-pdf',

        {
            codigoFuncionario:
                funcionario.codigo,

            nomeFuncionario:
                funcionario.nome,

            telefone,

            caminhoPdf
        }

    );

    logger.info(
        `[FILA] Job ${job.id} criado para ${telefone}`
    );

    return {

        sucesso: true,

        jobId:
            job.id

    };

}

module.exports =
    enviarContracheque;