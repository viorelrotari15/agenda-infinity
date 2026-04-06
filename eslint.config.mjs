import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/prisma/migrations/**',
      'apps/app/android/**',
      'apps/app/ios/**',
      'apps-mobile/**',
      'mobile/**',
      'e2e/**',
      'playwright.config.ts',
      '**/vitest.config.ts',
      'apps/api/jest.config.cjs',
      'perf/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/app/**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        jsxPragma: null,
      },
      globals: { ...globals.browser },
    },
    rules: {
      ...react.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.recommended.rules,
      // Legitimate patterns (reset on prop change, syncing derived UI state) still use setState in effects.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/incompatible-library': 'warn',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['apps/app/src/main.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['packages/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['apps/api/**/*.spec.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
  {
    files: ['packages/**/*.test.ts', 'apps/app/src/**/*.{test,spec}.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest },
    },
  },
  eslintConfigPrettier,
);
