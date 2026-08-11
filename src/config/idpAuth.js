// src/config/idpAuth.js
// Integração com o IdP centralizado (OS 08-B). Instanciado uma única vez aqui e
// reutilizado em app.js (router de /auth/*, Bull Board) e apiRoutes.js (requireAuth
// rota a rota).
const { createIdpAuth, requireRole } = require('@copperline/idp-client');

// postLoginRedirect aponta pro FRONTEND_URL (Vite), não pro default da lib ("/"),
// porque o callback roda no backend (porta do IDP_REDIRECT_URI) - um redirect
// relativo cairia no fallback estático do backend, não no Vite dev server.
const homeUrl = process.env.IDP_HOME_URL || 'http://localhost:3000/home';
const idpAuth = createIdpAuth({
  idpUrl: process.env.IDP_URL,
  // Só necessário quando o backend roda containerizado falando com o IdP via
  // host.docker.internal (server-to-server), mas o navegador do usuário (no
  // host) precisa de localhost pro redirect de /auth/login - ver env-example.
  // Sem IDP_AUTHORIZE_URL definido, a lib usa o próprio IDP_URL (comportamento
  // padrão quando tudo roda na mesma máquina/rede, sem Docker).
  authorizeUrl: process.env.IDP_AUTHORIZE_URL || undefined,
  // OS 17: menu central do IdP, pro botao "Voltar aos sistemas" nas telas de erro.
  homeUrl,
  clientId: process.env.IDP_CLIENT_ID,
  clientSecret: process.env.IDP_CLIENT_SECRET,
  redirectUri: process.env.IDP_REDIRECT_URI,
  postLoginRedirect: process.env.FRONTEND_URL,
  // OS 17: pós-logout manda pro menu central do IdP, não de volta pra este
  // sistema - senão o /auth/login automático da AuthGate reabre exatamente o
  // sistema de onde o usuário acabou de sair, sem nunca mostrar o menu.
  // IMPORTANTE: precisa estar cadastrado em postLogoutRedirectUris deste
  // sistema no painel do IdP, senão o /session/end recusa o redirect.
  postLogoutRedirect: homeUrl,
});

module.exports = { idpAuth, requireRole };
