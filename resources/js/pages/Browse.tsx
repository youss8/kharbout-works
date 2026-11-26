import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { readFilters, writeFilters } from '../../../kit/utilities/url-filters/filters';
import { siteName } from '../../../src/data/brand';
import { carryCatalogueFilters } from '../catalogue';
import type { CatalogueEntry } from '../catalogue';
import { categoryLabel, useLocale } from '../i18n';
import { searchEntries } from '../searchEntries';
import type { Locale } from '../i18n';
import CatalogueShell from '../components/CatalogueShell';
import VaultDrawer from '../components/VaultDrawer';
import VaultSection from '../components/VaultSection';
import type { Workflow } from '../vault';
import '../../css/browse.css';

const categories = [
    { name: 'Components', slug: 'components' },
    { name: 'Pages', slug: 'pages' },
    { name: 'Utilities', slug: 'utilities' },
    { name: 'Modules', slug: 'modules' },
    { name: 'AI tools', slug: 'ai-tools' },
] as const;
const emptyValues: Record<string, string> = {};

function entryCount(count: number, locale: Locale) {
    const n = new Intl.NumberFormat(locale).format(count);
    if (locale === 'de') return count === 1 ? '1 Eintrag' : `${n} Einträge`;
    if (locale === 'en') return count === 1 ? '1 entry' : `${n} entries`;
    switch (new Intl.PluralRules('ar').select(count)) {
        case 'zero':
            return 'لا توجد عناصر';
        case 'one':
            return 'عنصر واحد';
        case 'two':
            return 'عنصران';
        case 'few':
            return `${n} عناصر`;
        case 'many':
            return `${n} عنصرًا`;
        default:
            return `${n} عنصر`;
    }
}

function EntryPreview({ entry }: { entry: CatalogueEntry }) {
    const { locale, t } = useLocale();
    switch (entry.slug) {
        case 'search-dialog':
            return (
                <span className="card-search">
                    <b>{t('Search…', 'Suchen…', 'ابحث…')}</b>
                    <i />
                    <i />
                </span>
            );
        case 'keyboard-shortcut-label':
            return (
                <span className="card-keys" dir="ltr">
                    <kbd>{t('Ctrl', 'Strg', 'Ctrl')}</kbd>
                    <span>+</span>
                    <kbd>K</kbd>
                </span>
            );
        case 'copy-code':
            return (
                <span className="card-copy">
                    <i />
                    <i />
                    <span>{t('Copy', 'Kopieren', 'نسخ')}</span>
                </span>
            );
        case 'empty-state-page':
            return (
                <span className="card-page">
                    <i />
                    <b>∅</b>
                    <i />
                </span>
            );
        case 'url-filters':
            return (
                <span className="card-filter" dir="ltr">
                    ?q=url
                    <br />
                    <b>&amp;category=utilities</b>
                </span>
            );
        case 'catalogue-search':
            return (
                <span className="card-search" dir="ltr">
                    <b>200</b> OK
                    <i />
                    <i />
                </span>
            );
        case 'accessible-ui-review':
            return (
                <span className="card-review">
                    <b>✓</b> {t('Focus order', 'Fokusreihenfolge', 'ترتيب التركيز')}
                    <i />
                    <b>✓</b> {t('Contrast', 'Kontrast', 'التباين')}
                </span>
            );
        default:
            return <span className="card-fallback">{categoryLabel(entry.category, locale)}</span>;
    }
}

export default function Browse({
    entries,
    workflows,
}: {
    entries: CatalogueEntry[];
    workflows: Workflow[];
}) {
    const { locale, t } = useLocale();
    const [inspection, setInspection] = useState<{
        workflow: Workflow;
        returnFocus: HTMLElement | null;
    } | null>(null);
    const [workflowValues, setWorkflowValues] = useState<Record<string, Record<string, string>>>(
        {},
    );
    const searchInput = useRef<HTMLInputElement>(null);
    const pageUrl = usePage().url;
    const url = new URL(pageUrl, window.location.origin);
    const { query, category } = readFilters(url);
    const activeCategory = categories.find((item) => item.slug === category);
    const matches = searchEntries(
        activeCategory
            ? entries.filter((entry) => entry.category === activeCategory.name)
            : entries,
        query,
        locale,
    );
    const numbers = new Intl.NumberFormat(locale);

    useEffect(() => {
        if (searchInput.current) searchInput.current.value = query;
    }, [query]);

    function filterUrl(search: string, collection: string) {
        const next = writeFilters(url, { query: search, category: collection });
        return next.pathname + next.search + window.location.hash;
    }

    function changeFilters(href: string) {
        router.push({ url: href, preserveScroll: true, preserveState: true });
    }

    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('q');
        changeFilters(
            filterUrl(typeof value === 'string' ? value : '', activeCategory?.slug ?? ''),
        );
    }

    function followFilter(event: MouseEvent<HTMLAnchorElement>, clear = false) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
            return;
        event.preventDefault();
        const { pathname, search } = event.currentTarget;
        changeFilters(pathname + search + window.location.hash);
        if (clear && searchInput.current) {
            searchInput.current.value = '';
            searchInput.current.focus({ preventScroll: true });
        }
    }

    function inspectWorkflow(workflow: Workflow, opener: HTMLElement | null = null) {
        const active = document.activeElement;
        const returnFocus = opener ?? (active instanceof HTMLElement ? active : null);
        setInspection({ workflow, returnFocus });
    }

    return (
        <CatalogueShell home vault={{ workflows, onInspect: inspectWorkflow }}>
            <Head title={t('Catalogue', 'Katalog', 'الفهرس')} />
            <section className="hero browse-hero" aria-labelledby="hero-title">
                <div className="hero-copy">
                    <h1 id="hero-title" lang="en" dir="ltr">
                        {siteName}
                    </h1>
                    <p>
                        {t(
                            'Browse reusable components, pages, workflows and AI tools. Preview an entry and take it into your own project.',
                            'Entdecke Komponenten, Seiten, Arbeitsabläufe und KI-Werkzeuge. Sieh dir die Vorschau an und übernimm passende Bausteine in dein Projekt.',
                            'تصفّح مكوّنات وصفحات ومسارات عمل وأدوات ذكاء اصطناعي قابلة لإعادة الاستخدام. عاين أي عنصر ثم استخدمه في مشروعك.',
                        )}
                    </p>
                    <a className="hero-link" href="#catalogue">
                        {t('Explore the catalogue', 'Katalog entdecken', 'استكشف الفهرس')}{' '}
                        <span aria-hidden="true">↓</span>
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

            <section id="catalogue" className="browse-directory" aria-labelledby="catalogue-title">
                <div className="browse-toolbar">
                    <h2 id="catalogue-title">{t('Catalogue', 'Katalog', 'الفهرس')}</h2>
                    <form
                        className="browse-search"
                        role="search"
                        aria-label={t('Catalogue', 'Katalog', 'الفهرس')}
                        onSubmit={search}
                    >
                        <label className="browse-sr-only" htmlFor="catalogue-search">
                            {t('Search catalogue', 'Katalog durchsuchen', 'ابحث في الفهرس')}
                        </label>
                        <input
                            ref={searchInput}
                            id="catalogue-search"
                            type="search"
                            name="q"
                            placeholder={t(
                                'Search entries or technologies',
                                'Einträge oder Technologien suchen',
                                'ابحث عن عناصر أو تقنيات',
                            )}
                            defaultValue={query}
                        />
                        <button type="submit">{t('Search', 'Suchen', 'بحث')}</button>
                    </form>
                </div>

                <nav
                    className="browse-categories"
                    aria-label={t(
                        'Filter by category',
                        'Nach Kategorie filtern',
                        'تصفية حسب الفئة',
                    )}
                >
                    <a
                        href={filterUrl(query, '')}
                        onClick={followFilter}
                        aria-current={!activeCategory ? 'true' : undefined}
                    >
                        {t('All entries', 'Alle Einträge', 'جميع العناصر')}{' '}
                        <span aria-hidden="true">{numbers.format(entries.length)}</span>
                    </a>
                    {categories.map((item) => (
                        <a
                            key={item.slug}
                            href={filterUrl(query, item.slug)}
                            onClick={followFilter}
                            aria-current={activeCategory?.slug === item.slug ? 'true' : undefined}
                        >
                            {categoryLabel(item.name, locale)}{' '}
                            <span aria-hidden="true">
                                {numbers.format(
                                    entries.filter((entry) => entry.category === item.name).length,
                                )}
                            </span>
                        </a>
                    ))}
                </nav>
                <div className="browse-summary">
                    <p role="status" aria-live="polite">
                        {entryCount(matches.length, locale)}
                    </p>
                    {(query || category) && (
                        <a href={filterUrl('', '')} onClick={(event) => followFilter(event, true)}>
                            {t('Clear filters', 'Filter zurücksetzen', 'إزالة المرشّحات')}
                        </a>
                    )}
                </div>
                {matches.length ? (
                    <ul className="browse-grid">
                        {matches.map((entry) => (
                            <li key={entry.slug}>
                                <article className="browse-card">
                                    <div
                                        className={`browse-preview preview-${entry.slug}`}
                                        aria-hidden="true"
                                    >
                                        <EntryPreview entry={entry} />
                                    </div>
                                    <div className="browse-card-body">
                                        <p className="metadata">
                                            {categoryLabel(entry.category, locale)}
                                        </p>
                                        <h3>
                                            <Link href={carryCatalogueFilters(entry.href, url)}>
                                                {entry.title}
                                            </Link>
                                        </h3>
                                        <p className="browse-card-summary">{entry.summary}</p>
                                        <ul
                                            className="browse-requirements"
                                            aria-label={t(
                                                'Requirements',
                                                'Voraussetzungen',
                                                'المتطلبات',
                                            )}
                                        >
                                            {entry.requirements.map((item) => (
                                                <li key={item}>
                                                    <bdi>{item}</bdi>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </article>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="browse-empty">
                        <h3>
                            {t(
                                'No matching entries',
                                'Keine passenden Einträge',
                                'لا توجد عناصر مطابقة',
                            )}
                        </h3>
                        <p>
                            {t(
                                'Try another search term or choose a different collection.',
                                'Versuche einen anderen Suchbegriff oder wähle eine andere Kategorie.',
                                'جرّب عبارة بحث أخرى أو اختر فئة مختلفة.',
                            )}
                        </p>
                    </div>
                )}
            </section>
            <VaultSection workflows={workflows} onInspect={inspectWorkflow} />
            {inspection && (
                <VaultDrawer
                    key={inspection.workflow.id}
                    workflow={inspection.workflow}
                    values={workflowValues[inspection.workflow.id] ?? emptyValues}
                    onValuesChange={(values) =>
                        setWorkflowValues((current) => ({
                            ...current,
                            [inspection.workflow.id]: values,
                        }))
                    }
                    returnFocus={inspection.returnFocus}
                    onClose={() => setInspection(null)}
                />
            )}
        </CatalogueShell>
    );
}
