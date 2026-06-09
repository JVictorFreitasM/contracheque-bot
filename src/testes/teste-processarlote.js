require('dotenv').config();

const processadorLote =
    require('../services/processadorLoteService');

(async () => {

    await processadorLote
        .processarPasta();

})();