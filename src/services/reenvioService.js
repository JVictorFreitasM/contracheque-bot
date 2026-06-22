const prisma = require('../lib/prisma');
const envioRepository = require('../repositories/envioRepository');
const envioContrachequeQueue = require('../queues/envioContrachequeQueue');
const logger = require('../config/logger');
const { STATUS } = require('../utils/statusEnvio');
const fs = require('fs');

async function reenviar(id) {
  const envio = await envioRepository.buscarPorId(id);
  if (!envio) {
    throw new Error('Registro de envio não encontrado.');
  }

  // Verificar se o arquivo PDF existe
  if (!envio.arquivoPdf || !fs.existsSync(envio.arquivoPdf)) {
    throw new Error('Arquivo PDF não encontrado no disco.');
  }

  // Verificar se o funcionário possui telefone
  if (!envio.telefone) {
    throw new Error('Funcionário não possui telefone cadastrado.');
  }

  // Prevenir reenvio de algo que já está em processamento ou reenviando
  if ([STATUS.PROCESSANDO, STATUS.REENVIANDO, STATUS.PENDENTE].includes(envio.status)) {
    throw new Error('O contracheque já está na fila de processamento.');
  }

  // Atualizar status para REENVIANDO, incrementar tentativas
  await prisma.envio.update({
    where: { id },
    data: {
      status: STATUS.REENVIANDO,
      tentativas: { increment: 1 },
      ultimaTentativaEnvio: new Date()
    }
  });

  // Adicionar na fila
  await envioContrachequeQueue.add(
    'reenviar',
    {
      envioId: id,
      codigoFuncionario: envio.codigoFuncionario,
      nomeFuncionario: envio.nomeFuncionario,
      cpf: envio.cpf,
      competencia: envio.competencia,
      hashArquivo: envio.hashArquivo,
      telefone: envio.telefone,
      caminhoPdf: envio.arquivoPdf,
      isTeste: false
    },
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  );

  logger.info(`[REENVIO] Job adicionado para o ID ${id}`);
}

async function reenviarTodosErros() {
  const enviosErro = await prisma.envio.findMany({
    where: {
      status: {
        in: [STATUS.ERRO, STATUS.ERRO_ENVIO, STATUS.ERRO_PDF]
      }
    }
  });

  if (!enviosErro || enviosErro.length === 0) {
    return 0;
  }

  const jobs = [];
  let adicionados = 0;

  for (const envio of enviosErro) {
    // Validar regras básicas antes de colocar na fila
    if (!envio.arquivoPdf || !fs.existsSync(envio.arquivoPdf)) continue;
    if (!envio.telefone) continue;

    // Atualiza o status no banco
    await prisma.envio.update({
      where: { id: envio.id },
      data: {
        status: STATUS.REENVIANDO,
        tentativas: { increment: 1 },
        ultimaTentativaEnvio: new Date()
      }
    });

    jobs.push({
      name: 'reenviar',
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
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    });

    adicionados++;
  }

  if (jobs.length > 0) {
    await envioContrachequeQueue.addBulk(jobs);
    logger.info(`[REENVIO_MASSA] ${jobs.length} jobs adicionados à fila de reenvio.`);
  }

  return adicionados;
}

module.exports = {
  reenviar,
  reenviarTodosErros
};
