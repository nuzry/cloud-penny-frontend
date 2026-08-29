import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
