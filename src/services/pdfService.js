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

    const funcionarioMatch =
        texto.match(
            /CódigoNome Funcionário[\s\S]*?(\d+)([A-ZÀ-Ú][A-ZÀ-Ú\s]+)/u
        );

    if (!funcionarioMatch) {

        throw new Error(
            'Funcionário não encontrado no PDF'
        );

    }

    const competenciaMatch =
        texto.match(
            /Per[ií]odo\s+da\s+Folha:\s*(\d{2}\/\d{4})/i
        );

    if (!competenciaMatch) {

        throw new Error(
            'Competência não encontrada no PDF'
        );

    }

    return {

        codigo:
            Number(funcionarioMatch[1]),

        nome:
            funcionarioMatch[2].trim(),

        competencia:
            competenciaMatch[1]

    };

}


function extrairCodigo(texto) {

    const match = texto.match(
        /Código[\s\S]{0,50}?(\d{1,10})/i
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
