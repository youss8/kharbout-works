import { createInertiaApp } from '@inertiajs/react';
import '../css/app.css';

void createInertiaApp({
    pages: './pages',
    strictMode: true,
    title: (title) => (title ? `${title} · Youssef's Operations Kit` : "Youssef's Operations Kit"),
});
