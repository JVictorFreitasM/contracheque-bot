const axios = require('../lib/axios');
const funcionarioRepository = require('../repositories/funcionarioRepository');

let tokenCache = null;
let tokenExpiration = null;

async function autenticar() {

    if (
        tokenCache &&
        tokenExpiration &&
        new Date() < tokenExpiration
    ) {
        return tokenCache;
    }

    const response = await axios.post(
        '/api/v1/token',
        {
            empresa: process.env.WK_EMPRESA,
            nomeUsuario: process.env.WK_USUARIO,
            senha: process.env.WK_SENHA
        }
    );

    tokenCache = response.data.token;

    tokenExpiration = new Date(
        response.data.expiration
    );

    return tokenCache;
}

async function get(url) {

    const token = await autenticar();

    const response = await axios.get(
        url,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
}

async function listarFuncionarios() {

    return get(
        '/api/folha/v1/empregado'
    );

}

async function sincronizarFuncionarios() {

    const funcionarios =
        await listarFuncionarios();

    let total = 0;

    for (const funcionario of funcionarios) {

        console.log(
            `Sincronizando ${funcionario.codigo} - ${funcionario.nome}`
        );

        await funcionarioRepository.salvar({

            codigo:
                funcionario.codigo,

            cpf:
                funcionario.documento?.cpf,

            nome:
                funcionario.nome,

            telefone:
                funcionario.endereco?.celular
                    ? `${funcionario.endereco.dddCelular || ''}${funcionario.endereco.celular}`
                    : null,

            email:
                funcionario.endereco?.emailCorporativo

        });

        total++;

    }

    return {
        total
    };

}

module.exports = {
    autenticar,
    listarFuncionarios,
    sincronizarFuncionarios
};