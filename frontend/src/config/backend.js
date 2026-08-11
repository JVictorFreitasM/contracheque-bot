// src/config/backend.js
// OS 15-A (item 2.3): origens absolutas do backend e do próprio frontend, usadas
// apenas para montar as URLs de /auth/login e /auth/logout (que rodam no backend,
// fora do proxy do Vite) e o returnTo de volta pro painel. Lidas de VITE_BACKEND_URL/
// VITE_FRONTEND_URL (definidas em frontend/.env), com fallback para localhost em dev.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173';
// OS 17: menu central do IdP (OS 13) - destino do botão "Voltar aos sistemas".
export const IDP_HOME_URL = import.meta.env.VITE_IDP_HOME_URL || 'http://localhost:3000/home';
