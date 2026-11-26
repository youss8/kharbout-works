export type CatalogueEntry = {
    slug: string;
    title: string;
    summary: string;
    searchText: string;
    category: 'Components' | 'Pages' | 'Utilities' | 'Modules' | 'AI tools';
    requirements: string[];
    href: string;
    downloadHref: string;
};
import { readFilters, writeFilters } from '../../kit/utilities/url-filters/filters';

export function carryCatalogueFilters(path: string, source: URL) {
    const target = writeFilters(new URL(path, source.origin), readFilters(source));
    return target.pathname + target.search + target.hash;
}
