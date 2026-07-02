// src/controllers/relatoriosController.js
const ExcelJS = require('exceljs');
const prisma = require('../lib/prisma');
const { STATUS } = require('../utils/statusEnvio');

async function getRelatorios(req, res) {
  try {
    const totalEnvios = await prisma.envio.count();
    const porStatus = await prisma.envio.groupBy({
      by: ['status'],
      _count: { status: true },
    });
    const totalFuncionarios = await prisma.funcionario.count();
    const ativos = await prisma.funcionario.count({ where: { ativo: true } });
    const inativos = await prisma.funcionario.count({ where: { ativo: false } });

    // Confirmação de entrega/leitura via webhook da Evolution API (só preenchido
    // quando a instância envia os eventos de MESSAGES_UPDATE)
    const entregues = await prisma.envio.count({ where: { dataEntregaWhatsapp: { not: null } } });
    const lidos = await prisma.envio.count({ where: { dataLeituraWhatsapp: { not: null } } });

    const statusMap = porStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    res.json({
      totalEnvios,
      status: {
        pendente: statusMap[STATUS.PENDENTE] || 0,
        processando: statusMap[STATUS.PROCESSANDO] || 0,
        enviado: statusMap[STATUS.ENVIADO] || 0,
        erro: statusMap[STATUS.ERRO] || 0,
        entregue: entregues,
        lido: lidos,
      },
      totalFuncionarios,
      funcionarios: {
        ativos,
        inativos,
      },
    });
  } catch (err) {
    console.error('Erro ao buscar relatórios:', err);
    res.status(500).json({ error: 'Falha ao obter relatórios' });
  }
}

function mascararCpf(cpf) {
  if (!cpf) return '';
  const digitos = String(cpf);
  if (digitos.length <= 3) return digitos;
  return '*'.repeat(digitos.length - 3) + digitos.slice(-3);
}

async function buscarEnviosParaExportacao(req) {
  const { competencia, status } = req.query;

  const where = {};
  if (competencia) where.competencia = competencia;
  if (status) where.status = status;

  return prisma.envio.findMany({
    where,
    orderBy: { dataProcessamento: 'desc' },
  });
}

function montarLinhasExportacao(envios, cpfCompleto) {
  return envios.map((envio) => ({
    nomeFuncionario: envio.nomeFuncionario || '',
    cpf: cpfCompleto ? (envio.cpf || '') : mascararCpf(envio.cpf),
    telefone: envio.telefone || '',
    competencia: envio.competencia || '',
    status: envio.status || '',
    dataEnvio: envio.dataEnvio ? envio.dataEnvio.toISOString() : '',
    mensagemErro: envio.mensagemErro || '',
  }));
}

const COLUNAS_EXPORTACAO = [
  { chave: 'nomeFuncionario', titulo: 'Nome do Funcionário' },
  { chave: 'cpf', titulo: 'CPF' },
  { chave: 'telefone', titulo: 'Telefone' },
  { chave: 'competencia', titulo: 'Competência' },
  { chave: 'status', titulo: 'Status' },
  { chave: 'dataEnvio', titulo: 'Data de Envio' },
  { chave: 'mensagemErro', titulo: 'Mensagem de Erro' },
];

function escaparCampoCsv(valor) {
  const texto = String(valor ?? '');
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function gerarCsv(linhas) {
  const cabecalho = COLUNAS_EXPORTACAO.map((c) => escaparCampoCsv(c.titulo)).join(',');
  const corpo = linhas
    .map((linha) => COLUNAS_EXPORTACAO.map((c) => escaparCampoCsv(linha[c.chave])).join(','))
    .join('\n');
  // BOM para o Excel reconhecer UTF-8 corretamente
  return '﻿' + cabecalho + '\n' + corpo;
}

async function gerarXlsxBuffer(linhas) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Relatório de Envios');

  worksheet.columns = COLUNAS_EXPORTACAO.map((c) => ({ header: c.titulo, key: c.chave, width: 22 }));
  worksheet.getRow(1).font = { bold: true };
  linhas.forEach((linha) => worksheet.addRow(linha));

  return workbook.xlsx.writeBuffer();
}

async function exportarRelatorios(req, res) {
  try {
    const formato = (req.query.formato || 'csv').toLowerCase();
    const cpfCompleto = req.query.cpfCompleto === 'true';

    if (formato !== 'csv' && formato !== 'xlsx') {
      return res.status(400).json({ error: 'Formato inválido. Use "csv" ou "xlsx".' });
    }

    const envios = await buscarEnviosParaExportacao(req);
    const linhas = montarLinhasExportacao(envios, cpfCompleto);

    const dataArquivo = new Date().toISOString().split('T')[0];

    if (formato === 'csv') {
      const csv = gerarCsv(linhas);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-${dataArquivo}.csv"`);
      return res.send(csv);
    }

    const buffer = await gerarXlsxBuffer(linhas);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${dataArquivo}.xlsx"`);
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Erro ao exportar relatórios:', err);
    res.status(500).json({ error: 'Falha ao exportar relatórios' });
  }
}

module.exports = { getRelatorios, exportarRelatorios };
