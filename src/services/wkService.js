const axios = require('../lib/axios');
const funcionarioRepository = require('../repositories/funcionarioRepository');
const logger = require('../config/logger');

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
    logger.info('[SYNC] Início da Sincronização de Funcionários (ERP -> PostgreSQL)');
    const inicio = Date.now();
    const dataSincronizacao = new Date();

    try {
        const funcionarios = await listarFuncionarios();

        if (!funcionarios || funcionarios.length === 0) {
            throw new Error(`Retorno vazio da API do ERP. Cancelando sincronização para proteção de dados.`);
        }

        let total = 0;
        let ignorados = 0;

        for (const funcionario of funcionarios) {
            const cpf = funcionario.documento?.cpf;

            if (!cpf) {
                ignorados++;
                continue;
            }

            await funcionarioRepository.salvar({
                codigo: funcionario.codigo,
                cpf,
                nome: funcionario.nome,
                telefone: funcionario.endereco?.celular
                    ? `${funcionario.endereco.dddCelular || ''}${funcionario.endereco.celular}`
                    : null,
                email: funcionario.endereco?.emailCorporativo,
                ativo: true,
                ultimaSincronizacao: dataSincronizacao
            });

            total++;
        }

        await funcionarioRepository.inativarNaoSincronizados(dataSincronizacao);

        const tempoDecorrido = ((Date.now() - inicio) / 1000).toFixed(2);
        logger.info(`[SYNC] Sincronização finalizada em ${tempoDecorrido}s. Recebidos: ${funcionarios.length} | Inseridos/Atualizados: ${total} | Ignorados (sem CPF): ${ignorados}`);

        return { total, ignorados };

    } catch (erro) {
        logger.error(`[SYNC] Falha crítica na sincronização ERP -> PostgreSQL: ${erro.message}`);
        throw erro;
    }
}

module.exports = {
    autenticar,
    listarFuncionarios,
    sincronizarFuncionarios,
    listarPessoas
};