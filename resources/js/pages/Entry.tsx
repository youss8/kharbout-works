import { Head, Link } from '@inertiajs/react';
import type { CatalogueEntry } from '../catalogue';
import CatalogueShell from '../components/CatalogueShell';
import KitRecipe from '../components/KitRecipe';
import { categoryLabel, localizeEntry, useLocale } from '../i18n';

export default function Entry({ entry: original }: { entry: CatalogueEntry }) {
    const { locale, t } = useLocale();
    const entry = localizeEntry(original, locale);
    return (
        <CatalogueShell>
            <Head title={entry.title} />
            <Link className="back-link" href="/">
                {t('← Back to catalogue', '← Zum Katalog', '→ العودة إلى الفهرس')}
            </Link>
            <header className="entry-intro">
                <p className="metadata">{categoryLabel(entry.category, locale)}</p>
                <h1>{entry.title}</h1>
                <p>{entry.summary}</p>
                <a className="entry-download" href={entry.downloadHref} download>
                    <span aria-hidden="true">↓</span>
                    {t(
                        'Download source (.zip)',
                        'Quellcode herunterladen (.zip)',
                        'تنزيل المصدر (.zip)',
                    )}
                </a>
            </header>
            <KitRecipe slug={entry.slug} />
        </CatalogueShell>
    );
}
