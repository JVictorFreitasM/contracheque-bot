// Fallback apenas para rodar fora do Docker (dev local); em produção as variáveis
// vêm do docker-compose (env_file/environment), nunca embutidas na imagem.
require('dotenv').config();

const logger = require('./config/logger');
const app = require('./app');
const agendador = require('./cron/agendador');
const configuracaoService = require('./services/configuracaoService');
const evolutionWebhookService = require('./services/evolutionWebhookService');

const PORT = process.env.PORT || 3000;

async function iniciar() {
    logger.info('=====================================');
    logger.info('BOT DE CONTRACHEQUES INICIADO');
    logger.info('=====================================');

    try {
        app.listen(PORT, () => {
            logger.info(`[SERVER] Express iniciado na porta ${PORT}`);
            logger.info(`[BULL BOARD] Disponível em http://localhost:${PORT}/admin/queues`);
        });

        // Inicia o agendador de tarefas
        await agendador.iniciarAgendamento();

        // Garante que a instância da Evolution API está configurada para
        // notificar o bot sobre status de entrega/leitura das mensagens
        const config = await configuracaoService.obterConfiguracao();
        await evolutionWebhookService.configurarWebhook(config);

        // O processamento da fila roda apenas no container `worker` dedicado
        // (ver docker-compose.yml) — não iniciar o worker aqui para evitar
        // processamento duplicado de jobs (OS-12, Opção A).

    } catch (erro) {
        logger.error(`Erro crítico ao iniciar: ${erro.message}`);
    }
}

iniciar();