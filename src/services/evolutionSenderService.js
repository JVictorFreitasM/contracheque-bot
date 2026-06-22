const fs = require('fs');
const axios = require('axios');

/**
 * Envia PDF diretamente para Evolution API
 */
async function enviarPdfDireto({
  telefone,
  caminhoPdf,
  nomeFuncionario,
  competencia
}) {

  if (!fs.existsSync(caminhoPdf)) {
    throw new Error(`PDF não encontrado: ${caminhoPdf}`);
  }

  // 1. Ler arquivo
  const buffer = fs.readFileSync(caminhoPdf);

  console.log('[PDF] Tamanho bytes:', buffer.length);

  // 2. Converter para base64
  const base64 = buffer.toString('base64');

  console.log('[BASE64] Tamanho:', base64.length);

  // 3. Validação de integridade (CRÍTICO)
  const reconvert = Buffer.from(base64, 'base64');

  if (reconvert.length !== buffer.length) {
    throw new Error('❌ Base64 corrompido na conversão');
  }

  console.log('[VALIDAÇÃO] PDF íntegro ✔');

  // 4. Montar payload Evolution
  const payload = {
    number: telefone,
    mediatype: "document",
    mimetype: "application/pdf",
    caption: `Olá, ${nomeFuncionario || 'Colaborador'}. Segue seu contracheque referente a ${competencia || 'competência atual'}.`,
    fileName: caminhoPdf.split('/').pop(),
    media: base64
  };

  console.log('[ENVIO] Enviando para Evolution...');

  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  const evolutionInstance = process.env.EVOLUTION_INSTANCE || 'bot-contracheque';
  const evolutionApiKey = process.env.EVOLUTION_API_KEY || '48E7160B065C-45FC-A784-2BA6C7A51C4A';

  const response = await axios.post(
    `${evolutionUrl}/message/sendMedia/${evolutionInstance}`,
    payload,
    {
      headers: {
        apikey: evolutionApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );

  console.log('[SUCESSO]', response.data);

  return response.data;
}

module.exports = {
  enviarPdfDireto
};