import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// OS 15-A (item 2.3): alvo do proxy lido de VITE_BACKEND_URL (frontend/.env), sem
// valor fixo no arquivo. Fallback para localhost:3001 cobre dev sem .env configurado.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:3001';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
