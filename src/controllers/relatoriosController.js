// src/controllers/relatoriosController.js
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
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

function rotularStatusEntrega(statusEntregaWhatsapp) {
  switch (statusEntregaWhatsapp) {
    case 'READ': return 'Lido';
    case 'DELIVERED': return 'Entregue';
    case 'SENT': return 'Enviado (sem confirmação)';
    default: return 'Sem confirmação';
  }
}

function formatarDataHoraBrasilia(data) {
  if (!data) return '';
  return data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function montarLinhasExportacao(envios, cpfCompleto) {
  return envios.map((envio) => ({
    nomeFuncionario: envio.nomeFuncionario || '',
    cpf: cpfCompleto ? (envio.cpf || '') : mascararCpf(envio.cpf),
    telefone: envio.telefone || '',
    competencia: envio.competencia || '',
    status: envio.status || '',
    dataEnvio: formatarDataHoraBrasilia(envio.dataEnvio),
    statusEntrega: rotularStatusEntrega(envio.statusEntregaWhatsapp),
    dataEntrega: formatarDataHoraBrasilia(envio.dataEntregaWhatsapp),
    dataLeitura: formatarDataHoraBrasilia(envio.dataLeituraWhatsapp),
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
  { chave: 'statusEntrega', titulo: 'Confirmação WhatsApp' },
  { chave: 'dataEntrega', titulo: 'Data de Entrega' },
  { chave: 'dataLeitura', titulo: 'Data de Leitura' },
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

// PDF em paisagem fica apertado com as 10 colunas do CSV/XLSX; omite
// "Mensagem de Erro" (texto livre e longo) para manter as demais legíveis.
const COLUNAS_PDF = COLUNAS_EXPORTACAO.filter((c) => c.chave !== 'mensagemErro');

function gerarPdfBuffer(linhas, filtros) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).text('Relatório de Envios - Contracheque Bot', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#555').text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}` +
      (filtros.competencia ? ` | Competência: ${filtros.competencia}` : '') +
      (filtros.status ? ` | Status: ${filtros.status}` : ''),
      { align: 'center' }
    );
    doc.moveDown(1);
    doc.fillColor('#000');

    const colunas = COLUNAS_PDF.map((c) => c.titulo);
    const larguraColuna = (doc.page.width - 80) / colunas.length;

    function desenharCabecalho() {
      const y = doc.y;
      doc.fontSize(8).font('Helvetica-Bold');
      colunas.forEach((titulo, i) => {
        doc.text(titulo, 40 + i * larguraColuna, y, { width: larguraColuna, ellipsis: true });
      });
      doc.moveDown(0.5);
      doc.font('Helvetica');
    }

    desenharCabecalho();

    linhas.forEach((linha) => {
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
        desenharCabecalho();
      }
      const linhaY = doc.y;
      COLUNAS_PDF.forEach((c, i) => {
        doc.text(String(linha[c.chave] ?? ''), 40 + i * larguraColuna, linhaY, {
          width: larguraColuna,
          ellipsis: true,
        });
      });
      doc.moveDown(0.7);
    });

    doc.end();
  });
}

async function exportarRelatorios(req, res) {
  try {
    const formato = (req.query.formato || 'csv').toLowerCase();
    const cpfCompleto = req.query.cpfCompleto === 'true';

    if (!['csv', 'xlsx', 'pdf'].includes(formato)) {
      return res.status(400).json({ error: 'Formato inválido. Use "csv", "xlsx" ou "pdf".' });
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

    if (formato === 'xlsx') {
      const buffer = await gerarXlsxBuffer(linhas);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio-${dataArquivo}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }

    const bufferPdf = await gerarPdfBuffer(linhas, { competencia: req.query.competencia, status: req.query.status });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-${dataArquivo}.pdf"`);
    return res.send(bufferPdf);
  } catch (err) {
    console.error('Erro ao exportar relatórios:', err);
    res.status(500).json({ error: 'Falha ao exportar relatórios' });
  }
}

module.exports = { getRelatorios, exportarRelatorios };
