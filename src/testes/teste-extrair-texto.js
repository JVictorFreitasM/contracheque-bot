// teste-pdf.js

const pdfService = require('../services/pdfService');

(async () => {

    const texto =
        await pdfService.extrairTextoDoPdf(
            './uploads/01_1.pdf'
        );

    console.log(texto);

})();