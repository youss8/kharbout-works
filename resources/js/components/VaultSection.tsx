import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLocale } from '../i18n';
import {
    searchWorkflows,
    workflowPlatformLabel,
    workflowPlatforms,
    workflowStatusLabel,
} from '../vault';
import type { Workflow } from '../vault';

type VaultSectionProps = {
    workflows: Workflow[];
    onInspect: (workflow: Workflow) => void;
};

export default function VaultSection({ workflows, onInspect }: VaultSectionProps) {
    const { locale, t } = useLocale();
    const [query, setQuery] = useState('');
    const [platform, setPlatform] = useState<Workflow['platform'] | null>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const resultList = useRef<HTMLUListElement>(null);
    const matches = searchWorkflows(
        platform ? workflows.filter((item) => item.platform === platform) : workflows,
        query,
        locale,
    );
    const count = new Intl.NumberFormat(locale).format(matches.length);

    useEffect(() => {
        function focusSearch(event: globalThis.KeyboardEvent) {
            if (
                event.key !== '/' ||
                event.defaultPrevented ||
                event.isComposing ||
                event.repeat ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                document.querySelector('dialog:modal')
            )
                return;

            const target = event.target;
            if (
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    target.closest('input, textarea, select, [role="textbox"], [role="combobox"]'))
            )
                return;

            const input = searchInput.current;
            if (!input) return;

            event.preventDefault();
            input.focus({ preventScroll: true });
            input.scrollIntoView({
                block: 'nearest',
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'instant'
                    : 'smooth',
            });
        }

        document.addEventListener('keydown', focusSearch);
        return () => document.removeEventListener('keydown', focusSearch);
    }, []);

    function navigateResults(event: KeyboardEvent<HTMLElement>) {
        if (
            event.defaultPrevented ||
            event.nativeEvent.isComposing ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey
        )
            return;

        const fromSearch = event.target === searchInput.current;
        if (fromSearch && event.key === 'Enter' && matches.length) {
            event.preventDefault();
            onInspect(matches[0]);
            return;
        }

        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        const buttons = Array.from(
            resultList.current?.querySelectorAll<HTMLButtonElement>('.vault-inspect') ?? [],
        );
        if (!buttons.length) return;

        if (fromSearch) {
            event.preventDefault();
            buttons[event.key === 'ArrowDown' ? 0 : buttons.length - 1].focus();
            return;
        }

        const currentIndex = buttons.findIndex((button) => button === event.target);
        if (currentIndex < 0) return;

        event.preventDefault();
        const nextIndex = currentIndex + (event.key === 'ArrowDown' ? 1 : -1);
        (buttons[nextIndex] ?? searchInput.current)?.focus();
    }

    function clearFilters() {
        setQuery('');
        setPlatform(null);
        searchInput.current?.focus();
    }

    return (
        <section
            id="ai-vault"
            className="vault"
            aria-labelledby="vault-title"
            onKeyDown={navigateResults}
        >
            <div className="browse-toolbar">
                <h2 id="vault-title">
                    {t(
                        'AI Skills, Gems & Command Vault',
                        'Sammlung für KI-Skills, Gems und Befehle',
                        'مستودع مهارات الذكاء الاصطناعي وGems والأوامر',
                    )}
                </h2>
                <div
                    className="browse-search"
                    role="search"
                    aria-label={t('Vault', 'KI-Sammlung', 'المستودع')}
                >
                    <label className="browse-sr-only" htmlFor="vault-search">
                        {t('Search the Vault', 'KI-Sammlung durchsuchen', 'ابحث في المستودع')}
                    </label>
                    <input
                        id="vault-search"
                        ref={searchInput}
                        type="search"
                        placeholder={t(
                            'Keyword, platform or #tag',
                            'Stichwort, Plattform, #Tag',
                            'كلمة أو منصة أو وسم',
                        )}
                        aria-keyshortcuts="/"
                        aria-describedby="vault-search-keys"
                        aria-controls="vault-results"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        autoComplete="off"
                    />
                    <kbd aria-hidden="true" dir="ltr">
                        /
                    </kbd>
                    <p id="vault-search-keys" className="browse-sr-only">
                        {t(
                            'Use the arrow keys to move to results and Enter to open a workflow.',
                            'Wechsle mit den Pfeiltasten zu den Ergebnissen und öffne einen Workflow mit der Eingabetaste.',
                            'استخدم مفاتيح الأسهم للتنقّل بين النتائج ومفتاح الإدخال لفتح مسار عمل.',
                        )}
                    </p>
                </div>
            </div>

            <div
                className="browse-categories"
                role="group"
                aria-label={t('Filter by platform', 'Nach Plattform filtern', 'تصفية حسب المنصة')}
            >
                <button
                    type="button"
                    aria-pressed={platform === null}
                    onClick={() => setPlatform(null)}
                >
                    {t('All workflows', 'Alle Workflows', 'كل مسارات العمل')}
                </button>
                {workflowPlatforms.map((item) => (
                    <button
                        type="button"
                        key={item}
                        aria-pressed={platform === item}
                        onClick={() => setPlatform(item)}
                    >
                        {workflowPlatformLabel(item, locale)}
                    </button>
                ))}
            </div>

            <div className="browse-summary">
                <p aria-live="polite" aria-atomic="true">
                    {t(
                        `${count} ${matches.length === 1 ? 'workflow' : 'workflows'}`,
                        `${count} ${matches.length === 1 ? 'Workflow' : 'Workflows'}`,
                        `عدد مسارات العمل ${count}`,
                    )}
                </p>
                {(query || platform) && (
                    <button className="vault-clear" type="button" onClick={clearFilters}>
                        {t(
                            'Clear Vault filters',
                            'Filter der KI-Sammlung zurücksetzen',
                            'إزالة مرشّحات المستودع',
                        )}
                    </button>
                )}
            </div>

            <div id="vault-results">
                {matches.length > 0 ? (
                    <ul className="browse-grid" ref={resultList}>
                        {matches.map((workflow) => (
                            <li key={workflow.id}>
                                <article className="browse-card">
                                    {workflow.variables[0] && (
                                        <div
                                            className="browse-preview vault-card-preview"
                                            aria-hidden="true"
                                        >
                                            <code className="card-filter" dir="ltr">
                                                {'{{'}
                                                <b>{workflow.variables[0].name}</b>
                                                {'}}'}
                                            </code>
                                        </div>
                                    )}
                                    <div className="browse-card-body">
                                        <p className="metadata">
                                            {workflowPlatformLabel(workflow.platform, locale)}
                                            {' · '}
                                            {workflowStatusLabel(workflow.status, locale)}
                                        </p>
                                        <h3>
                                            <button
                                                className="vault-inspect"
                                                type="button"
                                                aria-haspopup="dialog"
                                                lang="en"
                                                dir="ltr"
                                                onClick={(event) => {
                                                    event.currentTarget.focus({
                                                        preventScroll: true,
                                                    });
                                                    onInspect(workflow);
                                                }}
                                            >
                                                {workflow.title}
                                            </button>
                                        </h3>
                                        <p className="browse-card-summary" lang="en" dir="ltr">
                                            {workflow.summary}
                                        </p>
                                        <ul
                                            className="browse-requirements"
                                            aria-label={t(
                                                'Intent tags',
                                                'Schlagwörter',
                                                'وسوم الغرض',
                                            )}
                                        >
                                            {workflow.tags.map((tag) => (
                                                <li key={tag}>
                                                    <bdi lang="en" dir="ltr">
                                                        #{tag}
                                                    </bdi>
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
                                'No matching workflows',
                                'Keine passenden Workflows',
                                'لا توجد مسارات عمل مطابقة',
                            )}
                        </h3>
                        <p>
                            {t(
                                'Try another keyword, tag or platform.',
                                'Versuche ein anderes Stichwort, einen anderen Tag oder eine andere Plattform.',
                                'جرّب كلمة أو وسمًا أو منصة أخرى.',
                            )}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
