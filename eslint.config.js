// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import solid from 'eslint-plugin-solid/configs/typescript'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'playwright-report',
      'test-results',
      'coverage',
      'storybook-static/**',
      'storybook-static-preview/**',
      'public/mockServiceWorker.js',
      'tests/e2e/**',
      'playwright.config.ts',
      'vitest.config.ts',
      'constants.node.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    ...solid,
    languageOptions: {
      ...solid.languageOptions,
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.*'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(text|bg|border|ring|accent)-(green|red|emerald|blue|amber|yellow|violet)-(50|100|200|300|400|500|600|700|800|900|950)\\b/]',
          message:
            'Use semantic theme tokens from src/styles/theme.css (e.g. text-positive, bg-success-muted) instead of raw Tailwind palette steps.',
        },
      ],
    },
  },
  storybook.configs['flat/recommended'],
  prettier,
)
