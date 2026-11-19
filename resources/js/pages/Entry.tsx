import { Head, Link } from '@inertiajs/react';
import { shortcutEntry } from '../catalogue';
import CatalogueShell, { ShortcutPreview } from '../components/CatalogueShell';

const markup = `<span class="command">
  <span>Open search</span>
  <span class="keys"><kbd>Ctrl</kbd> + <kbd>K</kbd></span>
</span>`;

const styles = `.command {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.keys { white-space: nowrap; }

kbd {
  display: inline-block;
  padding: .2em .45em;
  border: 1px solid currentColor;
  border-block-end-width: 2px;
  border-radius: .25em;
  font: inherit;
}`;

export default function Entry() {
    return (
        <CatalogueShell>
            <Head title={shortcutEntry.title} />
            <Link className="back-link" href="/">
                ← Back to catalogue
            </Link>
            <header className="entry-intro">
                <p className="metadata">Components</p>
                <h1>{shortcutEntry.title}</h1>
                <p>{shortcutEntry.summary}</p>
            </header>
            <div className="entry-content">
                <section className="entry-section" aria-labelledby="preview-title">
                    <h2 id="preview-title">Preview</h2>
                    <ShortcutPreview />
                </section>
                <aside className="entry-facts" aria-label="Entry details">
                    <h2>Requirements</h2>
                    <p>HTML and CSS. Works in an existing page without a JavaScript dependency.</p>
                    <h2>Quick check</h2>
                    <p>
                        At a narrow width, the keys stay together as the label wraps. Verify that
                        the displayed combination runs the intended command in your project.
                    </p>
                </aside>
                <section className="entry-section entry-recipe" aria-labelledby="use-title">
                    <h2 id="use-title">Use it in your project</h2>
                    <p>
                        Place the label beside the command it describes. Change the text and keys to
                        match a shortcut your application already handles.
                    </p>
                    <h3>HTML</h3>
                    <pre tabIndex={0} aria-label="HTML example">
                        <code>{markup}</code>
                    </pre>
                    <h3>CSS</h3>
                    <pre tabIndex={0} aria-label="CSS example">
                        <code>{styles}</code>
                    </pre>
                </section>
            </div>
        </CatalogueShell>
    );
}
