// src/config/backend.js
// OS 08-B: origens absolutas do backend e do próprio frontend, usadas apenas para
// montar as URLs de /auth/login e /auth/logout (que rodam no backend, fora do proxy
// do Vite) e o returnTo de volta pro painel. Ambiente de teste local apenas -
// apontar para a rede real da empresa é uma OS futura.
// Porta 3001 (não 3000) — o IdP ocupa a 3000 nesta máquina de teste, ver env-example.
export const BACKEND_URL = 'http://localhost:3001';
export const FRONTEND_URL = 'http://localhost:5173';
