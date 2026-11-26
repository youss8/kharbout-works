import { Component, lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const sources = import.meta.glob<{ default: ComponentType }>(
    '../../../.astro/vault-previews/*.tsx',
);
const kits = import.meta.glob<{ default: ComponentType }>('../../content/vault/*/Example.tsx');
const examples = Object.fromEntries(
    Object.entries(sources).map(([path, load]) => [
        path
            .split('/')
            .pop()!
            .replace(/\.tsx$/, ''),
        lazy(load),
    ]),
);
for (const [path, load] of Object.entries(kits)) examples[path.split('/').at(-2)!] = lazy(load);
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    render() {
        if (this.state.failed)
            return (
                <div role="alert" className="error-card">
                    The interactive example could not start.{' '}
                    <button onClick={() => location.reload()}>Retry preview</button>
                </div>
            );
        return this.props.children;
    }
}
export function mountReactExample(host: HTMLElement, id: string) {
    createRoot(host).render(<ReactExample id={id} />);
}

function ReactExample({ id }: { id: string }) {
    const Example = examples[id];
    return (
        <PreviewBoundary>
            <Suspense
                fallback={
                    <p role="status" aria-busy="true" data-loading="true">
                        Loading preview…
                    </p>
                }
            >
                <Example />
            </Suspense>
        </PreviewBoundary>
    );
}
