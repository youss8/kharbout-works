import { useState } from 'react';
import { states, readPriority, writePriority, ratings } from './model';

export default function Vocabulary() {
    const [held, setHeld] = useState(true),
        [rating, setRating] = useState('3');
    const [raw, setRaw] = useState('urgent');
    const [saved, setSaved] = useState('Medium');
    const [message, setMessage] = useState('');
    function save() {
        try {
            setSaved(writePriority(raw));
            setMessage('Saved ' + raw);
        } catch (error) {
            setMessage((error as Error).message);
        }
    }
    return (
        <section className="kit-panel">
            <div className="kit-grid">
                {states.map((state) => (
                    <div className="kit-cell" key={state.label}>
                        <span className={'status-badge ' + state.shape} data-tone={state.tone}>
                            <span aria-hidden="true">{state.glyph}</span>
                            {state.label}
                        </span>
                        {state.label === 'In progress' && held && (
                            <span className="status-badge outline" data-tone="warn">
                                Ⅱ On hold
                            </span>
                        )}
                        {state.urgency && (
                            <small data-urgency={state.urgency.variant}>
                                {state.urgency.label}
                            </small>
                        )}
                    </div>
                ))}
            </div>
            <label>
                <input type="checkbox" checked={held} onChange={(e) => setHeld(e.target.checked)} />{' '}
                Place in-progress work on hold
            </label>
            <label>
                Risk rating{' '}
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    {['', '1', '2', '3'].map((v) => (
                        <option key={v} value={v}>
                            {v || 'Not set'}
                        </option>
                    ))}
                </select>
            </label>
            <p>Likelihood: {ratings[rating]}</p>
            <label>
                Priority input
                <input value={raw} onChange={(e) => setRaw(e.target.value)} />
            </label>
            <p>
                Reader <strong>{readPriority(raw)}</strong>
            </p>
            <div className="kit-row">
                <button onClick={save}>Write priority</button>
                <span>
                    Stored <b>{saved}</b>
                </span>
            </div>
            <output aria-live="polite">{message}</output>
        </section>
    );
}
