const { Queue } =
    require('bullmq');

const connection =
    require('../config/redis');

const envioQueue =
    new Queue(

        'envio-contracheque',

        {
            connection
        }

    );

module.exports =
    envioQueue;