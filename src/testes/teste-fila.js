require('dotenv').config();

const { Queue } = require('bullmq');

const fila = new Queue(
    'envio-contracheque',
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT)
        }
    }
);

(async () => {

    await fila.add(
        'enviar-pdf',
        {
            telefone: '5586988661130',
            caminhoPdf: 'C:/Users/Copperline/Desktop/bot-contracheque-n8n-evolutionAPI/contracheque automatico/contracheque-bot/uploads/01_2.pdf'
        }
    );

    console.log('Job criado');

    process.exit(0);

})();