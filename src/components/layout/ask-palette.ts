import type Alpine from 'alpinejs';
import type { CommandIndex } from '../../data/command-index';
import { searchScopes } from '../../data/search-scopes';
import { bilingualSearch, prepareAskIndex } from '../../lib/kernels/bilingualAsk';

type Group = 'actions' | 'pages' | 'assets';
interface Option {
    key: string;
    label: string;
    aliases: string[];
    group: Group;
    summary: string;
    kind: string;
    href?: string;
    action?: 'theme';
}
type Parts = { text: string; matched: boolean }[];
interface Result extends Option {
    index: number;
    highlights: Parts;
    matchedAlias: Parts;
}
interface ResultGroup {
    title: string;
    items: Result[];
}

const historyKey = 'yok-ask-recent-v1';
const dialogElement = () => document.getElementById('ask-workbench') as HTMLDialogElement;
const searchElement = () => document.getElementById('ask-query') as HTMLInputElement;
const groupTitles: Record<Group, string> = {
    actions: 'Direct answers & quick actions',
    pages: 'Systems, sandboxes & pages',
    assets: 'Vault, AI toolkit & templates',
};

function loadHistory(): string[] {
    try {
        const stored: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
        return Array.isArray(stored)
            ? stored
                  .filter((key): key is string => typeof key === 'string' && key.length <= 240)
                  .slice(0, 32)
            : [];
    } catch {
        return [];
    }
}

function prepare(payload: CommandIndex, dark: boolean) {
    const rows: Option[] = payload.intents.map((intent) => ({
        key: 'intent:' + (intent.action ?? intent.terms[0]),
        group: 'actions',
        label:
            intent.action === 'theme'
                ? dark
                    ? 'Switch to light mode'
                    : 'Switch to dark mode'
                : intent.title,
        aliases: intent.terms,
        summary: intent.summary,
        kind: 'Quick action',
        href: intent.href,
        action: intent.action,
    }));
    for (const entry of payload.entries) {
        rows.push({
            key: 'entry:' + entry.href,
            group: entry.group,
            label: entry.title,
            aliases: [...entry.keywords, entry.summary],
            summary: entry.summary,
            kind: entry.kind,
            href: entry.href,
        });
    }
    return prepareAskIndex(rows);
}

function matchedArabicAlias(item: Option, query: string): Parts {
    if (!query.trim()) return [];
    const aliases = item.aliases
        .filter((alias) => /\p{Script=Arabic}/u.test(alias))
        .map((label) => ({ key: label, label }));
    return bilingualSearch(query, { items: aliases })[0]?.highlights ?? [];
}

export default function registerAsk(AlpineClient: typeof Alpine) {
    AlpineClient.data('commandPalette', () => {
        let index: CommandIndex | undefined;
        let prepared: ReturnType<typeof prepare> | undefined;
        let pending: Promise<void> | undefined;
        let returnFocus: HTMLElement | null = null;
        let recent = loadHistory();
        return {
            query: '',
            scope: 'All',
            opened: false,
            selected: 0,
            groups: [] as ResultGroup[],
            state: 'idle' as 'idle' | 'loading' | 'ready' | 'error',
            dark: false,
            showLoading: false,
            get choices(): Result[] {
                return this.groups.flatMap((group) => group.items);
            },
            get activeId(): string | null {
                return this.choices.length ? 'ask-option-' + this.selected : null;
            },
            syncTheme() {
                const dark = document.documentElement.dataset.theme === 'dark';
                if (index && dark !== this.dark) prepared = prepare(index, dark);
                this.dark = dark;
                if (this.opened) this.filter(this.query);
            },
            async load() {
                if (prepared) {
                    this.state = 'ready';
                    this.filter(this.query);
                    return;
                }
                if (pending) return pending;
                this.state = 'loading';
                const delay = window.setTimeout(() => {
                    this.showLoading = true;
                }, 150);
                pending = (async () => {
                    try {
                        const response = await fetch('/search-index.json');
                        if (!response.ok) throw new Error('Unavailable search index');
                        const payload: CommandIndex = await response.json();
                        prepared = prepare(payload, this.dark);
                        index = payload;
                        this.state = 'ready';
                        this.filter(this.query);
                    } catch {
                        this.state = 'error';
                    } finally {
                        clearTimeout(delay);
                        this.showLoading = false;
                        pending = undefined;
                    }
                })();
                return pending;
            },
            filter(query: string) {
                this.query = query;
                this.selected = 0;
                if (!prepared) return;
                const kinds: readonly string[] =
                    searchScopes.find((scope) => scope.label === this.scope)?.kinds ?? [];
                const hits = bilingualSearch(query, { items: prepared, recent }).filter(
                    ({ item }) => !kinds.length || kinds.includes(item.kind),
                );
                const term = query.trim(),
                    groups: ResultGroup[] = [];
                let position = 0;
                for (const group of ['actions', 'pages', 'assets'] as const) {
                    const limit = term || kinds.length ? 10 : group === 'actions' ? 2 : 4;
                    const matches = hits
                        .filter(
                            ({ item }) =>
                                item.group === group &&
                                (term ||
                                    group !== 'actions' ||
                                    recent.includes(item.key) ||
                                    item.action === 'theme' ||
                                    item.aliases.includes('cv')),
                        )
                        .slice(0, limit);
                    if (matches.length)
                        groups.push({
                            title: groupTitles[group],
                            items: matches.map(({ item, highlights }) => ({
                                ...item,
                                index: position++,
                                highlights,
                                matchedAlias: highlights.some((part) => part.matched)
                                    ? []
                                    : matchedArabicAlias(item, term),
                            })),
                        });
                }
                this.groups = groups;
            },
            setScope(scope: string) {
                this.scope = scope;
                this.filter(this.query);
                searchElement().focus();
            },
            open() {
                // A native navigation snapshot can still be covering the destination's controls.
                const page = document as Document & {
                    activeViewTransition?: ViewTransition | null;
                };
                page.activeViewTransition?.skipTransition();
                if (this.opened) {
                    searchElement().focus();
                    return;
                }
                returnFocus =
                    document.activeElement instanceof HTMLElement ? document.activeElement : null;
                this.query = '';
                this.scope = 'All';
                this.opened = true;
                this.syncTheme();
                dialogElement().showModal();
                searchElement().focus();
                void this.load();
            },
            close() {
                if (dialogElement().open) dialogElement().close();
                this.opened = false;
                if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
                returnFocus = null;
            },
            shortcut(event: KeyboardEvent) {
                if (
                    !event.isComposing &&
                    !event.altKey &&
                    (event.ctrlKey || event.metaKey) &&
                    event.key.toLowerCase() === 'k'
                ) {
                    event.preventDefault();
                    this.open();
                }
            },
            navigate(event: KeyboardEvent) {
                if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.move(event.key === 'ArrowDown' ? 1 : -1);
                } else if (event.key === 'Enter' && this.choices.length) {
                    event.preventDefault();
                    this.choose(this.choices[this.selected]);
                }
            },
            move(step: number) {
                const count = this.choices.length;
                if (!count) return;
                this.selected = (this.selected + step + count) % count;
                document
                    .getElementById('ask-option-' + this.selected)
                    ?.scrollIntoView({ block: 'nearest' });
            },
            choose(option?: Result) {
                if (!option) return;
                recent = [option.key, ...recent].slice(0, 32);
                try {
                    localStorage.setItem(historyKey, JSON.stringify(recent));
                } catch {
                    /* Keep ranking for the current page visit. */
                }
                this.close();
                if (option.action === 'theme') {
                    document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click();
                    return;
                }
                if (!option.href) return;
                const url = new URL(option.href, window.location.href);
                const sameDocument =
                    url.origin === location.origin &&
                    url.pathname === location.pathname &&
                    url.search === location.search;
                if (!sameDocument || !url.hash) {
                    window.location.assign(url.href);
                    return;
                }
                // Reveal the entry before scrolling, including when the current fragment is reselected.
                if (location.hash !== url.hash) history.pushState(null, '', url);
                window.dispatchEvent(new HashChangeEvent('hashchange'));
                requestAnimationFrame(() => {
                    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
                    if (!target) return;
                    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
                    target.focus({ preventScroll: true });
                    target.scrollIntoView({ block: 'start' });
                });
            },
        };
    });
}
