import { fileURLToPath } from 'url'
import globals from 'globals'
import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import solidPlugin from 'eslint-plugin-solid'
import tsEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  { ignores: ['node_modules', 'dist', 'build', '.solid', '.eslintrc.js'] },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    plugins: {
      solid: solidPlugin,
      '@typescript-eslint': tsEslint,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: {
          jsx: true,
        },
        // Remove the project config to avoid the parsing errors
        // since we're only looking for reactivity issues
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      'solid/reactivity': 'error',
      'solid/no-destructure': 'warn',
      'solid/jsx-no-undef': 'error',
      'solid/self-closing-comp': 'warn',
      'prefer-const': 'error',
    },
  },
  // Disable specific rules for test files
  {
    files: ['**/test/**', '**/*.test.{ts,tsx}'],
    rules: {
      'solid/reactivity': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  eslintConfigPrettier,
]
