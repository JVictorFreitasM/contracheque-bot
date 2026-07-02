// src/controllers/webhookController.js
const envioRepository = require('../repositories/envioRepository');
const logger = require('../config/logger');

// Mapeia os status de mensagem reportados pela Evolution API (baseados no Baileys)
// para os status internos armazenados em Envio.statusEntregaWhatsapp
const STATUS_MAP = {
    SERVER_ACK: 'SENT',
    SENT: 'SENT',
    DELIVERY_ACK: 'DELIVERED',
    DELIVERED: 'DELIVERED',
    READ: 'READ',
    PLAYED: 'READ'
};

function tokenValido(req) {
    const tokenEsperado = process.env.EVOLUTION_WEBHOOK_TOKEN;

    // Se nenhum token foi configurado, não há como validar (ambiente local/dev)
    if (!tokenEsperado) {
        return true;
    }

    return req.query.token === tokenEsperado;
}

async function receberWebhook(req, res) {
    if (!tokenValido(req)) {
        logger.warn('[WEBHOOK EVOLUTION] Requisição rejeitada: token ausente ou inválido');
        return res.status(401).json({ error: 'Token inválido' });
    }

    // Responde imediatamente o que for possível e processa o resto de forma leve,
    // sem lógica pesada síncrona (apenas updates pontuais por id/messageId)
    try {
        const { event, data } = req.body || {};
        const eventoNormalizado = String(event || '').toLowerCase();

        if (!eventoNormalizado.includes('messages.update') && !eventoNormalizado.includes('messages_update')) {
            return res.status(200).json({ received: true });
        }

        const itens = Array.isArray(data) ? data : [data];

        for (const item of itens) {
            const messageId = item?.key?.id || item?.keyId || null;
            const statusBruto = String(item?.update?.status ?? item?.status ?? '').toUpperCase();
            const statusMapeado = STATUS_MAP[statusBruto];

            if (!messageId || !statusMapeado) {
                continue;
            }

            const envio = await envioRepository.buscarPorWhatsappMessageId(messageId);

            if (!envio) {
                logger.warn(`[WEBHOOK EVOLUTION] Nenhum envio encontrado para whatsappMessageId=${messageId}`);
                continue;
            }

            const dadosAtualizacao = { statusEntregaWhatsapp: statusMapeado };

            if (statusMapeado === 'DELIVERED' && !envio.dataEntregaWhatsapp) {
                dadosAtualizacao.dataEntregaWhatsapp = new Date();
            }

            if (statusMapeado === 'READ' && !envio.dataLeituraWhatsapp) {
                dadosAtualizacao.dataLeituraWhatsapp = new Date();
            }

            await envioRepository.atualizar(envio.id, dadosAtualizacao);
        }

        return res.status(200).json({ received: true });
    } catch (erro) {
        logger.error(`[WEBHOOK EVOLUTION] Erro ao processar webhook: ${erro.message}`);
        // Retorna 200 mesmo em erro interno para a Evolution API não ficar reenviando o webhook
        return res.status(200).json({ received: true });
    }
}

module.exports = { receberWebhook };
