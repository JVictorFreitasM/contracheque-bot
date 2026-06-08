const axios = require('../lib/axios');
const funcionarioRepository = require('../repositories/funcionarioRepository');

let tokenCache = null;
let tokenExpiration = null;

async function autenticar() {
    console.log('Agora:', new Date());
    console.log('Expira:', tokenExpiration);

    if (
        tokenCache &&
        tokenExpiration &&
        new Date() < tokenExpiration
    ) {
        return tokenCache;
    }

    const response = await axios.post(
        `${process.env.WK_BASE_URL}/api/v1/token`,
        {
            empresa: process.env.WK_EMPRESA,
            nomeUsuario: process.env.WK_USUARIO,
            senha: process.env.WK_SENHA
        }
    );
    console.log('Resposta da autenticação:', response.status, response.statusText);
    console.log(response.data);

    tokenCache = response.data.token;

    tokenExpiration = new Date(
        response.data.expiration
    );
    console.log('TOKEN EXPIRATION:', tokenExpiration);
    return tokenCache;
}

async function get(url) {

    const token = await autenticar();

    try {

        const response = await axios.get(
            url,
            {
                timeout: 120000,
                headers: {
                    Authorization: `Bearer ${token}`
                },
                params: {
                    Situacao: 'Ativos'
                }

            }
        );

        return response.data;

    }
    catch (error) {

        console.log('STATUS:',
            error.response?.status
        );

        console.log('HEADERS:',
            error.response?.headers
        );

        console.log('BODY:',
            error.response?.data
        );

        throw error;
    }
}

async function listarFuncionarios() {

    return get(
        `${process.env.WK_BASE_URL}/api/folha/v1/empregado`
    );

}
async function listarPessoas() {

    return get(
        `${process.env.WK_BASE_URL}/api/empresarial/v1/pessoa`
    );

}

async function sincronizarFuncionarios() {

    const dataSincronizacao = new Date();

    const funcionarios =
        await listarFuncionarios();

    if (funcionarios.length < 100) {

        throw new Error(
            `Quantidade inesperada de funcionários: ${funcionarios.length}`
        );

    }

    let total = 0;
    let ignorados = 0;

    for (const funcionario of funcionarios) {

        const cpf =
            funcionario.documento?.cpf;

        if (!cpf) {

            console.log(
                `Funcionário ${funcionario.nome} sem CPF`
            );

            ignorados++;

            continue;
        }

        await funcionarioRepository.salvar({

            codigo:
                funcionario.codigo,

            cpf,

            nome:
                funcionario.nome,

            telefone:
                funcionario.endereco?.celular
                    ? `${funcionario.endereco.dddCelular || ''}${funcionario.endereco.celular}`
                    : null,

            email:
                funcionario.endereco?.emailCorporativo,

            ativo: true,

            ultimaSincronizacao:
                dataSincronizacao

        });

        total++;

    }

    await funcionarioRepository
        .inativarNaoSincronizados(
            dataSincronizacao
        );

    return {
        total,
        ignorados
    };

}

module.exports = {
    autenticar,
    listarFuncionarios,
    sincronizarFuncionarios,
    listarPessoas
};