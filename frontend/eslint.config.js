import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import solidPlugin from 'eslint-plugin-solid';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  eslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
        HTMLCanvasElement: 'readonly',
        Event: 'readonly',
        confirm: 'readonly',
        Chart: 'readonly',
        console: 'readonly',
        global: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'solid': solidPlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'solid/components-return-once': 'error',
      'solid/no-destructure': 'error',
      'solid/jsx-no-undef': 'error',
      'solid/reactivity': 'error',
      'solid/no-react-specific-props': 'error',
      'solid/prefer-for': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'off'
    },
    settings: {
      'solid/typescript': true
    }
  },
  prettierConfig
];
