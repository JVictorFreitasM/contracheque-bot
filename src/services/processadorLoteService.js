const fs = require('fs');
const path = require('path');

const processadorContracheque =
    require('./processadorContrachequeService');

async function processarPasta() {

    const pastaUploads =
        path.resolve('uploads');

    const arquivos =
        fs.readdirSync(pastaUploads);

    const pdfs =
        arquivos.filter(
            arquivo =>
                arquivo.toLowerCase().endsWith('.pdf')
        );

    console.log(
        `${pdfs.length} PDF(s) encontrados`
    );

    for (const pdf of pdfs) {

        const caminhoCompleto =
            path.join(
                pastaUploads,
                pdf
            );

        try {

            await processadorContracheque
                .processarArquivo(
                    caminhoCompleto
                );

        } catch (erro) {

            console.error(
                `Erro ao processar ${pdf}`
            );

            console.error(erro);

        }

    }

}

module.exports = {
    processarPasta
};