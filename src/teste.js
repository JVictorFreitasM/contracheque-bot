require('dotenv').config();

const pdfService =
    require('./services/pdfService');

async function main() {

    const path = require('path');

    const arquivo = path.join(
        __dirname,
        '..',
        'contracheque exemplos',
        '01_1.pdf'
    );

console.log(arquivo);

    const texto =
        await pdfService.extrairTextoDoPdf(
            arquivo
        );

    console.log(texto);

}

main();