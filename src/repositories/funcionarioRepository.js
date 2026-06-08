const prisma = require("../lib/prisma");

async function salvar(dados){
    return prisma.funcionario.upsert({
        where: {
            cpf: dados.cpf
        },
        update: {
            nome: dados.nome,
            telefone: dados.telefone,
            email: dados.email
        },
        create: dados
    })
}

async function buscarPorCpf(cpf){
    return prisma.funcionario.findUnique({
        where: {
            cpf
        }
    })
}

async function buscarPorCodigo(codigo) {
    return prisma.funcionario.findUnique({
        where: {
            codigo
        }
    })
}

async function listarTodos(){
    return prisma.funcionario.findMany()
}

module.exports = {
    salvar,
    buscarPorCpf,
    buscarPorCodigo,
    listarTodos
}