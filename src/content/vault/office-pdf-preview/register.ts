import type AlpineRuntime from 'alpinejs';
import createViewer from './model';

// Livewire supplies Alpine before requesting this Vite entry.
declare const Alpine: typeof AlpineRuntime;
Alpine.data('privateOfficePreview', createViewer);
