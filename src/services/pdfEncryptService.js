const { encryptPDF } = require('@pdfsmaller/pdf-encrypt-lite');
const fs = require('fs');

function gerarSenhaCpf(cpf) {
    if (!cpf) {
        throw new Error('CPF não informado');
    }

    const cpfLimpo = String(cpf).replace(/\D/g, '');

    if (cpfLimpo.length < 3) {
        throw new Error('CPF inválido para geração de senha');
    }

    return cpfLimpo.slice(-3);
}

async function criptografarPdf(caminhoEntrada, caminhoSaida, cpf) {

    const senha = gerarSenhaCpf(cpf);

    // Ler arquivo PDF
    const pdfBytes = fs.readFileSync(caminhoEntrada);

    // Criptografar PDF
    const encryptedBytes = await encryptPDF(pdfBytes, senha, senha);

    // Salvar no caminho de saída
    fs.writeFileSync(caminhoSaida, encryptedBytes);

    return {
        caminhoSaida,
        senha
    };
}

module.exports = {
    criptografarPdf
};
