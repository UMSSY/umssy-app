import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';

export default defineConfig([
  tseslint.configs.base,
  globalIgnores([
    'dist/**',
    'coverage/**',
    'node_modules/**',
    'src/generated/**',
  ]),

  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.ts': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/**/!(__tests__)': 'KEBAB_CASE' },
      ],

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'classMethod', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
      ],
    },
  },

  {
    files: ['src/**/*.{exception,exceptions}.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ClassDeclaration:not([id.name=/Exception$/])',
          message:
            'Estándar 4.4: las clases de excepción deben terminar con el sufijo Exception.',
        },
      ],
    },
  },

  {
    files: ['src/**/index.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            ':matches(FunctionDeclaration, FunctionExpression, ArrowFunctionExpression, VariableDeclaration, ClassDeclaration)',
          message:
            'Estándar 2.4: los archivos index solo pueden re-exportar. Incluir lógica está prohibido.',
        },
      ],
    },
  },
]);
