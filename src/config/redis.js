const IORedis = require('ioredis');
const logger = require('./logger');

const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on('connect', () => {
  logger.info('Redis conectado');
});

redis.on('ready', () => {
  logger.info('Redis pronto');
});

redis.on('error', (err) => {
  logger.error('Erro Redis', err);
});

redis.on('close', () => {
  logger.warn('Redis desconectado');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconectando');
});

module.exports = redis;