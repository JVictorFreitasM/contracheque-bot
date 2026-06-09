const fs = require('fs');
const path = require('path');

function garantirPasta(caminho) {

    if (!fs.existsSync(caminho)) {

        fs.mkdirSync(
            caminho,
            { recursive: true }
        );

    }

}

function moverParaProcessados(caminhoPdf) {

    const pastaDestino =
        path.resolve('processados');

    garantirPasta(
        pastaDestino
    );

    const destino =
        path.join(
            pastaDestino,
            path.basename(caminhoPdf)
        );

    fs.renameSync(
        caminhoPdf,
        destino
    );

}

function moverParaErro(caminhoPdf) {

    const pastaDestino =
        path.resolve('erro');

    garantirPasta(
        pastaDestino
    );

    const destino =
        path.join(
            pastaDestino,
            path.basename(caminhoPdf)
        );

    fs.renameSync(
        caminhoPdf,
        destino
    );

}

module.exports = {
    moverParaErro,
    moverParaProcessados
};