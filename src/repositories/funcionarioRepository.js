const prisma = require("../lib/prisma");

// async function salvar(dados){
//     return prisma.funcionario.upsert({
//         where: {
//             cpf: dados.cpf
//         },
//         update: {
//             nome: dados.nome,
//             telefone: dados.telefone,
//             email: dados.email
//         },
//         create: dados
//     })
// }
async function salvar(funcionario) {
await prisma.funcionario.upsert({
    where: {
        cpf: funcionario.cpf
    },

    update: {
        codigo: funcionario.codigo,
        nome: funcionario.nome,
        telefone: funcionario.telefone,
        email: funcionario.email,
        ativo: true,
        ultimaSincronizacao:
            funcionario.ultimaSincronizacao
    },

    create: funcionario
});
}

async function inativarNaoSincronizados(
    dataSincronizacao
) {

    return prisma.funcionario.updateMany({

        where: {

            OR: [

                {
                    ultimaSincronizacao: null
                },

                {
                    ultimaSincronizacao: {
                        lt: dataSincronizacao
                    }
                }

            ]

        },

        data: {
            ativo: false
        }

    });

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

async function atualizarBloqueio(codigo, bloqueiaContracheque) {
    return prisma.funcionario.update({
        where: { codigo },
        data: { bloqueia_contracheque: bloqueiaContracheque }
    });
}

async function listarTodos(){
    return prisma.funcionario.findMany()
}

module.exports = {
    salvar,
    buscarPorCpf,
    buscarPorCodigo,
    listarTodos,
    inativarNaoSincronizados
}