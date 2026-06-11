async function enviarPdf(telefone, caminhoArquivo){
    console.log(
        `[WHATSAPP] Enviando ${caminhoArquivo} para ${telefone}`
    );

    return {
        sucesso: true,
        protocolo: Date.now().toString()
    }
}
module.exports = {
    enviarPdf
}

