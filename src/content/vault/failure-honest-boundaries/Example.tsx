import { useKitModel } from '../../../components/vault/useKitModel';
import createBoundary from './model';
export default function Example() {
    const m = useKitModel(createBoundary);
    return (
        <section className="kit-panel">
            <div className="kit-row">
                <button onClick={() => m.fetchRows(80)}>Fast fetch (80ms)</button>
                <button onClick={() => m.fetchRows(900)}>Slow fetch (900ms)</button>
                <button onClick={() => m.fetchRows(180, true)}>Simulate failure</button>
            </div>
            <div aria-busy={m.loading} data-loading={m.loading || undefined}>
                <p>
                    Inventory revision <bdi>{m.revision}</bdi>
                </p>
                <ul className="kit-list">
                    {m.rows.map((r) => (
                        <li key={r}>{r}</li>
                    ))}
                </ul>
            </div>
            {m.error && (
                <div role="alert" className="error-card">
                    {m.error}
                    <button onClick={() => m.fetchRows(80)}>Retry</button>
                </div>
            )}
            <label>
                CSV notes cell{' '}
                <input value={m.csvCell} onChange={(e) => (m.csvCell = e.target.value)} />
            </label>
            <p>
                Exported cell <code>{m.escaped}</code>
            </p>
            <button onClick={() => m.download()}>Download CSV</button>
        </section>
    );
}
