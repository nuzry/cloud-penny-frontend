import { mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Reuses vite.config.ts (plugins, the @ alias) instead of duplicating it —
// the dev server's /api proxy block is irrelevant to tests and harmless to
// carry along unused.
export default mergeConfig(
  viteConfig,
  defineVitestConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
    },
  })
);
