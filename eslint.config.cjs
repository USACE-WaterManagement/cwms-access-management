// @ts-check
const _import = require('eslint-plugin-import');
const nx = require('@nx/eslint-plugin');
const prettierRecommended = require('eslint-config-prettier');
const nxTypescript = require('@nx/eslint-plugin/typescript');
const prettierPlugin = require('eslint-plugin-prettier');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    plugins: {
      import: _import,
      '@nx': nx,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true
      },
      globals: {
        globalThis: 'readonly',
      },
    },
  },
  {
    files: ['**/*.config.cjs'],
    extends: ['eslint:recommended'],
    env: {
      node: true,
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      camelcase: 'off',
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal', 'parent', 'sibling', 'index', 'object'],
          ],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
          ],
          'newlines-between': 'always',
          // caseInsensitive: true,
        },
      ],
      'newline-before-return': 'error',
      'no-constant-binary-expression': 'error',
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreMemberSort: false,
          ignoreDeclarationSort: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
          'ts-check': 'allow-with-description',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-useless-empty-export': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off', // Add this line
    },
  },
];
