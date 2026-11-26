import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import './search-dialog.css';

export type SearchResult = { id: string; title: string; description: string };

export function isSearchShortcut(event: KeyboardEvent) {
    // The Arabic layout sends ن at the physical K position.
    const matchesK =
        event.key.toLowerCase() === 'k' ||
        (event.code === 'KeyK' && /^\p{Script=Arabic}$/u.test(event.key));
    return (
        matchesK &&
        (event.ctrlKey || event.metaKey) &&
        !event.defaultPrevented &&
        !event.isComposing &&
        !event.altKey &&
        !event.shiftKey
    );
}

const defaultLabels = {
    title: 'Search',
    input: 'Search entries',
    close: 'Close',
    empty: 'No results. Try a different search.',
};

type SearchDialogProps = {
    open: boolean;
    search: (query: string) => SearchResult[];
    onSelect: (result: SearchResult) => void;
    onClose: () => void;
    labels?: typeof defaultLabels;
};

export default function SearchDialog({ open, ...props }: SearchDialogProps) {
    return open ? <OpenSearchDialog {...props} /> : null;
}

function OpenSearchDialog({
    search,
    onSelect,
    onClose,
    labels = defaultLabels,
}: Omit<SearchDialogProps, 'open'>) {
    const dialog = useRef<HTMLDialogElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);
    const id = useId();
    const [query, setQuery] = useState('');
    const [cursor, setCursor] = useState(0);
    const results = search(query);
    const active = Math.min(cursor, results.length - 1);

    useLayoutEffect(() => {
        const element = dialog.current!;
        const opener = document.activeElement;
        element.showModal();
        input.current?.focus();
        return () => {
            element.close();
            if (opener instanceof HTMLElement && opener.isConnected) {
                opener.focus({ preventScroll: true });
            }
        };
    }, []);

    useEffect(() => {
        list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
    }, [active, query]);

    function choose(result: SearchResult) {
        onClose();
        onSelect(result);
    }

    function navigate(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.nativeEvent.isComposing || !results.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const offset = event.key === 'ArrowDown' ? 1 : -1;
            setCursor((active + offset + results.length) % results.length);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            choose(results[active]);
        }
    }

    return (
        <dialog
            ref={dialog}
            className="kit-search-dialog"
            aria-labelledby={`${id}-title`}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
        >
            <div className="kit-search-heading">
                <h2 id={`${id}-title`}>{labels.title}</h2>
                <button type="button" onClick={onClose}>
                    {labels.close}
                </button>
            </div>
            <input
                ref={input}
                role="combobox"
                type="text"
                aria-label={labels.input}
                placeholder={labels.input}
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={`${id}-results`}
                aria-activedescendant={active >= 0 ? `${id}-item-${active}` : undefined}
                autoComplete="off"
                value={query}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setCursor(0);
                }}
                onKeyDown={navigate}
            />
            <ul ref={list} id={`${id}-results`} role="listbox" aria-label={labels.input}>
                {results.map((result, index) => (
                    <li
                        key={result.id}
                        id={`${id}-item-${index}`}
                        role="option"
                        aria-selected={index === active}
                        onClick={() => choose(result)}
                    >
                        <strong>{result.title}</strong>
                        <span>{result.description}</span>
                    </li>
                ))}
            </ul>
            {results.length === 0 && <p role="status">{labels.empty}</p>}
        </dialog>
    );
}
