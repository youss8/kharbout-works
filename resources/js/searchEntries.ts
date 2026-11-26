import type { CatalogueEntry } from './catalogue';
import { localizeEntry } from './i18n';
import type { Locale } from './i18n';

function searchable(text: string) {
    return text
        .normalize('NFD')
        .replace(/\p{M}+/gu, '')
        .toLowerCase();
}

export function searchEntries(entries: CatalogueEntry[], query: string, locale: Locale) {
    const terms = searchable(query).split(/\s+/).filter(Boolean);
    return entries.flatMap((entry) => {
        return terms.every((term) => entry.searchText.includes(term))
            ? [localizeEntry(entry, locale)]
            : [];
    });
}
