const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

const envioContrachequeQueue = require('./queues/envioContrachequeQueue');
const processadorLote = require('./services/processadorLoteService');
const logger = require('./config/logger');
const apiRouter = require('./routes/apiRoutes');
const { idpAuth, requireRole } = require('./config/idpAuth');

const app = express();

// ==============================
// CORS (CORRIGIDO PARA REDE)
// ==============================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.0.200:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // permite tools como postman, curl, SSE, etc
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// garante preflight (IMPORTANTE)
app.options(/.*/, cors());

app.use(express.json());

// ==============================
// SESSÃO (OS 08-B)
// ==============================
// Sessão local do sistema cliente - guarda os tokens do IdP (req.session.idpAuth),
// nunca expostos ao front. MemoryStore (default) é suficiente para o piloto em
// localhost com um único processo; produção/multi-instância precisa de um store
// persistente (ex.: connect-redis, já que Redis já é dependência do projeto) - fora
// do escopo desta OS.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // OS 08-B seção 5: localhost sem HTTPS - `secure: false` vale só neste ambiente
    // de teste local. Ao migrar para a rede da empresa isso deve voltar a `true`.
    secure: false,
    sameSite: 'lax',
  },
}));

// ==============================
// IDP (OS 08-B)
// ==============================
// Monta GET /auth/login, /auth/callback, /auth/logout (paths já absolutos, não
// prefixar com '/auth' de novo aqui).
app.use(idpAuth.router);

// ==============================
// BULL BOARD
// ==============================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(envioContrachequeQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use('/admin/queues', idpAuth.requireAuth, requireRole('admin'), serverAdapter.getRouter());

// ==============================
// API ROUTES
// ==============================
app.use('/api', apiRouter);

// ==============================
// ROTA MANUAL DE LOTE
// ==============================
app.post('/api/processar-lote', idpAuth.requireAuth, async (req, res) => {
  logger.info('[API] Solicitação manual de processamento de lote recebida');

  try {
    processadorLote.processarPasta().catch(erro => {
      logger.error(`[API] Erro no processamento do lote: ${erro.message}`);
    });

    res.status(202).json({
      message: 'Processamento do lote iniciado com sucesso.'
    });

  } catch (error) {
    logger.error(`[API] Erro ao iniciar processamento: ${error.message}`);
    res.status(500).json({ error: 'Erro ao iniciar processamento.' });
  }
});

// ==============================
// FRONTEND BUILD (Nginx fallback)
// ==============================
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

app.use(express.static(frontendDist));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

module.exports = app;