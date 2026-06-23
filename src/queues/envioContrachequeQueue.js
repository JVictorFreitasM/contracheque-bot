const { Queue } = require('bullmq');
const connection = require('../config/redis');

const filaEnvio = new Queue(
    'envio-contracheque',
    {
        connection
    }
);

module.exports = filaEnvio;