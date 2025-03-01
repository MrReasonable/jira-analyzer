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
      parserOptions: {
        project: true,
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
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/prefer-web-first-assertions': 'warn',
    },
  }
)
