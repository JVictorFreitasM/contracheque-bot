const fs = require('fs');
const path = require('path');

const gerarHashArquivo = require('../utils/gerarHashArquivo');
const extrairDadosPdf = require('../useCases/contracheque/extrairDadosPdf');
const localizarFuncionario = require('../useCases/contracheque/localizarFuncionario');
const validarNomeFuncionario = require('../useCases/contracheque/validarNomeFuncionario');
const validarTelefoneFuncionario = require('../useCases/contracheque/validarTelefoneFuncionario');
const envioRepository = require('../repositories/envioRepository');
const STATUS = require('../utils/statusEnvio');

function montarResultado({ arquivo, funcionario, competencia, status, motivo }) {
  const resultado = {
    arquivo,
    status,
    motivo
  };

  if (funcionario) {
    resultado.funcionario = funcionario;
  }

  if (competencia) {
    resultado.competencia = competencia;
  }

  return resultado;
}

async function validarArquivoPdf(file, seenHashes) {
  const arquivo = file.originalname;
  const caminhoPdf = path.resolve(file.path);

  if (path.extname(arquivo).toLowerCase() !== '.pdf') {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: 'Formato inválido. Apenas PDF pode ser pré-validado.'
    });
  }

  if (!fs.existsSync(caminhoPdf)) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: 'Arquivo não encontrado no servidor.'
    });
  }

  let hashArquivo;
  try {
    hashArquivo = gerarHashArquivo(caminhoPdf);
  } catch (err) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: `Falha ao calcular hash do arquivo: ${err.message}`
    });
  }

  if (seenHashes.has(hashArquivo)) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: 'Duplicidade de hash entre arquivos selecionados.'
    });
  }

  seenHashes.set(hashArquivo, arquivo);

  const envioPorHash = await envioRepository.buscarPorHash(hashArquivo);
  if (envioPorHash) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: 'Arquivo já processado anteriormente.'
    });
  }

  let dadosPdf;
  try {
    dadosPdf = await extrairDadosPdf(caminhoPdf);
  } catch (err) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      motivo: `PDF inválido: ${err.message}`
    });
  }

  let funcionario;
  try {
    funcionario = await localizarFuncionario(dadosPdf);
  } catch (err) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      funcionario: dadosPdf.nome,
      competencia: dadosPdf.competencia,
      motivo: err.message || 'Funcionário não encontrado.'
    });
  }

  if (funcionario.ativo === false) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      funcionario: funcionario.nome,
      competencia: dadosPdf.competencia,
      motivo: 'Funcionário inativo.'
    });
  }

  try {
    validarNomeFuncionario(funcionario, dadosPdf);
  } catch (err) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      funcionario: funcionario.nome,
      competencia: dadosPdf.competencia,
      motivo: 'Nome do funcionário divergente.'
    });
  }

  try {
    validarTelefoneFuncionario(funcionario);
  } catch (err) {
    return montarResultado({
      arquivo,
      status: 'ERRO',
      funcionario: funcionario.nome,
      competencia: dadosPdf.competencia,
      motivo: err.message || 'Telefone do funcionário não encontrado.'
    });
  }

  if (funcionario.cpf && dadosPdf.competencia) {
    const envioExistente = await envioRepository.buscarPorCpfCompetencia(funcionario.cpf, dadosPdf.competencia);
    if (envioExistente) {
      return montarResultado({
        arquivo,
        status: 'ERRO',
        funcionario: funcionario.nome,
        competencia: dadosPdf.competencia,
        motivo: 'Duplicidade de competência para o mesmo CPF.'
      });
    }
  }

  return montarResultado({
    arquivo,
    funcionario: funcionario.nome,
    competencia: dadosPdf.competencia,
    status: 'VALIDO',
    motivo: null
  });
}

async function preValidarArquivos(files) {
  const resultados = [];
  const seenHashes = new Map();

  for (const file of files) {
    const resultado = await validarArquivoPdf(file, seenHashes);
    resultados.push(resultado);
  }

  const validos = resultados.filter((item) => item.status === 'VALIDO').length;
  const erros = resultados.length - validos;

  return {
    total: resultados.length,
    validos,
    erros,
    arquivos: resultados
  };
}

module.exports = {
  preValidarArquivos
};
