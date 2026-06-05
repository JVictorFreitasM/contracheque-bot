const fs = require('fs');
const pdfParse = require('pdf-parse');

async function extrairTextoDoPdf(path) {
    const buffer = fs.readFileSync(path);

    const resultado = await pdfParse(buffer);
    return resultado.text;
}

function extrairCpf(texto) {

    const match =
        texto.match(
            /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/
        );

    if (!match)
        return null;

    return match[0]
        .replace(/\D/g, '');
}

module.exports = {
    extrairTextoDoPdf,
    extrairCpf
}
