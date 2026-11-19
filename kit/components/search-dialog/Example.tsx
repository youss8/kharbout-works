import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import SearchDialog from './SearchDialog';
import type { SearchResult } from './SearchDialog';

type ExampleProps = {
    books?: SearchResult[];
    buttonLabel?: string;
    selectionLabel?: string;
    labels?: ComponentProps<typeof SearchDialog>['labels'];
    ownsShortcut?: boolean;
};

const readingList: SearchResult[] = [
    { id: 'river', title: 'The River Almanac', description: 'A guide to river crossings.' },
    { id: 'lantern', title: 'The Lantern Atlas', description: 'Maps of the old harbour.' },
    { id: 'shore', title: 'The Quiet Shore', description: 'Field notes from a coastal walk.' },
];

export default function Example({
    books = readingList,
    buttonLabel = 'Search reading list',
    selectionLabel = 'Selected book',
    labels,
    ownsShortcut = false,
}: ExampleProps) {
    const [open, setOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string>();
    const selected = books.find((book) => book.id === selectedId);

    useEffect(() => {
        if (!ownsShortcut) return;

        function handleShortcut(event: KeyboardEvent) {
            if (
                (event.ctrlKey || event.metaKey) &&
                !event.altKey &&
                !event.shiftKey &&
                !event.isComposing &&
                !event.defaultPrevented &&
                event.key.toLowerCase() === 'k'
            ) {
                event.preventDefault();
                setOpen(true);
            }
        }

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [ownsShortcut]);

    function search(query: string) {
        const term = query.trim().toLowerCase();
        return books.filter((book) =>
            [book.title, book.description].some((field) => field.toLowerCase().includes(term)),
        );
    }

    return (
        <>
            <div className="recipe-demo">
                <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                        event.currentTarget.focus();
                        setOpen(true);
                    }}
                >
                    {buttonLabel}
                </button>
                <output aria-label={selectionLabel}>{selected?.title}</output>
            </div>
            <SearchDialog
                open={open}
                onClose={() => setOpen(false)}
                search={search}
                onSelect={(book) => setSelectedId(book.id)}
                labels={labels}
            />
        </>
    );
}
