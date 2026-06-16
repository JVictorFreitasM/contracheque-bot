const IORedis = require('ioredis');

const redis = new IORedis({
    host: 'localhost',
    port: 6379
});

redis.ping()
    .then(console.log)
    .catch(console.error);