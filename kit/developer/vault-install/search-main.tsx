import { createRoot } from 'react-dom/client';
import Example from './kharbout/kits/search-dialog/Example';
import './host.css';

const root = document.querySelector('#root');
if (root) {
    createRoot(root).render(
        <>
            <h1>Keyboard search dialog</h1>
            <p>Open the dialog and search for harbour. Press Enter to select the result.</p>
            <div className="example">
                <Example ownsShortcut />
            </div>
        </>,
    );
}
