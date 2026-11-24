import { useEffect, useMemo, useRef, useState } from 'react';
import { flowGraph, ribbons, traceFlow, trackGeometry, type Currency } from './model';
import './style.css';

export default function Example() {
    const [currency, setCurrency] = useState<Currency>('USD'),
        [hover, setHover] = useState(''),
        [focus, setFocus] = useState(''),
        [pin, setPin] = useState('');
    const graph = useMemo(() => flowGraph(currency), [currency]);
    const trace = traceFlow(graph.edges, hover || focus || pin),
        hot = (id: string) => !trace.size || trace.has(id);
    const map = useRef<HTMLDivElement>(null),
        [paths, setPaths] = useState<ReturnType<typeof ribbons>>([]);
    useEffect(
        () => trackGeometry(map.current!, () => setPaths(ribbons(map.current!, graph.edges))),
        [graph],
    );
    return (
        <section
            className="kit-panel"
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    setHover('');
                    setFocus('');
                    setPin('');
                }
            }}
        >
            <div className="kit-row" aria-label="Funding currency">
                {(['USD', 'EUR'] as const).map((c) => (
                    <button
                        key={c}
                        aria-pressed={currency === c}
                        onClick={() => {
                            setCurrency(c);
                            setHover('');
                            setFocus('');
                            setPin('');
                        }}
                    >
                        {c}
                    </button>
                ))}
            </div>
            <div className="flow-board" ref={map}>
                <svg aria-hidden="true">
                    {paths.map((p) => (
                        <path key={p.from + p.to} data-hot={hot(p.from) && hot(p.to)} d={p.path} />
                    ))}
                </svg>
                {graph.columns.map((col) => (
                    <section key={col.name}>
                        <h3>{col.name}</h3>
                        {col.nodes.map((n) => (
                            <button
                                key={n.id}
                                data-node={n.id}
                                data-hot={hot(n.id)}
                                aria-pressed={pin === n.id}
                                onPointerEnter={() => setHover(n.id)}
                                onPointerLeave={() => setHover('')}
                                onFocus={() => setFocus(n.id)}
                                onBlur={() => setFocus('')}
                                onClick={() => setPin(pin === n.id ? '' : n.id)}
                            >
                                <small>
                                    <bdi>{n.id}</bdi>
                                </small>
                                <b>{n.label}</b>
                            </button>
                        ))}
                    </section>
                ))}
            </div>
            <p>
                Ribbon width shows agreed funding. Each proposal divides its total equally among its
                linked projects in this example.
            </p>
            <table className="flow-register">
                <caption>Agreement register · {currency}</caption>
                <thead>
                    <tr>
                        <th scope="col">Agreement</th>
                        <th scope="col">Sponsor → proposal</th>
                        <th scope="col">Budget</th>
                    </tr>
                </thead>
                <tbody>
                    {graph.agreements.map((a) => (
                        <tr key={a.id} data-hot={hot(a.proposal) && hot(a.sponsor)}>
                            <th scope="row">
                                <bdi>{a.id}</bdi>
                            </th>
                            <td>
                                <bdi>
                                    {a.sponsor} → {a.proposal}
                                </bdi>
                            </td>
                            <td>
                                <bdi>
                                    {new Intl.NumberFormat('en', {
                                        style: 'currency',
                                        currency,
                                        maximumFractionDigits: 0,
                                    }).format(a.budget)}
                                </bdi>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
