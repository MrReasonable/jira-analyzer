import { defineConfig } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';
import { resolve } from 'path';

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@pages': resolve(__dirname, './src/pages'),
      '@utils': resolve(__dirname, './src/utils'),
      '@api': resolve(__dirname, './src/api'),
      '@test': resolve(__dirname, './test'),
      '@mocks': resolve(__dirname, './test/mocks'),
      '@types': resolve(__dirname, './src/types'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    deps: {
      optimizer: {
        web: {
          include: ['solid-js']
        }
      }
    },
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage'
    }
  },
});
