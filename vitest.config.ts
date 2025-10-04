import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      ...configDefaults.exclude,
      '**/tests/e2e/**',  // Exclude Playwright E2E tests
      '**/*.spec.ts',     // Exclude all .spec.ts files (Playwright convention)
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
