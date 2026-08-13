// src/swagger.js - documentacao de API (Swagger UI + ReDoc)
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Contracheque Bot API',
      version: '1.0.0',
      description:
        'Automacao de envio de contracheques por WhatsApp (upload de PDF/XLSX/CSV, fila BullMQ, ' +
        'confirmacao de entrega via Evolution API). Autenticacao via IdP centralizado (OAuth2 + JWT).',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Desenvolvimento local (docker-compose)' }],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description:
            'Sessao local deste backend, criada em /auth/callback apos o fluxo OAuth2 com o IdP ' +
            '(idp-client). Guarda o access_token/refresh_token do IdP no servidor (Redis) - nunca no navegador.',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          description: 'Formato de erro deste backend - sempre `{ error: string }`, nunca code/details/timestamp.',
          properties: { error: { type: 'string', example: 'Falha ao obter métricas' } },
        },
        Paginated: {
          type: 'object',
          description: 'Formato comum de listagem paginada usado por varios endpoints deste backend.',
          properties: {
            data: { type: 'array', items: {} },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 137 },
            totalPages: { type: 'integer', example: 7 },
          },
        },
      },
    },
    security: [{ sessionCookie: [] }],
  },
  apis: ['./src/routes/**/*.js', './src/app.js'],
};

const specs = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      swaggerOptions: { persistAuthorization: true, filter: true, docExpansion: 'list' },
      customSiteTitle: 'Contracheque Bot - API Docs',
    })
  );

  app.get('/api-docs.json', (_req, res) => {
    res.json(specs);
  });

  app.get('/redoc', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Contracheque Bot - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body>
  <redoc spec-url="/api-docs.json"></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`);
  });
}

module.exports = { setupSwagger, specs };
