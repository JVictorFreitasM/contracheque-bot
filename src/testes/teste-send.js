const { enviarPdfDireto } = require('../services/evolutionSenderService');

enviarPdfDireto({
  telefone: '5586988661130',
  caminhoPdf: '../../uploads/01_1.pdf',
  nomeFuncionario: 'Teste',
  competencia: '06/2026'
}).catch(console.error);