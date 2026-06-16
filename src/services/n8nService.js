const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function enviarPdf(
    telefone,
    caminhoPdf
) {
    console.log('CAMINHO RECEBIDO:', caminhoPdf);

    console.log(
    'EXISTE?',
    fs.existsSync(caminhoPdf)
);
    if (!fs.existsSync(caminhoPdf)) {
        throw new Error(
            `PDF não encontrado: ${caminhoPdf}`
        );
    }

    const arquivoBase64 =
        fs.readFileSync(caminhoPdf)
          .toString('base64');

    return axios.post(
        'http://localhost:5678/webhook/enviar-contracheque',
        {
            telefone,
            nomeArquivo: path.basename(caminhoPdf),
            arquivoBase64
        },
        {
            timeout: 30000
        }
    );
}

module.exports = {
    enviarPdf
};