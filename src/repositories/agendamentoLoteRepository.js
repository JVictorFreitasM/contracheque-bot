const prisma = require('../lib/prisma');

async function criar(dados) {
    return prisma.agendamentoLote.create({
        data: dados
    });
}

async function listar() {
    return prisma.agendamentoLote.findMany({
        orderBy: {
            dataHoraEnvio: 'desc'
        }
    });
}

async function buscarPorId(id) {
    return prisma.agendamentoLote.findUnique({
        where: {
            id
        }
    });
}

async function buscarPendentesVencidos(agora) {
    return prisma.agendamentoLote.findMany({
        where: {
            status: 'PENDENTE',
            dataHoraEnvio: {
                lte: agora
            }
        }
    });
}

async function marcarExecutado(id) {
    return prisma.agendamentoLote.update({
        where: {
            id
        },
        data: {
            status: 'EXECUTADO',
            executadoEm: new Date()
        }
    });
}

async function cancelar(id) {
    return prisma.agendamentoLote.update({
        where: {
            id
        },
        data: {
            status: 'CANCELADO'
        }
    });
}

module.exports = {
    criar,
    listar,
    buscarPorId,
    buscarPendentesVencidos,
    marcarExecutado,
    cancelar
};
