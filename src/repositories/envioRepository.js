const prisma = require('../lib/prisma');

async function criar(dados) {
    return prisma.envio.create({
        data: dados
    });
}

async function buscarPorHash(hashArquivo) {
    return prisma.envio.findUnique({
        where: {
             hashArquivo 
        }
    })
}

async function buscarPorCpfCompetencia(
    cpf,
    competencia
) {
    return prisma.envio.findUnique({
        where: {
            cpf_competencia: {
                cpf, competencia
            }
        }
    })
}

async function listar(){
    return prisma.envio.findMany();
}

module.exports = {
    criar,
    listar,
    buscarPorHash,
    buscarPorCpfCompetencia
}