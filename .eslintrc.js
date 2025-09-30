module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    // TypeScript specific rules  
    '@typescript-eslint/no-unused-vars': 'error',
    
    // General JavaScript/TypeScript rules
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'off',
    'eqeqeq': 'error',
    'curly': 'error',
    'no-unused-vars': 'off', // Let TypeScript handle this
  },
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    'coverage/',
    'examples/',
  ],
  overrides: [
    {
      files: ['tests/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
      },
    },
  ],
};