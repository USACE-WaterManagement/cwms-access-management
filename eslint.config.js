import _import from 'eslint-plugin-import';
import nx from '@nx/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';
import js from '@eslint/js';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default [
  {
    ignores: ['**/postcss.config.js', '**/tailwind.config.js'],
  },
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    plugins: {
      import: _import,
      '@nx': nx,
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: {
        globalThis: 'readonly',
      },
    },
  },
  {
    files: ['**/*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        projectService: true
      },
    },
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
        },
      ],
      'newline-before-return': 'off',
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
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
