function obterTelefoneWhatsapp(funcionario) {

    if (!funcionario.telefone) {
        return null;
    }

    const numero =
        funcionario.telefone
            .toString()
            .replace(/\D/g, '');

    if (numero.length < 10) {
        return null;
    }

    return numero.startsWith('55')
        ? numero
        : `55${numero}`;

}

module.exports = {
    obterTelefoneWhatsapp
};