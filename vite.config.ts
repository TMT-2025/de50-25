import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GEMINI_API_KEY không còn được đọc/nhúng ở đây: nó chỉ tồn tại phía server
// (Vercel Serverless Function tại /api/generate-exam.ts) để tránh lộ ra
// trình duyệt người dùng.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
