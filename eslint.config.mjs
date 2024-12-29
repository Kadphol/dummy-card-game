import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import prettier from 'eslint-plugin-prettier'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})
export const eslintConfig = [
  {
    ignores: [
      '**/next-env.d.ts',
      'node_modules',
      '.pnp',
      '**/.pnp.js',
      'coverage',
      'build',
      '**/.DS_Store',
      '**/.env.local',
      '**/.env.development.local',
      '**/.env.test.local',
      '**/.env.production.local',
      '**/serviceWorker.js',
      '**/deploy',
      '**/public',
      '**/build',
      '**/posts',
      '**/node_modules',
      '**/.next',
      '**/.idea',
      '**/public',
      '**/dist',
      '**/storybooks',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-require-imports': 'off',
    },
    plugins: {
      prettier,
      typescriptEslint,
    },
  },
  ...compat.extends('plugin:testing-library/react', 'plugin:jest-dom/recommended').map((config) => ({
    ...config,
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  })),
]
export default eslintConfig
