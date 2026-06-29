const IORedis = require('ioredis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });

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