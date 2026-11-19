import type { CatalogueEntry } from './catalogue';
import { categoryLabel, localizeEntry } from './i18n';
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
        const localized = localizeEntry(entry, locale);
        const text = searchable(
            [
                entry.title,
                entry.summary,
                localized.title,
                localized.summary,
                entry.category,
                categoryLabel(entry.category, locale),
                ...entry.requirements,
                ...localized.requirements,
            ].join(' '),
        );
        return terms.every((term) => text.includes(term)) ? [localized] : [];
    });
}
