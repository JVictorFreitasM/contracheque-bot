const prisma = require('../lib/prisma');

async function criar(dados) {
    return prisma.envio.create({
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