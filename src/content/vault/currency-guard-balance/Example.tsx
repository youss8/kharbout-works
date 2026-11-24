import { useState } from 'react';
import { deriveBalance, ledgerSummary } from './model';
export default function MoneyBalance() {
    const [used, setUsed] = useState(40),
        [credit, setCredit] = useState(true),
        [pending, setPending] = useState(true),
        [mix, setMix] = useState(false);
    const [eligible, setEligible] = useState(true);
    const ledger = ledgerSummary(mix),
        left = deriveBalance(used, credit, pending);
    return (
        <section className="kit-panel">
            <label>
                <input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} />{' '}
                Attempt mixed-currency total
            </label>
            {ledger.reason && (
                <div className="error-card" role="alert">
                    {ledger.reason}
                    <button onClick={() => setMix(false)}>Retry per currency</button>
                </div>
            )}
            <div className="kit-grid">
                {ledger.totals.map((total) => (
                    <bdi className="kit-cell" key={total}>
                        {total}
                    </bdi>
                ))}
            </div>
            <label>
                <input
                    type="checkbox"
                    checked={eligible}
                    onChange={(e) => setEligible(e.target.checked)}
                />{' '}
                Annual leave entitlement
            </label>
            {!eligible ? (
                <p>This contract has no annual leave entitlement.</p>
            ) : (
                <>
                    <label>
                        Used hours
                        <input
                            type="range"
                            min="0"
                            max="160"
                            step=".25"
                            value={used}
                            onChange={(e) => setUsed(e.target.valueAsNumber)}
                        />
                    </label>
                    <div className="kit-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={credit}
                                onChange={(e) => setCredit(e.target.checked)}
                            />{' '}
                            Include 8h overtime credit
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={pending}
                                onChange={(e) => setPending(e.target.checked)}
                            />{' '}
                            Reserve 16h pending
                        </label>
                    </div>
                    <p>
                        120h entitlement {credit && '+ 8h credit'} − <bdi>{used}</bdi>h used{' '}
                        {pending && '− 16h pending'}
                    </p>
                    <div
                        role="img"
                        className="balance-bands"
                        aria-label={
                            'Used ' +
                            used +
                            ' hours, reserved ' +
                            (pending ? 16 : 0) +
                            ' hours, remaining ' +
                            left.hours +
                            ' hours'
                        }
                    >
                        <i className="used" style={{ width: left.usedWidth + '%' }} />
                        <i className="reserved" style={{ width: left.pendingWidth + '%' }} />
                        {credit && (
                            <i
                                className="credit"
                                style={{ insetInlineStart: left.creditStart + '%' }}
                            />
                        )}
                    </div>
                    <output className="kit-cell">
                        {left.hours < 0 && <span>△ Overdrawn</span>}
                        <span>Remaining balance</span>
                        <bdi className="kit-value">{left.duration}</bdi>
                        <span>{left.hours} hours</span>
                    </output>
                </>
            )}
        </section>
    );
}
