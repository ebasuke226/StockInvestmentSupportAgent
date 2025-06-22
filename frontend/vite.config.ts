import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // ← これで 0.0.0.0（全インターフェース）で待ち受ける
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',  // Docker Compose のサービス名
        changeOrigin: true,
      }
    }
  }
});
