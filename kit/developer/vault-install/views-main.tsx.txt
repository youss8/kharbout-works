import { createRoot } from 'react-dom/client';
import Example from './kharbout/content/vault/saved-views-sticky-filters/Example';
import './host.css';
import './kharbout/styles/vault-preview.css';
import './kharbout/content/vault/saved-views-sticky-filters/style.css';

const root = document.querySelector('#root');
if (root) {
    createRoot(root).render(
        <>
            <h1>Role-scoped saved views</h1>
            <p>Save a filter as Regional HR, then switch to Employee to check its scope.</p>
            <div className="example vault-preview">
                <Example />
            </div>
        </>,
    );
}
