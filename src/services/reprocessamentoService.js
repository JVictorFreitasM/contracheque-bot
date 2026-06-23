const prisma = require('../lib/prisma');
const envioContrachequeQueue = require('../queues/envioContrachequeQueue');
const logger = require('../config/logger');
const { STATUS } = require('../utils/statusEnvio');

const ERROR_REPROCESS_STATUSES = [
  STATUS.ERRO,
  STATUS.ERRO_ENVIO,
  STATUS.ERRO_PDF,
  STATUS.SEM_TELEFONE,
  STATUS.FUNCIONARIO_NAO_ENCONTRADO,
  STATUS.NOME_DIVERGENTE
];

const PENDENTE_REPROCESS_STATUSES = [STATUS.PENDENTE];
const FULL_REPROCESS_STATUSES = [
  ...PENDENTE_REPROCESS_STATUSES,
  ...ERROR_REPROCESS_STATUSES
];

async function reprocessarLote(competencia, usuario = 'manual') {
  return reprocessar(competencia, FULL_REPROCESS_STATUSES, 'REPROCESSAR_LOTE', usuario);
}

async function reprocessarErros(competencia, usuario = 'manual') {
  return reprocessar(competencia, ERROR_REPROCESS_STATUSES, 'REPROCESSAR_ERROS', usuario);
}

async function reprocessarPendentes(competencia, usuario = 'manual') {
  return reprocessar(competencia, PENDENTE_REPROCESS_STATUSES, 'REPROCESSAR_PENDENTES', usuario);
}

async function reprocessar(competencia, statuses, tipo, usuario) {
  const envios = await prisma.envio.findMany({
    where: {
      competencia,
      status: {
        in: statuses
      }
    },
    select: {
      id: true,
      codigoFuncionario: true,
      nomeFuncionario: true,
      cpf: true,
      competencia: true,
      hashArquivo: true,
      telefone: true,
      arquivoPdf: true
    }
  });

  if (!envios.length) {
    return 0;
  }

  const validEnvios = envios.filter((envio) => envio.cpf && envio.competencia && envio.arquivoPdf);
  if (!validEnvios.length) {
    return 0;
  }

  const envioIds = validEnvios.map((envio) => envio.id);

  await prisma.envio.updateMany({
    where: {
      id: {
        in: envioIds
      }
    },
    data: {
      status: STATUS.REENVIANDO,
      tentativas: {
        increment: 1
      },
      ultimaTentativaEnvio: new Date(),
      mensagemErro: null
    }
  });

  await removerJobsPendentes(validEnvios);

  const jobs = validEnvios.map((envio) => ({
    name: 'reprocessar',
    data: {
      envioId: envio.id,
      codigoFuncionario: envio.codigoFuncionario,
      nomeFuncionario: envio.nomeFuncionario,
      cpf: envio.cpf,
      competencia: envio.competencia,
      hashArquivo: envio.hashArquivo,
      telefone: envio.telefone,
      caminhoPdf: envio.arquivoPdf,
      isTeste: false
    },
    opts: {
      jobId: `reprocess-${envio.id}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  }));

  if (jobs.length > 0) {
    await envioContrachequeQueue.addBulk(jobs);
  }

  await prisma.reprocessamentoLote.create({
    data: {
      competencia,
      tipo,
      quantidade: validEnvios.length,
      usuario,
      descricao: `Reprocessamento ${tipo.toLowerCase()} para competência ${competencia}.`
    }
  });

  logger.info(`[REPROCESSAMENTO] ${tipo} iniciado para ${competencia}: ${validEnvios.length} envios.`);

  return validEnvios.length;
}

async function removerJobsPendentes(envios) {
  const envioIds = new Set(envios.map((envio) => envio.id));
  const jobs = await envioContrachequeQueue.getJobs(['waiting', 'delayed', 'paused']);

  for (const job of jobs) {
    if (job.data && envioIds.has(job.data.envioId)) {
      await job.remove();
    }
  }
}

module.exports = {
  reprocessarLote,
  reprocessarErros,
  reprocessarPendentes
};
