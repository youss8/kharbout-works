export type CatalogueEntry = {
    slug: string;
    title: string;
    summary: string;
    category: 'Components' | 'Pages' | 'Utilities' | 'Modules' | 'AI tools';
    requirements: string[];
    href: string;
};
