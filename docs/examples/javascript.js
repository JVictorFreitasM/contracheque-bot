// docs/examples/javascript.js - Exemplos com Fetch API (chamado do frontend, com cookie de sessao)

const API_BASE = 'http://localhost:3001/api';

// Todas as chamadas usam credentials: 'include' - a sessao e por cookie
// (connect.sid), nao por Authorization header. O login (GET /auth/login)
// precisa acontecer via navegacao real do navegador, nao via fetch.

async function getMe() {
  const res = await fetch(`${API_BASE}/me`, { credentials: 'include' });
  if (res.status === 302 || res.redirected) {
    throw new Error('Sem sessao - redirecionado pro login');
  }
  return res.json();
}

async function getIndicadores() {
  const res = await fetch(`${API_BASE}/dashboard/indicadores`, { credentials: 'include' });
  return res.json();
}

async function uploadContracheques(files) {
  const formData = new FormData();
  for (const file of files) formData.append('files', file);

  const res = await fetch(`${API_BASE}/uploads`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  return res.json();
}

async function listarPendentes(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/pendentes?page=${page}&limit=${limit}`, { credentials: 'include' });
  return res.json();
}

// Server-Sent Events - status de processamento em tempo real
function acompanharProcessamento(onUpdate) {
  const source = new EventSource(`${API_BASE}/processamento/stream`, { withCredentials: true });
  source.onmessage = (event) => onUpdate(JSON.parse(event.data));
  return () => source.close(); // chamar pra encerrar o stream
}

// Uso
(async () => {
  try {
    const me = await getMe();
    console.log('Usuario:', me.user);

    const indicadores = await getIndicadores();
    console.log('Indicadores:', indicadores);
  } catch (error) {
    console.error('Erro:', error.message);
  }
})();
