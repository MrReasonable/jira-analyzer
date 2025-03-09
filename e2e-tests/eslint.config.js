// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import playwrightPlugin from 'eslint-plugin-playwright'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  playwrightPlugin.configs['flat/recommended'],
  prettierConfig,
  {
    ignores: ['node_modules', 'playwright-report', 'test-results', 'dist'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Custom rules
      'no-console': 'off', // Allow console statements in e2e tests for logging
      'no-unused-vars': 'off', // TypeScript handles this
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // In E2E tests, we sometimes need conditionals and waiting
      'playwright/no-conditional-in-test': 'off', // Disabled - needed for E2E test workflow
      'playwright/no-conditional-expect': 'off', // Disabled - needed for handling different UI states
      'playwright/no-skipped-test': 'warn', // Warn about skipped tests
      'playwright/no-wait-for-timeout': 'off', // Disabled - sometimes needed for stabilizing tests
      'playwright/no-force-option': 'warn',
      'playwright/prefer-web-first-assertions': 'warn',
      'playwright/no-wait-for-selector': 'error', // Disallow waitForSelector
    },
  }
)
