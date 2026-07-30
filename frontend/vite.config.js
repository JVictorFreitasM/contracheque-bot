import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // OS 08-B: ambiente de teste local, backend rodando via `npm start` direto no
      // host (não containerizado) em PORT=3001 (ver env-example — 3001, não 3000,
      // porque o IdP ocupa a 3000 nesta máquina) - fora do escopo desta OS apontar
      // isso para a rede real da empresa.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});