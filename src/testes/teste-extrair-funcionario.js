// teste-extracao.js

const pdfService = require('../services/pdfService');

(async () => {

    const texto =
        await pdfService.extrairTextoDoPdf(
            './uploads/01_1.pdf'
        );

    const funcionario =
        pdfService.extrairFuncionario(texto);

    console.log(funcionario);

})();