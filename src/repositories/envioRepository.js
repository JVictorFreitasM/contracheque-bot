const prisma = require('../lib/prisma');

async function criar(dados) {
    reutrn.prisma.create({
        data: dados
    });
}

async function listar(){
    return prisma.envio.findMany();
}

module.exports = {
    criar,
    listar
}