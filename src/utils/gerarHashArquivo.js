const fs = require('fs');
const crypto = require('crypto');

function gerarHashArquivo(caminhoArquivo) {
    const buffer = fs.readFileSync(caminhoArquivo);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return hash;
}

module.exports = gerarHashArquivo;