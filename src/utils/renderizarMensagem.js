const FALLBACKS = {
    nome: 'Colaborador',
    competencia: 'competência atual'
};

function renderizarMensagem(template, dados = {}) {
    if (!template) return '';

    return template.replace(/\{(\w+)\}/g, (match, chave) => {
        const valor = dados[chave];
        if (valor !== undefined && valor !== null && valor !== '') {
            return valor;
        }
        return FALLBACKS[chave] !== undefined ? FALLBACKS[chave] : match;
    });
}

module.exports = renderizarMensagem;
