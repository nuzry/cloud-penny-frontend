import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirrors tsconfig.app.json's "paths" — keep both in sync.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // Mirrors the CloudFront /api/* behavior locally so the browser sees
      // the API as same-origin here too — otherwise local dev would be
      // testing a different (cross-site) cookie code path than production.
      '/api': {
        target: 'https://d9olex4f3k.execute-api.ap-southeast-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => `/dev${path}`,
      },
    },
  },
})
