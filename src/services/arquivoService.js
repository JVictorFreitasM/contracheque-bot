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

function moverArquivo(origem, destino) {

    try {
        fs.renameSync(origem, destino);
    } catch (erro) {
        if (erro.code === 'EXDEV') {
            fs.copyFileSync(origem, destino);
            fs.unlinkSync(origem);
        } else {
            throw erro;
        }
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

    moverArquivo(
        caminhoPdf,
        destino
    );

    return destino;

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

    moverArquivo(
        caminhoPdf,
        destino
    );

    return destino;

}

module.exports = {
    moverParaErro,
    moverParaProcessados
};