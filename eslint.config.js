import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import astro from 'eslint-plugin-astro';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    // Vault kits are separately published source snapshots with their own reuse checks.
    { ignores: ['src/content/**'] },
    ...astro.configs.recommended,
    {
        files: ['src/**/*.astro'],
        languageOptions: { parserOptions: { parser: tseslint.parser } },
    },
    {
        files: ['src/**/*.{js,mjs}'],
        extends: [js.configs.recommended],
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
    },
    {
        files: [
            'resources/js/**/*.{ts,tsx}',
            'src/**/*.{ts,tsx}',
            'kit/**/*.{ts,tsx}',
            'tests/browser/**/*.ts',
            '*.config.ts',
        ],
        extends: [js.configs.recommended, tseslint.configs.recommended],
        rules: { '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }] },
    },
    {
        files: ['resources/js/**/*.{ts,tsx}', 'kit/**/*.tsx', 'src/**/*.tsx'],
        extends: [hooks.configs.flat.recommended],
        languageOptions: { globals: globals.browser },
    },
]);
