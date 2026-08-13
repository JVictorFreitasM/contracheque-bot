// Exporta a spec OpenAPI pra docs/openapi.json sem precisar subir o backend
// inteiro (sem Postgres, Redis, SESSION_SECRET) - so le os comentarios
// @swagger dos arquivos de rota/app.js. Usado no CI (.github/workflows/deploy-docs.yml)
// e localmente via `npm run docs:export`.
const fs = require('fs');
const path = require('path');
const { specs } = require('../src/swagger');

const outDir = path.join(__dirname, '..', 'docs');
const outFile = path.join(outDir, 'openapi.json');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(specs, null, 2));

console.log(`OpenAPI spec exportado para ${outFile}`);
