const n8nService =
    require('../services/n8nService');

(async () => {

    const path = require('path');

await n8nService.enviarPdf(
    '5586988661130',
    path.resolve(
        __dirname,
        '../../uploads/'
    )
);

})();