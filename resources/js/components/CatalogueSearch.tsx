import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import SearchDialog from '../../../kit/components/search-dialog/SearchDialog';
import type { CatalogueEntry } from '../catalogue';
import { categoryLabel, useLocale } from '../i18n';
import { searchEntries } from '../searchEntries';

export default function CatalogueSearch() {
    const { entries } = usePage<{ entries: CatalogueEntry[] }>().props;
    const { locale, t } = useLocale();
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const title = t('Search catalogue', 'Katalog durchsuchen', 'ابحث في الفهرس');
    const apple =
        typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

    useEffect(() => {
        function shortcut(event: KeyboardEvent) {
            // An Arabic keyboard sends ن at the physical K position.
            const matchesK =
                event.key.toLowerCase() === 'k' ||
                (event.code === 'KeyK' && /^\p{Script=Arabic}$/u.test(event.key));
            if (
                event.defaultPrevented ||
                event.isComposing ||
                event.altKey ||
                event.shiftKey ||
                !(event.ctrlKey || event.metaKey) ||
                !matchesK
            )
                return;
            event.preventDefault();
            if (event.repeat || document.querySelector('dialog:modal')) return;
            if (document.activeElement === document.body) {
                trigger.current?.focus({ preventScroll: true });
            }
            setOpen(true);
        }
        document.addEventListener('keydown', shortcut);
        return () => document.removeEventListener('keydown', shortcut);
    }, []);

    return (
        <>
            <button
                className="catalogue-search-trigger"
                ref={trigger}
                type="button"
                aria-haspopup="dialog"
                aria-keyshortcuts="Control+k Meta+k"
                onClick={(event) => {
                    event.currentTarget.focus();
                    setOpen(true);
                }}
            >
                {title}
                <kbd dir="ltr" aria-hidden="true">
                    {apple ? '⌘ K' : t('Ctrl+K', 'Strg+K', 'Ctrl+K')}
                </kbd>
            </button>
            <SearchDialog
                open={open}
                onClose={() => setOpen(false)}
                search={(query) =>
                    searchEntries(entries, query, locale).map((entry) => ({
                        id: entry.href,
                        title: entry.title,
                        description: `${categoryLabel(entry.category, locale)} · ${entry.summary}`,
                    }))
                }
                onSelect={(result) => router.visit(result.id)}
                labels={{
                    title,
                    input: t('Search entries', 'Einträge suchen', 'ابحث عن عنصر'),
                    close: t('Close', 'Schließen', 'إغلاق'),
                    empty: t(
                        'No results. Try a different search.',
                        'Keine Treffer. Versuche einen anderen Suchbegriff.',
                        'لا توجد نتائج. جرّب عبارة بحث أخرى.',
                    ),
                }}
            />
        </>
    );
}
