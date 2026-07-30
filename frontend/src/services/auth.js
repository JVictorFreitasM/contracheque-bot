// src/services/auth.js
// OS 08-B: checagem de sessão com o IdP. requireAuth (na lib do backend) nunca
// devolve 401 - em caso de sessão ausente/expirada ele redireciona (302) pro
// /auth/login. Um fetch normal seguiria esse redirect até o IdP (outra origem) e
// quebraria por CORS. `redirect: 'manual'` faz o fetch parar no primeiro redirect
// (response.type === 'opaqueredirect'), o que usamos aqui como sinal de "não logado".
import { BACKEND_URL } from '../config/backend';

export async function getMe() {
  try {
    const response = await fetch('/api/me', {
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    });

    if (response.type === 'opaqueredirect' || response.status === 0) {
      return { authenticated: false };
    }

    if (!response.ok) {
      return { authenticated: false };
    }

    const data = await response.json();
    return { authenticated: true, user: data.user };
  } catch (error) {
    console.error('[auth] Erro ao consultar /api/me:', error);
    return { authenticated: false };
  }
}

export function loginUrl() {
  const returnTo = window.location.href;
  return `${BACKEND_URL}/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function logoutUrl() {
  return `${BACKEND_URL}/auth/logout`;
}
