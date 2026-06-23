// src/controllers/statusController.js
const logger = require('../config/logger');
const prisma = require('../lib/prisma');
const redis = require('../config/redis');
const filaEnvio = require('../queues/envioContrachequeQueue');

async function checkPostgres() {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return 'online';
  } catch (error) {
    logger.error('[HEALTH] PostgreSQL offline', error);
    return 'offline';
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return 'online';
  } catch (error) {
    logger.error('[HEALTH] Redis offline', error);
    return 'offline';
  }
}

async function checkWorker() {
  try {
    const workers = await filaEnvio.getWorkers();
    return workers.length > 0 ? 'online' : 'offline';
  } catch (error) {
    logger.error('[HEALTH] Worker check failed', error);
    return 'offline';
  }
}

async function getStatus(req, res) {
  logger.info('[API] Consulta de status dos serviços');
  const [postgres, redisStatus, worker] = await Promise.all([
    checkPostgres(),
    checkRedis(),
    checkWorker()
  ]);

  res.json({
    postgres,
    redis: redisStatus,
    erp: 'online',
    bullmq: redisStatus === 'online' ? 'online' : 'offline',
    n8n: 'online',
    app: 'online',
    worker
  });
}

async function getHealth(req, res) {
  const postgres = await checkPostgres();
  const redisStatus = await checkRedis();
  const worker = await checkWorker();

  res.json({
    api: 'online',
    database: postgres,
    redis: redisStatus,
    worker
  });
}

module.exports = { getStatus, getHealth };
