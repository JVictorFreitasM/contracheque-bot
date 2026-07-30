// src/components/AuthGate.jsx
import { useEffect, useState } from 'react';
import { getMe, loginUrl } from '../services/auth';

// OS 08-B: gate de autenticação do painel. Consulta GET /api/me uma vez ao montar;
// se não autenticado, manda o navegador (navegação completa, não fetch) pro
// /auth/login do backend. Não lida com token nenhum aqui - fica tudo no cookie
// httpOnly gerido pelo backend.
export default function AuthGate({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let ativo = true;

    getMe().then((result) => {
      if (!ativo) return;

      if (!result.authenticated) {
        window.location.href = loginUrl();
        return;
      }

      setUser(result.user);
      setStatus('authenticated');
    });

    return () => {
      ativo = false;
    };
  }, []);

  if (status !== 'authenticated') {
    return null;
  }

  return children(user);
}
