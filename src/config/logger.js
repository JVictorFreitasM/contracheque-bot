const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({

    level: 'info',

    format: winston.format.combine(

        winston.format.timestamp({

            format: 'YYYY-MM-DD HH:mm:ss'

        }),

        winston.format.printf(info => {

            return `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`;

        })

    ),

    transports: [

        new winston.transports.File({

            filename: path.join(
                'logs',
                'error.log'
            ),

            level: 'error'

        }),

        new winston.transports.File({

            filename: path.join(
                'logs',
                'combined.log'
            )

        })

    ]

});

if (process.env.NODE_ENV !== 'production') {

    logger.add(

        new winston.transports.Console()

    );

}

module.exports = logger;