const pdfService =
    require('./pdfService');

const funcionarioRepository =
    require('../repositories/funcionarioRepository');

const envioRepository =
    require('../repositories/envioRepository');

const whatsappService =
    require('./whatsappService');

async function processarArquivo(caminho) {
    const texto = await pdfService.extrairTextoDoPdf(caminho);
    const cpfPdf = pdfService.extrairCpf(texto);
    const codigoPdf = pdfService.extrairCodigo(texto);

    
}

