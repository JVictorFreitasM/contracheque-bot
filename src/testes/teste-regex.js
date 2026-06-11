const extrairFuncionario = require('../useCases/contracheque/extrairDadosPdf')

const casos = [
    {
        descricao: "Nome na mesma linha",
        texto: `Codigo Nome Funcionário
                12345 João da Silva`
    },
    {
        descricao: "Nome em linha separada",
        texto: `Codigo Nome Funcionário
                12345
                João da Silva`
    },
    {
        
    }
]

for (const caso of casos) {
    console.log(`\n${caso.descricao}`);

    try {
        const resultado = extrairFuncionario(caso.texto);
        console.log(resultado);
    } catch (error) {
        console.error(error.message)
    }
}