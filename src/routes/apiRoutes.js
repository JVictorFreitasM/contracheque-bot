// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();

const { idpAuth } = require('../config/idpAuth');
const { requireAuth } = idpAuth;

// Controllers
const { getMe } = require('../controllers/authController');
const { getMetrics } = require('../controllers/metricsController');
const { getStatus, getHealth } = require('../controllers/statusController');
const handleUpload = require('../controllers/uploadsController');
const { preValidarUploads } = require('../controllers/preValidacaoController');
const { getPendentes } = require('../controllers/pendentesController');
const { getErros } = require('../controllers/errosController');
const { getLotes, getLoteProgresso, cancelLote, reprocessarLote, reprocessarErros, reprocessarPendentes, getReprocessamentosLote } = require('../controllers/lotesController');
const { getFuncionarios, atualizarBloqueioContracheque } = require('../controllers/funcionariosController');
const { getRelatorios, exportarRelatorios } = require('../controllers/relatoriosController');
const { reenviarContracheque, reenviarTodosErros } = require('../controllers/reenvioController');
const { getProcessamentoStatus, streamProcessamentoStatus } = require('../controllers/processamentoController');
const { receberWebhook } = require('../controllers/webhookController');
const { getStatus: getWkStatus } = require('../controllers/wkStatusController');
const { getAgendamentos, cancelarAgendamento } = require('../controllers/agendamentosController');

const monitoramentoController = (req, res) => {
  res.json({
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    jobs: { awaiting: 0, active: 0, completed: 0, failed: 0 }
  });
};
const configuracoesController = require('../controllers/configuracoesController');

// Rotas
/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Usuario autenticado (claims do token do IdP)
 *     tags: [Autenticacao]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Usuario logado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     sub: { type: string }
 *                     email: { type: string }
 *                     name: { type: string }
 *                     role: { type: string, nullable: true }
 *                     system: { type: string, example: contracheque-bot }
 *       302:
 *         description: Sem sessao valida - requireAuth do idp-client redireciona pro /auth/login (nao retorna JSON 401)
 */
router.get('/me', requireAuth, getMe);

/**
 * @swagger
 * /api/dashboard/indicadores:
 *   get:
 *     summary: Indicadores do dashboard principal
 *     tags: [Dashboard]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Contagens por status + proximo lote agendado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendentes: { type: integer }
 *                 enviados: { type: integer }
 *                 erros: { type: integer }
 *                 duplicados: { type: integer }
 *                 funcionariosSincronizados: { type: integer }
 *                 ultimaSincronizacao: { type: string, format: date-time, nullable: true }
 *                 proximoLote: { type: string, nullable: true, description: "DIA_ENVIO_CONTRACHEQUES" }
 *                 distribuicao:
 *                   type: object
 *                   properties:
 *                     enviados: { type: integer }
 *                     pendentes: { type: integer }
 *                     erros: { type: integer }
 *                     duplicados: { type: integer }
 */
router.get('/dashboard/indicadores', requireAuth, getMetrics);

/**
 * @swagger
 * /api/status/servicos:
 *   get:
 *     summary: Status dos servicos integrados (Postgres, Redis, worker, ERP, BullMQ, n8n)
 *     tags: [Monitoramento]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: "Status de cada servico (online/offline) - erp e n8n hoje sao sempre 'online' (mock, nao ha checagem real)"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postgres: { type: string, enum: [online, offline] }
 *                 redis: { type: string, enum: [online, offline] }
 *                 erp: { type: string, enum: [online] }
 *                 bullmq: { type: string, enum: [online, offline] }
 *                 n8n: { type: string, enum: [online] }
 *                 app: { type: string, enum: [online] }
 *                 worker: { type: string, enum: [online, offline] }
 */
router.get('/status/servicos', requireAuth, getStatus);
// OS 15-A, item 2.4: verificado que /health não é consultada por Docker healthcheck
// nem uptime monitor externo (nenhum HEALTHCHECK no Dockerfile, nenhum healthcheck:
// no docker-compose.yml) - único consumidor é a tela Monitoramento.jsx do próprio
// painel autenticado. Condição da OS para liberar a rota não se confirma, então
// requireAuth permanece. Reavaliar se um healthcheck externo for adicionado depois.
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check (Postgres, Redis, worker)
 *     description: Protegido por requireAuth (nao e consultado por Docker healthcheck nem monitor externo - so pela tela Monitoramento.jsx do proprio painel).
 *     tags: [Monitoramento]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Status de cada dependencia
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 api: { type: string, enum: [online] }
 *                 database: { type: string, enum: [online, offline] }
 *                 redis: { type: string, enum: [online, offline] }
 *                 worker: { type: string, enum: [online, offline] }
 */
router.get('/health', requireAuth, getHealth);

/**
 * @swagger
 * /api/uploads:
 *   post:
 *     summary: Upload de contracheques (PDF/XLSX/CSV)
 *     description: |
 *       Campo de formulario `files` (array, multipart). Sem `dataHoraEnvio`, os arquivos ficam pra
 *       serem pegos pelo agendamento padrao do cron (`DIA_ENVIO_CONTRACHEQUES`); com `dataHoraEnvio`,
 *       cria um agendamento especifico pra aquele lote.
 *     tags: [Uploads]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [files]
 *             properties:
 *               files:
 *                 type: array
 *                 items: { type: string, format: binary }
 *               dataHoraEnvio:
 *                 type: string
 *                 format: date-time
 *                 description: "Opcional - ISO 8601. Se ausente, usa o agendamento padrao do cron."
 *     responses:
 *       201:
 *         description: Upload concluido (e agendado, se dataHoraEnvio informado)
 *       400:
 *         description: dataHoraEnvio invalida
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } }
 */
router.post('/uploads', requireAuth, require('../middlewares/multerUpload'), handleUpload);

/**
 * @swagger
 * /api/uploads/pre-validar:
 *   post:
 *     summary: "Pre-valida arquivos antes do upload definitivo (ex.: nomes de funcionario nao encontrados)"
 *     tags: [Uploads]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       200:
 *         description: Resultado da pre-validacao
 */
router.post('/uploads/pre-validar', requireAuth, require('../middlewares/multerUpload'), preValidarUploads);

/**
 * @swagger
 * /api/pendentes:
 *   get:
 *     summary: Lista envios pendentes (paginado, com busca)
 *     tags: [Envios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Busca por nome do funcionario (texto) ou matricula (numero exato)
 *     responses:
 *       200:
 *         description: Lista paginada de envios pendentes
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/Paginated' } }
 */
router.get('/pendentes', requireAuth, getPendentes);

/**
 * @swagger
 * /api/erros:
 *   get:
 *     summary: Lista envios com erro (paginado, com busca)
 *     description: Inclui os status ERRO_ENVIO, ERRO_PDF, SEM_TELEFONE, FUNCIONARIO_NAO_ENCONTRADO, NOME_DIVERGENTE.
 *     tags: [Envios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Busca por nome, mensagem de erro (texto) ou matricula (numero exato)
 *     responses:
 *       200:
 *         description: Lista paginada de envios com erro
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/Paginated' } }
 */
router.get('/erros', requireAuth, getErros);
/**
 * @swagger
 * /api/lotes:
 *   get:
 *     summary: Lista lotes (agrupados por competencia), paginado
 *     description: "`id` de cada lote e a competencia codificada em base64url (ver /api/lotes/{id}/*)."
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista paginada de lotes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Paginated'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string, description: "competencia em base64url" }
 *                           nome: { type: string }
 *                           competencia: { type: string }
 *                           quantidade: { type: integer }
 *                           status: { type: string, enum: [pendente, processando, concluido, erro, cancelado] }
 *                           data: { type: string, format: date, nullable: true }
 */
router.get('/lotes', requireAuth, getLotes);

/**
 * @swagger
 * /api/lotes/{id}/progresso:
 *   get:
 *     summary: Progresso de processamento de um lote
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: id do lote (competencia em base64url)
 *     responses:
 *       200:
 *         description: Contagens do lote
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 competencia: { type: string }
 *                 total_pdfs: { type: integer }
 *                 processados: { type: integer }
 *                 erros: { type: integer }
 *                 pendentes: { type: integer }
 *                 cancelados: { type: integer }
 *       400:
 *         description: id invalido
 *       404:
 *         description: Lote nao encontrado
 */
router.get('/lotes/:id/progresso', requireAuth, getLoteProgresso);

/**
 * @swagger
 * /api/lotes/{id}/cancelar:
 *   post:
 *     summary: Cancela um lote (envios pendentes/processando/reenviando)
 *     description: Marca os envios como cancelados e remove os jobs ainda nao processados da fila BullMQ.
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lote cancelado
 *       400:
 *         description: id invalido
 */
router.post('/lotes/:id/cancelar', requireAuth, cancelLote);

/**
 * @swagger
 * /api/lotes/{id}/reprocessar:
 *   post:
 *     summary: Reprocessa o lote inteiro
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reprocessamento iniciado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 quantidade: { type: integer }
 *                 message: { type: string }
 */
router.post('/lotes/:id/reprocessar', requireAuth, reprocessarLote);

/**
 * @swagger
 * /api/lotes/{id}/reprocessar-erros:
 *   post:
 *     summary: Reprocessa so os envios com erro do lote
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reprocessamento iniciado
 */
router.post('/lotes/:id/reprocessar-erros', requireAuth, reprocessarErros);

/**
 * @swagger
 * /api/lotes/{id}/reprocessar-pendentes:
 *   post:
 *     summary: Reprocessa so os envios pendentes do lote
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Reprocessamento iniciado
 */
router.post('/lotes/:id/reprocessar-pendentes', requireAuth, reprocessarPendentes);

/**
 * @swagger
 * /api/lotes/{id}/reprocessamentos:
 *   get:
 *     summary: Historico de reprocessamentos de um lote
 *     tags: [Lotes]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de registros de reprocessamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 */
router.get('/lotes/:id/reprocessamentos', requireAuth, getReprocessamentosLote);
/**
 * @swagger
 * /api/funcionarios:
 *   get:
 *     summary: Lista funcionarios sincronizados (paginado, com busca)
 *     tags: [Funcionarios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Busca por nome/telefone (texto) ou codigo/matricula (numero exato)
 *     responses:
 *       200:
 *         description: Lista paginada de funcionarios
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/Paginated' } }
 */
router.get('/funcionarios', requireAuth, getFuncionarios);

/**
 * @swagger
 * /api/funcionarios/{id}/bloqueio-contracheque:
 *   patch:
 *     summary: Bloqueia/desbloqueia o envio de contracheque pra um funcionario
 *     tags: [Funcionarios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: codigo (matricula) do funcionario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bloqueia_contracheque]
 *             properties:
 *               bloqueia_contracheque: { type: boolean }
 *     responses:
 *       200:
 *         description: Atualizado
 *       400:
 *         description: bloqueia_contracheque nao e booleano
 */
router.patch('/funcionarios/:id/bloqueio-contracheque', requireAuth, atualizarBloqueioContracheque);

/**
 * @swagger
 * /api/relatorios:
 *   get:
 *     summary: Resumo consolidado (envios por status, funcionarios ativos/inativos, confirmacoes WhatsApp)
 *     tags: [Relatorios]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Indicadores consolidados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEnvios: { type: integer }
 *                 status:
 *                   type: object
 *                   properties:
 *                     pendente: { type: integer }
 *                     processando: { type: integer }
 *                     enviado: { type: integer }
 *                     erro: { type: integer }
 *                     entregue: { type: integer, description: "confirmado via webhook da Evolution API" }
 *                     lido: { type: integer, description: "confirmado via webhook da Evolution API" }
 *                 totalFuncionarios: { type: integer }
 *                 funcionarios:
 *                   type: object
 *                   properties:
 *                     ativos: { type: integer }
 *                     inativos: { type: integer }
 */
router.get('/relatorios', requireAuth, getRelatorios);

/**
 * @swagger
 * /api/relatorios/exportar:
 *   get:
 *     summary: Exporta envios em CSV ou PDF
 *     tags: [Relatorios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: query
 *         name: formato
 *         schema: { type: string, enum: [csv, pdf], default: csv }
 *       - in: query
 *         name: competencia
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: cpfCompleto
 *         schema: { type: string, enum: ["true", "false"], default: "false" }
 *         description: "Sem 'true' explicito, CPF vem mascarado (ex.: ****.***.789)"
 *     responses:
 *       200:
 *         description: Arquivo CSV ou PDF (Content-Disposition attachment)
 *         content:
 *           text/csv: {}
 *           application/pdf: {}
 */
router.get('/relatorios/exportar', requireAuth, exportarRelatorios);

/**
 * @swagger
 * /api/contracheques/{id}/reenviar:
 *   post:
 *     summary: Reenvia um contracheque especifico (adiciona a fila de reenvio)
 *     tags: [Envios]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Adicionado a fila
 *       400:
 *         description: "ID invalido, ou erro de negocio (ex.: funcionario bloqueado)"
 *         content:
 *           application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } }
 */
router.post('/contracheques/:id/reenviar', requireAuth, reenviarContracheque);

/**
 * @swagger
 * /api/contracheques/reenviar-erros:
 *   post:
 *     summary: Reenvia todos os contracheques com erro (adiciona todos a fila de reenvio)
 *     tags: [Envios]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Quantidade adicionada a fila
 */
router.post('/contracheques/reenviar-erros', requireAuth, reenviarTodosErros);

/**
 * @swagger
 * /api/monitoramento:
 *   get:
 *     summary: Metricas de memoria/uptime do processo (painel de monitoramento)
 *     description: "`jobs` hoje e sempre zerado (placeholder) - nao reflete a fila BullMQ real."
 *     tags: [Monitoramento]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Metricas do processo Node
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 memoryUsage: { type: object }
 *                 uptime: { type: number }
 *                 jobs:
 *                   type: object
 *                   properties:
 *                     awaiting: { type: integer }
 *                     active: { type: integer }
 *                     completed: { type: integer }
 *                     failed: { type: integer }
 */
router.get('/monitoramento', requireAuth, monitoramentoController);

/**
 * @swagger
 * /api/processamento/status:
 *   get:
 *     summary: Status do processamento do lote atual (contagens + previsao de termino)
 *     tags: [Monitoramento]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Snapshot do processamento em andamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loteAtual: { type: string }
 *                 total: { type: integer }
 *                 processados: { type: integer }
 *                 enviados: { type: integer }
 *                 erros: { type: integer }
 *                 restantes: { type: integer }
 *                 tempoMedio: { type: number, description: "segundos por envio" }
 *                 previsaoTermino: { type: string, example: "05:30", description: "mm:ss" }
 *                 workerOnline: { type: boolean }
 *                 redisOnline: { type: boolean }
 *                 evolutionOnline: { type: boolean }
 *       500:
 *         description: Falha ao obter status
 */
router.get('/processamento/status', requireAuth, getProcessamentoStatus);

/**
 * @swagger
 * /api/processamento/stream:
 *   get:
 *     summary: Server-Sent Events (SSE) do status de processamento, atualizado a cada 3s
 *     description: "Mesmo payload de /api/processamento/status, enviado via `text/event-stream` (`data: {...}\\n\\n`) ate a conexao fechar."
 *     tags: [Monitoramento]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Stream SSE
 *         content:
 *           text/event-stream: {}
 */
router.get('/processamento/stream', requireAuth, streamProcessamentoStatus);

/**
 * @swagger
 * /api/configuracoes:
 *   get:
 *     summary: Configuracoes do sistema (intervalo de envio, URL da Evolution API, etc)
 *     tags: [Configuracoes]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Configuracao atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sucesso: { type: boolean }
 *                 config: { type: object }
 *   put:
 *     summary: Atualiza as configuracoes do sistema
 *     tags: [Configuracoes]
 *     security: [{ sessionCookie: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Configuracao atualizada
 */
router.route('/configuracoes').get(requireAuth, configuracoesController.obterConfiguracoes).put(requireAuth, configuracoesController.atualizarConfiguracoes);

/**
 * @swagger
 * /api/webhooks/evolution:
 *   post:
 *     summary: Webhook de status de entrega/leitura do WhatsApp (Evolution API)
 *     description: |
 *       NAO passa por requireAuth - a Evolution API nao loga via IdP. Autentica via
 *       `?token=EVOLUTION_WEBHOOK_TOKEN` na query string (validado internamente); se a env var
 *       nao estiver configurada, aceita qualquer requisicao (ambiente local/dev).
 *       Sempre responde 200, mesmo em erro interno, pra Evolution API nao ficar reenviando.
 *     tags: [Webhooks]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event: { type: string, example: "messages.update" }
 *               data: { type: object }
 *     responses:
 *       200:
 *         description: Sempre 200 (ver descricao)
 *       401:
 *         description: Token invalido (so quando EVOLUTION_WEBHOOK_TOKEN esta configurado)
 */
router.post('/webhooks/evolution', receberWebhook);

/**
 * @swagger
 * /api/wk/status:
 *   get:
 *     summary: Status da ultima sincronizacao com o WK Radar (ERP)
 *     tags: [Integracao WK]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Ultima sincronizacao, historico e contagem de funcionarios por status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ultimaSincronizacao: { type: object, nullable: true }
 *                 historico: { type: array, items: { type: object }, description: "ultimos 10 registros" }
 *                 funcionarios: { type: object }
 */
router.get('/wk/status', requireAuth, getWkStatus);

/**
 * @swagger
 * /api/agendamentos:
 *   get:
 *     summary: Lista agendamentos de lote (uploads com dataHoraEnvio futura)
 *     tags: [Agendamentos]
 *     security: [{ sessionCookie: [] }]
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { type: object } }
 */
router.get('/agendamentos', requireAuth, getAgendamentos);

/**
 * @swagger
 * /api/agendamentos/{id}/cancelar:
 *   post:
 *     summary: Cancela um agendamento pendente
 *     tags: [Agendamentos]
 *     security: [{ sessionCookie: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Agendamento cancelado
 *       400:
 *         description: id invalido, ou agendamento nao esta mais PENDENTE
 *       404:
 *         description: Agendamento nao encontrado
 */
router.post('/agendamentos/:id/cancelar', requireAuth, cancelarAgendamento);

module.exports = router;
