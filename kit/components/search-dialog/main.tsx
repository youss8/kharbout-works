import { createRoot } from 'react-dom/client';
import Example from './Example';

const root = document.getElementById('reading-list');
if (!root) throw new Error('Missing reading list container');

createRoot(root).render(<Example ownsShortcut />);
