const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../config/logger');

async function enviarPdf(telefone, caminhoPdf, nomeFuncionario, cpf, competencia) {
    if (!fs.existsSync(caminhoPdf)) {
        throw new Error(`PDF não encontrado: ${caminhoPdf}`);
    }

    const nomeTratado = nomeFuncionario || 'Colaborador';
    const competenciaTratada = competencia || 'do período';

    const mensagem = `Olá, ${nomeTratado}.\n\nSegue em anexo o seu contracheque referente à competência ${competenciaTratada}.\n\nAtenciosamente,\nDepartamento de Recursos Humanos`;

    logger.info(`[N8N] Gerada mensagem personalizada para CPF ${cpf}: "${mensagem.replace(/\n/g, ' ')}"`);

    const formData = new FormData();
    formData.append('telefone', telefone);
    formData.append('nomeArquivo', path.basename(caminhoPdf));
    formData.append('nome', nomeTratado);
    formData.append('cpf', cpf || '');
    formData.append('competencia', competenciaTratada);
    formData.append('mensagem', mensagem);
    
    // Adiciona o arquivo real via stream
    formData.append('arquivo', fs.createReadStream(caminhoPdf));

    const webhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/enviar-contracheque';
    console.log('[N8N] URL:', webhookUrl);
    return axios.post(webhookUrl, formData, {
        headers: {
            ...formData.getHeaders(),
        },
        timeout: 30000
    });
}

module.exports = {
    enviarPdf
};