const pdfService = require('./pdfService');
const funcionarioRepository = require('../repositories/funcionarioRepository');
const normalizarNome = require('../utils/normalizarNome');

async function processarArquivo(caminhoPdf) {

    console.log(`\nProcessando: ${caminhoPdf}`);

    const texto =
        await pdfService.extrairTextoDoPdf(
            caminhoPdf
        );

    const dadosPdf =
        pdfService.extrairFuncionario(
            texto
        );

    if (!dadosPdf) {

        console.log(
            'Funcionário não encontrado no PDF'
        );

        return;
    }

    console.log('Dados PDF:', dadosPdf);

    const funcionario =
        await funcionarioRepository.buscarPorCodigo(
            dadosPdf.codigo
        );

    if (!funcionario) {

        console.log(
            `Funcionário ${dadosPdf.codigo} não encontrado`
        );

        return;
    }

    const nomePdf =
        normalizarNome(
            dadosPdf.nome
        );

    const nomeBanco =
        normalizarNome(
            funcionario.nome
        );

    if (nomePdf !== nomeBanco) {

        console.log(
            'Nome divergente'
        );

        console.log(
            `PDF: ${dadosPdf.nome}`
        );

        console.log(
            `BANCO: ${funcionario.nome}`
        );

        return;
    }

    if (!funcionario.telefone) {

        console.log(
            `Funcionário ${funcionario.codigo} sem telefone`
        );

        return;
    }

    console.log(
        `Pronto para enviar para ${funcionario.telefone}`
    );

}

module.exports = {
    processarArquivo
};