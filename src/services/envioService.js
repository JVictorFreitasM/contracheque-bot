const pdfService =
    require('./pdfService');

const funcionarioRepository =
    require('../repositories/funcionarioRepository');

const envioRepository =
    require('../repositories/envioRepository');

const n8nService =
    require('./n8nService');

async function processarArquivo(caminho) {

    const texto =
        await pdfService.extrairTextoDoPdf(caminho);

    const dadosPdf =
        pdfService.extrairFuncionario(texto);

    if (!dadosPdf) {

        throw new Error(
            'Funcionário não encontrado no PDF'
        );

    }

    const funcionario =
        await funcionarioRepository.buscarPorCodigo(
            dadosPdf.codigo
        );

    if (!funcionario) {

        throw new Error(
            `Funcionário ${dadosPdf.codigo} não encontrado`
        );

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

        throw new Error(
            `Nome divergente.
             PDF: ${dadosPdf.nome}
             Banco: ${funcionario.nome}`
        );

    }

}

