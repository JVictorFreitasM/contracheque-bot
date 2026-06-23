const configuracaoService = require('../services/configuracaoService');
const logger = require('../config/logger');

class ConfiguracoesController {
    async obterConfiguracoes(req, res) {
        try {
            const config = await configuracaoService.obterConfiguracao();
            res.json({ sucesso: true, config });
        } catch (erro) {
            logger.error(`Erro ao obter configurações: ${erro.message}`);
            res.status(500).json({ sucesso: false, erro: erro.message });
        }
    }

    async atualizarConfiguracoes(req, res) {
        try {
            const novaConfig = req.body;
            const configAtualizada = await configuracaoService.atualizarConfiguracao(novaConfig);
            res.json({ sucesso: true, config: configAtualizada });
        } catch (erro) {
            logger.error(`Erro ao atualizar configurações: ${erro.message}`);
            res.status(500).json({ sucesso: false, erro: erro.message });
        }
    }
}

module.exports = new ConfiguracoesController();
