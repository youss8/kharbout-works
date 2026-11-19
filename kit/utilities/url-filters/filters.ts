export type Filters = {
    query: string;
    category: string;
};

export function readFilters(url: URL): Filters {
    return {
        query: (url.searchParams.get('q') ?? '').trim(),
        category: (url.searchParams.get('category') ?? '').trim(),
    };
}

export function writeFilters(url: URL, filters: Filters): URL {
    const next = new URL(url.href);
    const previous = readFilters(url);
    const query = filters.query.trim();
    const category = filters.category.trim();

    if (query) {
        next.searchParams.set('q', query);
    } else {
        next.searchParams.delete('q');
    }

    if (category) {
        next.searchParams.set('category', category);
    } else {
        next.searchParams.delete('category');
    }

    if (query !== previous.query || category !== previous.category) {
        next.searchParams.delete('page');
    }

    return next;
}
