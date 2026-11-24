import { useRef, useEffect, type ReactNode } from 'react';
import { useKitModel } from '../../../components/vault/useKitModel';
import createViews from './model';
type Model = ReturnType<typeof createViews>;
function HeaderSelect({
    model,
    field,
    label,
    summary,
    children,
}: {
    model: Model;
    field: 'region' | 'status';
    label: string;
    summary: string;
    children: ReactNode;
}) {
    const host = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (host.current) return model.bindHeader(host.current, field);
    }, [model, field]);
    return (
        <div ref={host} data-search-label={'Find ' + field}>
            <select hidden aria-hidden="true" multiple={field === 'status'}>
                {children}
            </select>
            <button
                data-trigger
                data-header-trigger
                type="button"
                aria-label={label}
                aria-haspopup="dialog"
                aria-expanded="false"
            >
                {label} <small>{summary}</small>
            </button>
        </div>
    );
}
export default function Example() {
    const m = useKitModel(createViews);
    return (
        <section className="kit-panel">
            <div className="kit-row">
                <label>
                    Active role
                    <select
                        value={m.role}
                        onChange={(e) =>
                            m.changeRole(e.target.value === 'Employee' ? 'Employee' : 'Regional HR')
                        }
                    >
                        <option>Regional HR</option>
                        <option>Employee</option>
                    </select>
                </label>
                <label>
                    Search register
                    <input
                        type="search"
                        maxLength={100}
                        value={m.search}
                        onChange={(e) => m.type(e.target.value)}
                    />
                </label>
                <label>
                    Contract order
                    <select value={m.sort} onChange={(e) => m.sortBy(e.target.value)}>
                        <option>Ascending</option>
                        <option>Descending</option>
                    </select>
                </label>
            </div>
            <div data-header-chips aria-label="Active filters">
                {!!m.active.length && (
                    <button onClick={() => m.clearFilter('status')}>
                        Clear status · {m.statusSummary} ×
                    </button>
                )}
                {m.region && (
                    <button onClick={() => m.clearFilter('region')}>
                        Clear region · {m.region} ×
                    </button>
                )}
                {m.query && (
                    <button onClick={() => m.clearFilter('query')}>
                        Clear search · {m.query} ×
                    </button>
                )}
            </div>
            <table>
                <thead className="sticky bg-surface" style={{insetBlockStart:0}}>
                    <tr>
                        <th scope="col">Contract</th>
                        <th scope="col">
                            <HeaderSelect
                                model={m}
                                field="region"
                                label="Filter region"
                                summary={m.region || 'All'}
                            >
                                <option value="">All regions</option>
                                <option>North</option>
                                <option>East</option>
                                <option disabled>West (inactive)</option>
                            </HeaderSelect>
                        </th>
                        <th scope="col">
                            <HeaderSelect
                                model={m}
                                field="status"
                                label="Filter status"
                                summary={m.statusSummary}
                            >
                                {m.allowed.map((s) => (
                                    <option key={s}>{s}</option>
                                ))}
                                <option disabled>Archived</option>
                            </HeaderSelect>
                        </th>
                    </tr>
                </thead>
                <tbody aria-busy={m.search.trim()!==m.query} data-loading={m.search.trim()!==m.query||undefined}>
                    {m.rows.map((r) => (
                        <tr key={r.label}>
                            <td>{r.label}</td>
                            <td>{r.region}</td>
                            <td>{r.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="saved-count" aria-live="polite">
                {m.rows.length} matching contracts
            </p>
            {!m.rows.length && <p>No contracts match.</p>}
            <div className="kit-row">
                <label>
                    View name
                    <input
                        maxLength={60}
                        value={m.name}
                        onChange={(e) => (m.name = e.target.value)}
                    />
                </label>
                <button disabled={!m.name.trim()} onClick={() => m.save()}>
                    Save view
                </button>
            </div>
            <ul className="kit-list">
                {m.scopedViews.map((v) => (
                    <li key={v.name} className="kit-row">
                        {v.name} · {v.role}
                        <button onClick={() => m.apply(v)}>Apply</button>
                        <button onClick={() => m.remove(v)}>Delete view</button>
                    </li>
                ))}
            </ul>
            <p role="status">{m.notice}</p>
        </section>
    );
}
