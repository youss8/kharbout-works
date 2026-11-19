import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

export default function CatalogueShell({
    children,
    home = false,
}: {
    children: ReactNode;
    home?: boolean;
}) {
    return (
        <>
            <a className="skip-link" href="#main-content">
                Skip to content
            </a>
            <header className="site-header">
                <div className="shell masthead">
                    <Link href="/" className="brand" aria-label="Youssef’s Operations Kit home">
                        <span className="brand-mark" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                        </span>
                        <span>Youssef’s Operations Kit</span>
                    </Link>
                    <nav aria-label="Main navigation">
                        <Link href="/" aria-current={home ? 'page' : undefined}>
                            Catalogue
                        </Link>
                        <a href="https://github.com/youss8/youssef-operations-kit">
                            GitHub <span aria-hidden="true">↗</span>
                        </a>
                    </nav>
                </div>
            </header>
            <main id="main-content" className="shell main-content" tabIndex={-1}>
                {children}
            </main>
            <footer className="shell site-footer">
                <span>Youssef’s Operations Kit</span>
                <a href="https://github.com/youss8/youssef-operations-kit/blob/main/LICENSE">
                    MIT License <span aria-hidden="true">↗</span>
                </a>
            </footer>
        </>
    );
}

export function ShortcutPreview() {
    return (
        <figure
            className="shortcut-preview"
            aria-label="Preview of a command with a keyboard shortcut"
        >
            <div className="command">
                <span>Open search</span>
                <span className="keys">
                    <kbd>Ctrl</kbd>
                    <span>+</span>
                    <kbd>K</kbd>
                </span>
            </div>
        </figure>
    );
}
