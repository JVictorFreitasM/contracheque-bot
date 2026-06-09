// teste-banco.js
require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const funcionarioRepository =
    require('../repositories/funcionarioRepository');

(async () => {

    const funcionario =
        await funcionarioRepository.buscarPorCodigo(
            677
        );

    console.log(funcionario);

})();

