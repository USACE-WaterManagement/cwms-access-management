const base = require('../../eslint.config.cjs');

module.exports = [
  ...base,
  {
    files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
    rules: {},
  },
  {
    files: ['*.ts', '*.tsx'],
    rules: {},
  },
  {
    files: ['*.js', '*.jsx'],
    rules: {},
  },
  {
    files: ['*.json'],
    parser: 'jsonc-eslint-parser',
    rules: {
      '@nx/dependency-checks': 'error',
    },
  },
];
