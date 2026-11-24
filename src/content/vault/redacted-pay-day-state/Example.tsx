import { useRef, useState } from 'react';
import { days, project, type Contract, type Role } from './model';
export default function ContractDay() {
    const stored = useRef<Contract>({ title: 'Operations Analyst', pay: 4200 });
    const [role, setRole] = useState<Role>('Platform Admin'),
        [form, setForm] = useState(() => project(stored.current, role));
    const [receipt, setReceipt] = useState(''),
        [day, setDay] = useState('one_punch');
    const state = days.find((d) => d[0] === day)!,
        decidable = ['one_punch', 'no_record'].includes(day);
    return (
        <section className="kit-panel">
            <label>
                Active role
                <select
                    value={role}
                    onChange={(e) => {
                        const next = e.target.value as Role;
                        setRole(next);
                        setForm(project(stored.current, next));
                        setReceipt('');
                    }}
                >
                    <option>Platform Admin</option>
                    <option>HR Manager</option>
                </select>
            </label>
            <form
                className="kit-panel"
                onSubmit={(e) => {
                    e.preventDefault();
                    const patch =
                        role === 'HR Manager'
                            ? { title: form.title, pay: Number(form.pay) }
                            : { title: form.title };
                    stored.current = { ...stored.current, ...patch };
                    setReceipt(JSON.stringify(patch, null, 2));
                }}
            >
                <label>
                    Job title
                    <input
                        required
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </label>
                {role === 'HR Manager' ? (
                    <label>
                        Monthly pay
                        <input
                            required
                            type="number"
                            step=".01"
                            min="0"
                            value={form.pay ?? ''}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    pay: e.target.value === '' ? undefined : e.target.valueAsNumber,
                                })
                            }
                        />
                    </label>
                ) : (
                    <p className="kit-cell">
                        🔒 Pay is withheld for this role. Saving preserves the stored amount.
                    </p>
                )}
                <button>Save contract</button>
            </form>
            {receipt && <pre aria-label="Save payload">{receipt}</pre>}
            <label>
                Attendance day
                <select value={day} onChange={(e) => setDay(e.target.value)}>
                    {days.map(([id, label]) => (
                        <option value={id} key={id}>
                            {label}
                        </option>
                    ))}
                </select>
            </label>
            <span className={'status-badge ' + (decidable ? 'dashed' : 'surface')}>
                {state[2]} {state[1]}
            </span>
            {decidable && (
                <div className="kit-row">
                    <button onClick={() => setDay('decided_present')}>Mark present</button>
                    <button onClick={() => setDay('decided_absent')}>Mark absent</button>
                </div>
            )}
        </section>
    );
}
