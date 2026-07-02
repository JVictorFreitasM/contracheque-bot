const prisma = require('../lib/prisma');

async function iniciar(dataInicio) {
    return prisma.sincronizacaoWK.create({
        data: {
            dataInicio
        }
    });
}

async function finalizar(id, dados) {
    return prisma.sincronizacaoWK.update({
        where: {
            id
        },
        data: dados
    });
}

async function buscarUltima() {
    return prisma.sincronizacaoWK.findFirst({
        orderBy: {
            dataInicio: 'desc'
        }
    });
}

async function listarUltimas(limite) {
    return prisma.sincronizacaoWK.findMany({
        orderBy: {
            dataInicio: 'desc'
        },
        take: limite
    });
}

module.exports = {
    iniciar,
    finalizar,
    buscarUltima,
    listarUltimas
};
