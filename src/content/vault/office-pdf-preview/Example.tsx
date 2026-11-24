import { useKitModel } from '../../../components/vault/useKitModel';
import createViewer from './model';
export default function Example() {
    const m = useKitModel(createViewer);
    return (
        <section className="kit-panel">
            <button onClick={() => m.open()}>Open file preview</button>
            <dialog
                id="office-modal"
                aria-label="Private file preview"
                className="kit-panel m-auto max-w-full"
                style={{
                    width: 'min(48rem,calc(100% - 1rem))',
                    maxHeight: '90dvh',
                    overflow: 'auto',
                }}
                onCancel={(e) => {
                    e.preventDefault();
                    m.close();
                }}
            >
                <header className="kit-row">
                    <strong>{m.current.name}</strong>
                    <button onClick={() => m.close()}>Close preview</button>
                </header>
                <div className="kit-row">
                    <button disabled={m.index === 0} onClick={() => m.load(m.index - 1)}>
                        <span aria-hidden="true" className="directional-icon inline-block">
                            ←
                        </span>{' '}
                        Previous file
                    </button>
                    <button
                        disabled={m.index === m.files.length - 1}
                        onClick={() => m.load(m.index + 1)}
                    >
                        Next file{' '}
                        <span aria-hidden="true" className="directional-icon inline-block">
                            →
                        </span>
                    </button>
                </div>
                <label>
                    Choose local files{' '}
                    <input
                        type="file"
                        multiple
                        onChange={(e) => {
                            void m.add(e.target.files);
                            e.target.value = '';
                        }}
                    />
                </label>
                <div aria-busy={m.loading} data-loading={m.loading || undefined}>
                    {m.loading && <p role="status">Reading file…</p>}
                    {m.error && (
                        <div role="alert" className="error-card">
                            {m.error}
                            <button onClick={() => m.load(m.index)}>Retry</button>
                        </div>
                    )}
                    {m.kind === 'sheet' && (
                        <>
                            <div
                                role="tablist"
                                aria-label="Worksheets"
                                className="worksheet-tabs"
                                onKeyDown={(e) => m.moveSheet(e.nativeEvent, e.currentTarget)}
                            >
                                {m.sheets.map((name, index) => (
                                    <button
                                        type="button"
                                        role="tab"
                                        key={name}
                                        id={'sheet-tab-' + index}
                                        aria-controls="sheet-content"
                                        aria-selected={m.sheet === index}
                                        tabIndex={m.sheet === index ? 0 : -1}
                                        onClick={() => m.chooseSheet(index)}
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                            <label className="worksheet-select">
                                Worksheet{' '}
                                <select
                                    value={m.sheet}
                                    onChange={(e) => m.chooseSheet(Number(e.target.value))}
                                >
                                    {m.sheets.map((s, i) => (
                                        <option key={i} value={i}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            {m.clipped && (
                                <p role="status">
                                    Preview limited to 500 rows × 50 columns. Source: {m.totalRows}{' '}
                                    rows × {m.totalCols} columns.
                                </p>
                            )}
                            <div
                                tabIndex={0}
                                id="sheet-content"
                                role="tabpanel"
                                aria-labelledby={'sheet-tab-' + m.sheet}
                                style={{ overflow: 'auto', maxHeight: '18rem' }}
                            >
                                <table>
                                    <tbody>
                                        {m.rows.map((r, i) => (
                                            <tr key={i}>
                                                {r.map((cell, j) => (
                                                    <td key={j}>{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    {m.kind === 'document' && (
                        <iframe
                            title="Document pages"
                            sandbox=""
                            srcDoc={m.documentHtml}
                            className="office-pages"
                        />
                    )}
                    {m.kind === 'pdf' && (
                        <object
                            data={m.current.url}
                            type="application/pdf"
                            aria-label="Local PDF"
                            className="w-full"
                            style={{ height: '16rem' }}
                        >
                            Use the download link to read this PDF.
                        </object>
                    )}
                    {m.kind === 'unsupported' && (
                        <p>This file type has no local preview. Download the original below.</p>
                    )}
                </div>
                {['sheet', 'document', 'pdf'].includes(m.kind) && (
                    <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={m.kind === 'pdf' ? m.current.url : m.standaloneUrl}
                    >
                        Open preview in new tab
                    </a>
                )}
                <a href={m.current.url} download={m.current.name}>
                    Download original
                </a>
            </dialog>
        </section>
    );
}
