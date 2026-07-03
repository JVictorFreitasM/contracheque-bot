const axios = require('axios');
const logger = require('../config/logger');

/**
 * Configura na instância da Evolution API o webhook que envia de volta
 * as atualizações de status da mensagem (enviado/entregue/lido) para o bot,
 * usado para preencher statusEntregaWhatsapp/dataEntregaWhatsapp/dataLeituraWhatsapp.
 */
async function configurarWebhook({ evolution_url, evolution_instance, evolution_api_key }) {
    const botWebhookUrl = process.env.BOT_WEBHOOK_URL;

    if (!botWebhookUrl) {
        logger.warn('[EVOLUTION WEBHOOK] BOT_WEBHOOK_URL não configurada; pulando configuração automática do webhook. Confirmação de entrega/leitura não vai funcionar.');
        return;
    }

    const token = process.env.EVOLUTION_WEBHOOK_TOKEN;
    const url = token
        ? `${botWebhookUrl}?token=${encodeURIComponent(token)}`
        : botWebhookUrl;

    try {
        await axios.post(
            `${evolution_url}/webhook/set/${evolution_instance}`,
            {
                webhook: {
                    enabled: true,
                    url,
                    webhookByEvents: false,
                    webhookBase64: false,
                    events: ['MESSAGES_UPDATE']
                }
            },
            {
                headers: {
                    apikey: evolution_api_key,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        logger.info(`[EVOLUTION WEBHOOK] Webhook configurado com sucesso na instância "${evolution_instance}" -> ${url}`);
    } catch (erro) {
        logger.error(`[EVOLUTION WEBHOOK] Falha ao configurar webhook na instância "${evolution_instance}": ${erro.message}`);
    }
}

module.exports = { configurarWebhook };
