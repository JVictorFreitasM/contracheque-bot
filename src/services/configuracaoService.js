const configuracaoRepository = require('../repositories/configuracaoRepository');

class ConfiguracaoService {
    async obterConfiguracao() {
        let config = await configuracaoRepository.obterConfiguracao();
        
        if (!config) {
            // Se não existe configuração, cria com valores iniciais das env vars
            const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
            const evolutionInstance = process.env.EVOLUTION_INSTANCE || 'bot-contracheque';
            const evolutionApiKey = process.env.EVOLUTION_API_KEY || '48E7160B065C-45FC-A784-2BA6C7A51C4A';
            const intervaloEnvio = 30; // Valor padrão em segundos
            
            config = await configuracaoRepository.criarConfiguracaoInicial({
                evolution_url: evolutionUrl,
                evolution_instance: evolutionInstance,
                evolution_api_key: evolutionApiKey,
                intervalo_envio: intervaloEnvio
            });
        }
        
        return config;
    }

    async atualizarConfiguracao(dados) {
        // Garantir que a configuração exista antes de atualizar
        await this.obterConfiguracao();
        
        const dadosAtualizacao = {
            evolution_url: dados.evolution_url,
            evolution_instance: dados.evolution_instance,
            evolution_api_key: dados.evolution_api_key,
            intervalo_envio: dados.intervalo_envio ? parseInt(dados.intervalo_envio, 10) : 30
        };

        return configuracaoRepository.atualizarConfiguracao(dadosAtualizacao);
    }
}

module.exports = new ConfiguracaoService();
