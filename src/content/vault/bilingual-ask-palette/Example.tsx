import { useState } from 'react';
import createModel from './model';
export default function Example() {
    const [model] = useState(createModel);
    const [, setVersion] = useState(0);
    function refresh() {
        setVersion((n) => n + 1);
    }
    function query(value: string) {
        model.query = value;
        refresh();
    }
    return (
        <section className="kit-panel">
            <label>
                Ask in English or Arabic
                <input
                    type="search"
                    dir="auto"
                    value={model.query}
                    onChange={(e) => query(e.target.value)}
                />
            </label>
            <div className="kit-row">
                {model.presets.map((word) => (
                    <button key={word} onClick={() => query(word)}>
                        <bdi>{word}</bdi>
                    </button>
                ))}
            </div>
            <ul className="kit-list">
                {model.matches.map(({ item, breakdown, score, highlights, alias }) => (
                    <li key={item.key}>
                        <button
                            onClick={() => {
                                model.pick(item.key);
                                refresh();
                            }}
                        >
                            {highlights.map((p, i) =>
                                p.matched ? (
                                    <mark key={i}>{p.text}</mark>
                                ) : (
                                    <span key={i}>{p.text}</span>
                                ),
                            )}
                        </button>
                        {alias.length > 0 && (
                            <bdi>
                                {alias.map((p, i) =>
                                    p.matched ? (
                                        <mark key={i}>{p.text}</mark>
                                    ) : (
                                        <span key={i}>{p.text}</span>
                                    ),
                                )}
                            </bdi>
                        )}
                        <small>
                            Match {breakdown.lexical} · intent {breakdown.intent} · layout −
                            {breakdown.layoutPenalty} · recent {breakdown.frecency.toFixed(1)} ·
                            total <bdi>{score.toFixed(1)}</bdi>
                        </small>
                    </li>
                ))}
            </ul>
            {!model.matches.length && <p>No matching destination.</p>}
            <p role="status">{model.selected && 'Picked ' + model.selected}</p>
        </section>
    );
}
