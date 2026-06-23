const prisma = require('../lib/prisma');

class ConfiguracaoRepository {
    async obterConfiguracao() {
        return prisma.configuracao.findFirst({
            where: { id: 1 }
        });
    }

    async criarConfiguracaoInicial(dados) {
        return prisma.configuracao.create({
            data: {
                id: 1,
                ...dados
            }
        });
    }

    async atualizarConfiguracao(dados) {
        return prisma.configuracao.update({
            where: { id: 1 },
            data: dados
        });
    }
}

module.exports = new ConfiguracaoRepository();
