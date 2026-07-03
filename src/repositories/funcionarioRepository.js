const prisma = require("../lib/prisma");

async function salvar(funcionario) {
try {
    await prisma.funcionario.upsert({
        where: {
            codigo: funcionario.codigo
        },

        update: {
            cpf: funcionario.cpf,
            nome: funcionario.nome,
            telefone: funcionario.telefone,
            email: funcionario.email,
            ativo: true,
            ultimaSincronizacao:
                funcionario.ultimaSincronizacao
        },

        create: funcionario
    });
} catch (erro) {
    erro.message = `[Funcionario codigo=${funcionario.codigo} cpf=${funcionario.cpf}] ${erro.message}`;
    throw erro;
}
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

async function contarPorStatus() {
    const [ativos, inativos] = await Promise.all([
        prisma.funcionario.count({ where: { ativo: true } }),
        prisma.funcionario.count({ where: { ativo: false } })
    ]);

    return { ativos, inativos };
}

module.exports = {
    salvar,
    buscarPorCpf,
    buscarPorCodigo,
    listarTodos,
    inativarNaoSincronizados,
    contarPorStatus
}