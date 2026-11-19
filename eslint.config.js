import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        files: [
            'resources/js/**/*.{ts,tsx}',
            'kit/**/*.ts',
            'tests/browser/**/*.ts',
            '*.config.ts',
        ],
        extends: [js.configs.recommended, tseslint.configs.recommended],
    },
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        extends: [hooks.configs.flat.recommended],
        languageOptions: { globals: globals.browser },
    },
]);
