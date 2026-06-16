const prisma = require('../lib/prisma');

async function criar(dados) {
    return prisma.envio.create({
        data: dados
    });
}

async function atualizar(
    id,
    dados
) {
    return prisma.envio.update({
        where: {
            id
        },
        data: dados
    });
}

async function buscarPorId(id) {
    return prisma.envio.findUnique({
        where: {
            id
        }
    });
}

async function buscarPorHash(hashArquivo) {
    return prisma.envio.findUnique({
        where: {
            hashArquivo
        }
    });
}

async function buscarPorCpfCompetencia(
    cpf,
    competencia
) {
    return prisma.envio.findUnique({
        where: {
            cpf_competencia: {
                cpf,
                competencia
            }
        }
    });
}

async function listar() {
    return prisma.envio.findMany({
        orderBy: {
            dataProcessamento: 'desc'
        }
    });
}

async function listarPorStatus(status) {
    return prisma.envio.findMany({
        where: {
            status
        },
        orderBy: {
            dataProcessamento: 'desc'
        }
    });
}

module.exports = {
    criar,
    atualizar,
    buscarPorId,
    buscarPorHash,
    buscarPorCpfCompetencia,
    listar,
    listarPorStatus
};