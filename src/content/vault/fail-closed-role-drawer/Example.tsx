import { useKitModel } from '../../../components/vault/useKitModel';
import createDrawer from './model';
export default function Example() {
    const m = useKitModel(createDrawer);
    return (
        <section
            className="kit-panel"
            onKeyDown={(e) => {
                if (e.key === 'Escape') m.close();
            }}
        >
            <label>
                Active role{' '}
                <select value={m.role} onChange={(e) => m.change(e.target.value as typeof m.role)}>
                    <option>Regional HR</option>
                    <option>Manager</option>
                    <option>Employee</option>
                </select>
            </label>
            <div className="kit-row">
                {m.colleagues.map((p) => (
                    <button key={p.id} onClick={() => m.open(p.id)}>
                        {p.label}
                    </button>
                ))}
                <button onClick={() => m.open(404)}>Open missing record</button>
            </div>
            {m.requestedId !== null && (
                <aside aria-label="Profile detail" className="kit-panel profile-drawer">
                    <button onClick={() => m.close()}>Close detail</button>
                    <div data-loading={m.loading || undefined} aria-busy={m.loading}>
                        {m.loading && <p role="status">Checking access…</p>}
                        {m.ready && m.profile && (
                            <article>
                                <h3>{m.profile.label}</h3>
                                <p>{m.profile.assignment}</p>
                            </article>
                        )}
                        {m.unavailable && (
                            <div role="alert" className="error-card">
                                Record unavailable{' '}
                                <button onClick={() => m.open(m.requestedId!)}>Retry</button>
                            </div>
                        )}
                    </div>
                </aside>
            )}
        </section>
    );
}
