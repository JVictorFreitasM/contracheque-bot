require('dotenv').config();

const wkService =
    require('./services/wkService');

async function main() {

    try {

        const resultado =
            await wkService
                .sincronizarFuncionarios();

        console.log(
            'Resultado:',
            resultado
        );

    } catch (error) {

        console.error(
            'Erro:',
            error.response?.data ||
            error.message
        );

    }

}

main();