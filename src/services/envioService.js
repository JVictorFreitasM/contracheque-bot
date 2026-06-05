const pdfService =
    require('./pdfService');

const funcionarioRepository =
    require('../repositories/funcionarioRepository');

const envioRepository =
    require('../repositories/envioRepository');

const whatsappService =
    require('./whatsappService');

async function processarArquivo(path) {
    const texto = await pdfService.extrairTexto(path);
    const cpfPdf = pdfService.extrairCpf(texto);

    
}

