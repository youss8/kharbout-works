import { lazy, Suspense, type ComponentType } from 'react';

const sources = import.meta.glob<{ default: ComponentType }>('../../../.astro/vault-previews/*.tsx');
const examples = Object.fromEntries(Object.entries(sources).map(([path, load]) => [
    path.split('/').pop()!.replace(/\.tsx$/, ''), lazy(load),
]));
export default function ReactExample({ id }: { id: string }) {
    if (document.documentElement.dataset.engine !== 'react') return null;
    const Example = examples[id];
    return <Suspense fallback={<p role="status">Loading preview…</p>}><Example /></Suspense>;
}
