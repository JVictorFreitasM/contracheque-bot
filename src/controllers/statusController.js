// src/controllers/statusController.js
const logger = require('../config/logger');

// Simple status check – returns hard‑coded "online" for each service.
// In a real environment you could add health‑checks (e.g., DB ping).
function getStatus(req, res) {
  logger.info('[API] Consulta de status dos serviços');
  res.json({
    postgres: 'online',
    redis: 'online',
    erp: 'online',
    bullmq: 'online',
    n8n: 'online',
    app: 'online'
  });
}

module.exports = { getStatus };
