// src/controllers/wkStatusController.js
const sincronizacaoWKRepository = require('../repositories/sincronizacaoWKRepository');
const funcionarioRepository = require('../repositories/funcionarioRepository');

const HISTORICO_LIMITE = 10;

async function getStatus(req, res) {
    try {
        const [ultima, historico, funcionarios] = await Promise.all([
            sincronizacaoWKRepository.buscarUltima(),
            sincronizacaoWKRepository.listarUltimas(HISTORICO_LIMITE),
            funcionarioRepository.contarPorStatus()
        ]);

        res.json({
            ultimaSincronizacao: ultima,
            historico,
            funcionarios
        });
    } catch (err) {
        console.error('Erro ao buscar status da integração WK:', err);
        res.status(500).json({ error: 'Falha ao obter status da integração WK Radar' });
    }
}

module.exports = { getStatus };
