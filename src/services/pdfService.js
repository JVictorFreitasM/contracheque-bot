const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');



console.log(pdfParse);

async function extrairTextoDoPdf(caminho) {
    const buffer = fs.readFileSync(caminho);

    const resultado = await pdfParse(buffer);
    return resultado.text;
}


function extrairFuncionario(texto) {

    const match = texto.match(
        /CódigoNome Funcionário[\s\S]*?(\d+)([A-ZÀ-Ú][A-ZÀ-Ú\s]+)/u
    );

    if (!match) {
        return null;
    }

    return {
        codigo: Number(match[1]),
        nome: match[2].trim()
    };
}


// function extrairCpf(texto) {

//     const match =
//         texto.match(
//             /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/
//         );

//     if (!match)
//         return null;

//     return match[0]
//         .replace(/\D/g, '');
// }

function extrairCodigo(texto) {

    const match =
        texto.match(
            /Código\s*:?[\s\r\n]*(\d+)/i
        );

    return match
        ? Number(match[1])
        : null;
}

module.exports = {
    extrairTextoDoPdf,
    extrairFuncionario,
    extrairCodigo
}
