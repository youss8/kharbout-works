import { Head, Link } from '@inertiajs/react';
import { collections, shortcutEntry } from '../catalogue';
import CatalogueShell, { ShortcutPreview } from '../components/CatalogueShell';

export default function Browse() {
    return (
        <CatalogueShell home>
            <Head title="Catalogue" />
            <section className="hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                    <h1 id="hero-title">
                        Youssef’s
                        <br />
                        Operations Kit
                    </h1>
                    <p>
                        A collection of components, pages, workflows and AI tools to adapt for your
                        own projects.
                    </p>
                    <a className="hero-link" href="#collections">
                        Explore the catalogue <span aria-hidden="true">↓</span>
                    </a>
                </div>
                <div className="hero-art" aria-hidden="true">
                    <div className="sheet sheet-bottom">
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className="sheet sheet-middle">
                        <i />
                        <i />
                        <i />
                    </div>
                    <div className="sheet sheet-top">
                        <span className="paper-code">{'{ }'}</span>
                        <i />
                        <i />
                    </div>
                </div>
            </section>

            <section id="collections" className="section" aria-labelledby="collections-title">
                <h2 id="collections-title">Collections</h2>
                <ul className="collections">
                    {collections.map((collection) => (
                        <li key={collection.name}>
                            <span aria-hidden="true" className="collection-symbol">
                                {collection.glyph}
                            </span>
                            <h3>
                                {collection.name === 'Components' ? (
                                    <a href="#entries">
                                        {collection.name} <span aria-hidden="true">↘</span>
                                    </a>
                                ) : (
                                    collection.name
                                )}
                            </h3>
                            <p>{collection.description}</p>
                        </li>
                    ))}
                </ul>
            </section>

            <section id="entries" className="section" aria-labelledby="entries-title">
                <div className="section-heading">
                    <h2 id="entries-title">Catalogue entries</h2>
                    <span>1 entry</span>
                </div>
                <article className="entry-card">
                    <ShortcutPreview />
                    <div className="card-description">
                        <p className="metadata">
                            Components <span> / </span> HTML + CSS
                        </p>
                        <h3>
                            <Link href={shortcutEntry.href}>{shortcutEntry.title}</Link>
                        </h3>
                        <p>{shortcutEntry.summary}</p>
                        <Link className="entry-link" href={shortcutEntry.href}>
                            View entry <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                </article>
            </section>
        </CatalogueShell>
    );
}
