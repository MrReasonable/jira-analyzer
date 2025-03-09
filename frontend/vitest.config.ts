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
      reportsDirectory: './coverage',
      // Continue despite test failures so we still get coverage reports
      all: true,
      // Exclude test files and non-testable files from coverage
      exclude: [
        // Project files that don't need testing
        '**/node_modules/**',
        '**/test/**',
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        '**/tailwind.config.cjs',
        '**/vite-env.d.ts',
        // Config files
        '**/eslint.config.js',
        '**/vite.config.ts',
        '**/vitest.config.ts',
        '**/tsconfig*.json',
        // Type definition files
        '**/types/workflow.ts',
        // API files - these are mocked in tests
        '**/api/jiraApi.ts'
      ]
    },
    // Don't fail the run even if tests fail
    passWithNoTests: true,
    allowOnly: true
  },
});
