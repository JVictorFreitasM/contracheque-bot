require('dotenv').config();

const wkService =
    require('./services/wkService');

async function main() {

    const funcionarios =
        await wkService.sincronizarFuncionarios();

    console.log(
        'Quantidade:',
        funcionarios.total,
        'Ignorados:',
        funcionarios.ignorados
    );

}

main();

