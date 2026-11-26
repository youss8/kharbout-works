import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import SearchDialog, { isSearchShortcut } from '../../../kit/components/search-dialog/SearchDialog';
import type { SearchResult } from '../../../kit/components/search-dialog/SearchDialog';
import { carryCatalogueFilters } from '../catalogue';
import type { CatalogueEntry } from '../catalogue';
import { categoryLabel, useLocale } from '../i18n';
import { searchEntries } from '../searchEntries';
import { searchWorkflows, workflowPlatformLabel, workflowStatusLabel } from '../vault';
import type { Workflow } from '../vault';

export type VaultSearch = {
    workflows: Workflow[];
    onInspect: (workflow: Workflow, returnFocus: HTMLElement | null) => void;
};

const workflowResultPrefix = 'vault:';

export default function CatalogueSearch({ vault }: { vault?: VaultSearch }) {
    const {
        url,
        props: { entries },
    } = usePage<{ entries: CatalogueEntry[] }>();
    const { locale, t } = useLocale();
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    const opener = useRef<HTMLElement | null>(null);
    const title = t('Search catalogue', 'Katalog durchsuchen', 'ابحث في الفهرس');
    const apple =
        typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

    useEffect(() => {
        function shortcut(event: KeyboardEvent) {
            if (!isSearchShortcut(event)) return;
            event.preventDefault();
            if (event.repeat || document.querySelector('dialog:modal')) return;
            if (document.activeElement === document.body) {
                trigger.current?.focus({ preventScroll: true });
            }
            opener.current =
                document.activeElement instanceof HTMLElement
                    ? document.activeElement
                    : trigger.current;
            setOpen(true);
        }
        document.addEventListener('keydown', shortcut);
        return () => document.removeEventListener('keydown', shortcut);
    }, []);

    function search(query: string): SearchResult[] {
        const catalogueResults = searchEntries(entries, query, locale).map((entry) => ({
            id: entry.href,
            title: entry.title,
            description: `${categoryLabel(entry.category, locale)} · ${entry.summary}`,
        }));

        if (!vault) return catalogueResults;

        return [
            ...catalogueResults,
            ...searchWorkflows(vault.workflows, query, locale).map((workflow) => ({
                id: workflowResultPrefix + workflow.id,
                title: workflow.title,
                description: `${workflowPlatformLabel(workflow.platform, locale)} · ${workflowStatusLabel(workflow.status, locale)} · ${workflow.summary}`,
            })),
        ];
    }

    function selectResult({ id }: SearchResult) {
        if (id.startsWith(workflowResultPrefix)) {
            const workflow = vault?.workflows.find(
                (item) => item.id === id.slice(workflowResultPrefix.length),
            );
            if (workflow) vault?.onInspect(workflow, opener.current);
            return;
        }

        router.visit(carryCatalogueFilters(id, new URL(url, window.location.origin)));
    }

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
                    opener.current = event.currentTarget;
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
                search={search}
                onSelect={selectResult}
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
