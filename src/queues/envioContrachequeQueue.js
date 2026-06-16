const { Queue } = require('bullmq');

const filaEnvio = new Queue(
    'envio-contracheque',
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT)
        }
    }
);

module.exports = filaEnvio;