import { createInertiaApp } from '@inertiajs/react';
import { LocaleProvider } from './i18n';
import '../css/app.css';
import '../css/locale.css';

void createInertiaApp({
    pages: './pages',
    strictMode: true,
    withApp: (app) => <LocaleProvider>{app}</LocaleProvider>,
    title: (title) => (title ? `${title} · Youssef's Operations Kit` : "Youssef's Operations Kit"),
});
