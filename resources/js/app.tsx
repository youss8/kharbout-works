import { createInertiaApp } from '@inertiajs/react';
import { siteName } from '../../src/data/brand';
import { LocaleProvider } from './i18n';
import '../css/app.css';
import '../css/locale.css';

void createInertiaApp({
    pages: './pages',
    strictMode: true,
    withApp: (app) => <LocaleProvider>{app}</LocaleProvider>,
    title: (title) => (title ? `${title} · ${siteName}` : siteName),
});
