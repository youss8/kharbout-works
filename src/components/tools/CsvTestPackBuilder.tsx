import { useState, type SubmitEvent } from 'react';
import { Download } from 'lucide-react';
import {
    addCsvTestPackData,
    createCsvTestPack,
    defaultCsvTestSettings,
    validCsvTestSeed,
    type CsvTestSettings,
} from '../../lib/tools/csv-test-pack';
import { useClientReady } from '../../lib/use-client-ready';
import './csv-test-pack-builder.css';

const reasonLabels = {
    ok: 'Imported',
    'duplicate-id': 'Repeated record ID',
    'ambiguous-date': 'Ambiguous date',
    'invalid-date': 'Invalid calendar date',
    'missing-quantity': 'Quantity required',
};

function downloadFile(file: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

export default function CsvTestPackBuilder() {
    const ready = useClientReady();
    const [settings, setSettings] = useState(defaultCsvTestSettings);
    const [pack, setPack] = useState(() => createCsvTestPack(defaultCsvTestSettings));
    const [seedError, setSeedError] = useState('');
    const [downloadError, setDownloadError] = useState('');
    const [notice, setNotice] = useState('');
    const [downloading, setDownloading] = useState(false);

    const counts = { accepted: 0, rejected: 0, skipped: 0 };
    for (const { expected } of pack.examples) counts[expected.status]++;

    function update<Key extends keyof CsvTestSettings>(key: Key, value: CsvTestSettings[Key]) {
        setSettings((current) => ({ ...current, [key]: value }));
        setNotice('');
        if (key === 'seed') setSeedError('');
    }

    function generate(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const seed = settings.seed.trim();
        if (!validCsvTestSeed(seed)) {
            setSeedError(
                'Enter 1–32 letters, digits, dashes, or underscores. Start with a letter or digit.',
            );
            return;
        }
        setPack(createCsvTestPack({ ...settings, seed }));
        setSettings((current) => ({ ...current, seed }));
        setSeedError('');
        setNotice(`Generated fixtures for ${seed}.`);
    }

    async function downloadPack() {
        setDownloading(true);
        setNotice('Preparing the test pack…');
        setDownloadError('');
        try {
            const [response, { default: JSZip }] = await Promise.all([
                fetch('/developer/csv-test-packs/scaffold.zip'),
                import('jszip'),
            ]);
            if (!response.ok) throw new Error('The test scaffold is unavailable.');
            const scaffold = await JSZip.loadAsync(await response.arrayBuffer());
            const archive = addCsvTestPackData(scaffold, pack);
            const file = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            downloadFile(file, `csv-test-pack-${pack.expected.seed}.zip`);
            setNotice(`Download started for ${pack.expected.seed}.`);
        } catch {
            setNotice('');
            setDownloadError('The pack could not be downloaded. Try again.');
        } finally {
            setDownloading(false);
        }
    }

    return (
        <div className="csv-pack dev-workbench" inert={!ready}>
            <section className="csv-pack-panel" aria-labelledby="csv-pack-settings-title">
                <header className="csv-pack-panel-header">
                    <h2 id="csv-pack-settings-title">Fixture settings</h2>
                    <p>The same seed and rules produce the same records.</p>
                </header>
                <form className="csv-pack-form" onSubmit={generate}>
                    <label>
                        Seed
                        <input
                            type="text"
                            value={settings.seed}
                            maxLength={32}
                            spellCheck={false}
                            autoComplete="off"
                            aria-invalid={Boolean(seedError)}
                            aria-describedby={seedError ? 'csv-pack-seed-error' : undefined}
                            dir="ltr"
                            onChange={(event) => update('seed', event.target.value)}
                        />
                    </label>
                    {seedError && (
                        <p className="csv-pack-error" id="csv-pack-seed-error" role="alert">
                            {seedError}
                        </p>
                    )}
                    <label>
                        Header language
                        <select
                            value={settings.headerLanguage}
                            onChange={(event) =>
                                update(
                                    'headerLanguage',
                                    event.target.value as CsvTestSettings['headerLanguage'],
                                )
                            }
                        >
                            <option value="en">English</option>
                            <option value="ar" lang="ar">
                                العربية
                            </option>
                        </select>
                    </label>
                    <label>
                        Duplicate IDs
                        <select
                            value={settings.duplicateIds}
                            onChange={(event) =>
                                update(
                                    'duplicateIds',
                                    event.target.value as CsvTestSettings['duplicateIds'],
                                )
                            }
                        >
                            <option value="reject-all">Reject every duplicate</option>
                            <option value="keep-first">Keep first, skip later copies</option>
                        </select>
                    </label>
                    <label>
                        Ambiguous dates
                        <select
                            value={settings.ambiguousDate}
                            onChange={(event) =>
                                update(
                                    'ambiguousDate',
                                    event.target.value as CsvTestSettings['ambiguousDate'],
                                )
                            }
                        >
                            <option value="reject">Reject ambiguous dates</option>
                            <option value="month-first">Month first</option>
                            <option value="day-first">Day first</option>
                        </select>
                    </label>
                    <label>
                        Blank quantities
                        <select
                            value={settings.blankQuantity}
                            onChange={(event) =>
                                update(
                                    'blankQuantity',
                                    event.target.value as CsvTestSettings['blankQuantity'],
                                )
                            }
                        >
                            <option value="reject">Reject missing quantities</option>
                            <option value="null">Accept as null</option>
                        </select>
                    </label>
                    <label className="csv-pack-checkbox">
                        <input
                            type="checkbox"
                            checked={settings.includeBom}
                            onChange={(event) => update('includeBom', event.target.checked)}
                        />
                        Include a UTF-8 byte order mark
                    </label>
                    <button
                        className="dev-button dev-button--primary"
                        type="submit"
                        disabled={downloading}
                    >
                        Generate fixtures
                    </button>
                </form>
            </section>

            <section className="csv-pack-panel" aria-labelledby="csv-pack-results-title">
                <header className="csv-pack-panel-header csv-pack-summary">
                    <div>
                        <h2 id="csv-pack-results-title">Expected outcomes</h2>
                        <p>
                            {pack.examples.length} records · <bdi>{pack.expected.seed}</bdi>
                        </p>
                    </div>
                    <p className="csv-pack-counts">
                        <span data-outcome="accepted">{counts.accepted} accepted</span>
                        <span data-outcome="rejected">{counts.rejected} rejected</span>
                        <span data-outcome="skipped">{counts.skipped} skipped</span>
                    </p>
                </header>
                <ul className="csv-pack-cases" aria-label="CSV records">
                    {pack.examples.map(({ record, title, raw, expected }) => (
                        <li className="csv-pack-case" key={record}>
                            <span className="csv-pack-number" aria-label={`Record ${record}`}>
                                {record.toString().padStart(2, '0')}
                            </span>
                            <div className="csv-pack-input">
                                <strong>{title}</strong>
                                <span>
                                    <bdi>{raw.date}</bdi> · quantity{' '}
                                    <bdi>{raw.quantity || 'blank'}</bdi>
                                </span>
                            </div>
                            <div className="csv-pack-expected">
                                <strong data-outcome={expected.status}>{expected.status}</strong>
                                <span>{reasonLabels[expected.code]}</span>
                                {expected.status === 'accepted' &&
                                    expected.value.date !== raw.date && (
                                        <span>
                                            Interpreted as <bdi>{expected.value.date}</bdi>
                                        </span>
                                    )}
                                {expected.status === 'accepted' &&
                                    expected.value.quantity === null && (
                                        <span>
                                            Quantity <code>null</code>
                                        </span>
                                    )}
                            </div>
                        </li>
                    ))}
                </ul>
                <details className="csv-pack-source">
                    <summary>View sample CSV</summary>
                    <pre className="dev-code" tabIndex={0}>
                        <code>{pack.csv.replace(/^\uFEFF/u, '')}</code>
                    </pre>
                </details>
                <footer className="csv-pack-download">
                    <div className="dev-actions">
                        <button
                            className="dev-button dev-button--primary"
                            type="button"
                            onClick={downloadPack}
                            disabled={downloading}
                        >
                            <Download size={16} aria-hidden="true" />
                            Download test pack (.zip)
                        </button>
                        <button
                            className="dev-button"
                            type="button"
                            onClick={() => {
                                downloadFile(
                                    new Blob([pack.csv], { type: 'text/csv;charset=utf-8' }),
                                    `csv-fixture-${pack.expected.seed}.csv`,
                                );
                            }}
                        >
                            Download sample CSV
                        </button>
                    </div>
                    <p>
                        Extract the ZIP and run <code>node --test import.test.mjs</code> with
                        Node.js 24.
                    </p>
                    {downloadError && (
                        <p className="csv-pack-error" role="alert">
                            {downloadError}
                        </p>
                    )}
                    <p className="csv-pack-notice" role="status">
                        {notice}
                    </p>
                </footer>
            </section>
        </div>
    );
}
