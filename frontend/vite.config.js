export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.0.200:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});