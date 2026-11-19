import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { useLocale } from '../i18n';
import { compilePrompt, parsePrompt, workflowPlatformLabel, workflowStatusLabel } from '../vault';
import type { Workflow } from '../vault';

type VaultDrawerProps = {
    workflow: Workflow;
    onClose: () => void;
    returnFocus: HTMLElement | null;
};

type View = 'instructions' | 'sample';
type CopyState = 'idle' | 'copying' | 'copied' | 'failed';

function pointsToBackdrop(event: MouseEvent<HTMLDialogElement> | PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
    return (
        event.clientX < left ||
        event.clientX >= right ||
        event.clientY < top ||
        event.clientY >= bottom
    );
}

export default function VaultDrawer({ workflow, onClose, returnFocus }: VaultDrawerProps) {
    const { locale, t } = useLocale();
    const id = useId();
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    const instructionsTab = useRef<HTMLButtonElement>(null);
    const sampleTab = useRef<HTMLButtonElement>(null);
    const backdropPress = useRef(false);
    const copyPending = useRef(false);
    const promptRevision = useRef(0);

    const [{ segments, fields }] = useState(() => {
        const segments = parsePrompt(workflow.template, workflow.variables);
        const names = new Set(
            segments.flatMap((segment) => (segment.type === 'variable' ? [segment.name] : [])),
        );
        const metadata = new Map(workflow.variables.map((variable) => [variable.name, variable]));
        const fields = [...names].map(
            (name) =>
                metadata.get(name) ?? {
                    name,
                    label: name.replaceAll('_', ' '),
                    example: '',
                    multiline: false,
                },
        );
        return { segments, fields };
    });
    const [values, setValues] = useState<Record<string, string>>({});
    const [view, setView] = useState<View>('instructions');
    const [copyState, setCopyState] = useState<CopyState>('idle');
    const compiled = compilePrompt(segments, values);
    const tabs = [
        {
            name: 'instructions',
            label: t('Prompt Instructions', 'Prompt-Anweisungen', 'تعليمات المطالبة'),
            ref: instructionsTab,
        },
        {
            name: 'sample',
            label: t('Sample Output Preview', 'Beispielausgabe', 'معاينة نموذج المخرجات'),
            ref: sampleTab,
        },
    ] as const;
    const clipboardMessages = {
        idle: '',
        copying: t('Copying…', 'Wird kopiert…', 'جارٍ النسخ…'),
        copied: t('Copied to clipboard', 'In die Zwischenablage kopiert', 'تم النسخ إلى الحافظة'),
        failed: t(
            'Couldn’t copy. Select the prompt text and copy it manually.',
            'Kopieren fehlgeschlagen. Markiere den Prompt und kopiere ihn manuell.',
            'تعذّر النسخ. حدّد نص المطالبة وانسخه يدويًا.',
        ),
    };
    const launch =
        workflow.platform === 'claude'
            ? {
                  href: 'https://claude.ai/new',
                  label: t('Open in Claude', 'In Claude öffnen', 'افتح في Claude'),
              }
            : workflow.platform === 'gemini'
              ? {
                    href: 'https://gemini.google.com/app',
                    label: t('Open in Gemini', 'In Gemini öffnen', 'افتح في Gemini'),
                }
              : null;

    useLayoutEffect(() => {
        const element = dialog.current;
        if (!element) return;
        element.showModal();
        closeButton.current?.focus({ preventScroll: true });
        return () => {
            element.close();
            if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
            if (document.activeElement !== returnFocus) {
                document.getElementById('vault-search')?.focus({ preventScroll: true });
            }
        };
    }, [returnFocus]);

    function updateValues(nextValues: Record<string, string>) {
        promptRevision.current += 1;
        setValues(nextValues);
        if (!copyPending.current) setCopyState('idle');
    }

    function fillExamples() {
        const emptyFields = fields.filter(({ name, example }) => example && !values[name]?.trim());
        if (!emptyFields.length) return;
        const examples = Object.fromEntries(
            emptyFields.map(({ name, example }) => [name, example]),
        );
        updateValues({ ...values, ...examples });
    }

    function navigateTabs(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        let next: View;
        switch (event.key) {
            case 'Home':
                next = 'instructions';
                break;
            case 'End':
                next = 'sample';
                break;
            case 'ArrowLeft':
            case 'ArrowRight':
                next = view === 'instructions' ? 'sample' : 'instructions';
                break;
            default:
                return;
        }
        event.preventDefault();
        setView(next);
        const tab = next === 'instructions' ? instructionsTab : sampleTab;
        tab.current?.focus();
    }

    async function copyPrompt() {
        if (copyPending.current) return;
        copyPending.current = true;
        const revision = promptRevision.current;
        setCopyState('copying');

        let result: 'copied' | 'failed';
        try {
            await navigator.clipboard.writeText(compiled.text);
            result = 'copied';
        } catch {
            result = 'failed';
        } finally {
            copyPending.current = false;
        }

        if (revision !== promptRevision.current) {
            setCopyState('idle');
            return;
        }
        if (result === 'failed') setView('instructions');
        setCopyState(result);
    }

    return (
        <dialog
            ref={dialog}
            className="vault-drawer"
            aria-labelledby={`${id}-title`}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onPointerDown={(event) => {
                backdropPress.current = pointsToBackdrop(event);
            }}
            onClick={(event) => {
                const outside = backdropPress.current && pointsToBackdrop(event);
                backdropPress.current = false;
                if (outside) onClose();
            }}
        >
            <header className="vault-drawer-header">
                <div>
                    <p className="metadata">
                        {workflowPlatformLabel(workflow.platform, locale)}
                        {' · '}
                        {workflowStatusLabel(workflow.status, locale)}
                    </p>
                    <h2 id={`${id}-title`} lang="en" dir="auto">
                        {workflow.title}
                    </h2>
                </div>
                <button type="button" ref={closeButton} onClick={onClose}>
                    {t('Close', 'Schließen', 'إغلاق')}
                </button>
            </header>

            <div className="vault-drawer-body">
                {fields.length > 0 && (
                    <section className="vault-fieldset" aria-labelledby={`${id}-variables`}>
                        <div className="vault-fieldset-heading">
                            <h3 id={`${id}-variables`}>
                                {t('Prompt variables', 'Prompt-Variablen', 'متغيرات المطالبة')}
                            </h3>
                            {fields.some(({ example }) => example) && (
                                <button
                                    type="button"
                                    className="vault-fill-examples"
                                    onClick={fillExamples}
                                >
                                    {t('Fill with examples', 'Beispiele einsetzen', 'املأ بأمثلة')}
                                </button>
                            )}
                        </div>
                        <div className="vault-variable-grid">
                            {fields.map(({ name, label, example, multiline }) => {
                                const fieldId = `${id}-${name}`;
                                const props = {
                                    id: fieldId,
                                    name,
                                    value: values[name] ?? '',
                                    placeholder: example,
                                    dir: 'auto',
                                    onChange: (
                                        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                                    ) => updateValues({ ...values, [name]: event.target.value }),
                                };
                                return (
                                    <div className="vault-variable" key={name}>
                                        <label htmlFor={fieldId} lang="en" dir="auto">
                                            {label}
                                        </label>
                                        {multiline ? (
                                            <textarea {...props} rows={3} />
                                        ) : (
                                            <input {...props} type="text" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <div
                    className="vault-view-switch"
                    role="tablist"
                    aria-label={t('Workflow preview', 'Workflow-Vorschau', 'معاينة سير العمل')}
                >
                    {tabs.map(({ name, label, ref }) => (
                        <button
                            key={name}
                            type="button"
                            role="tab"
                            ref={ref}
                            id={`${id}-${name}-tab`}
                            aria-controls={`${id}-${name}-panel`}
                            aria-selected={view === name}
                            tabIndex={view === name ? 0 : -1}
                            onKeyDown={navigateTabs}
                            onClick={() => setView(name)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div
                    role="tabpanel"
                    id={`${id}-instructions-panel`}
                    aria-labelledby={`${id}-instructions-tab`}
                    tabIndex={0}
                    hidden={view !== 'instructions'}
                >
                    <pre className="vault-source" lang="en" dir="ltr">
                        {compiled.parts.map(({ text, changed }, index) =>
                            changed ? (
                                <mark key={index}>{text}</mark>
                            ) : (
                                <Fragment key={index}>{text}</Fragment>
                            ),
                        )}
                    </pre>
                </div>
                <div
                    role="tabpanel"
                    id={`${id}-sample-panel`}
                    aria-labelledby={`${id}-sample-tab`}
                    tabIndex={0}
                    hidden={view !== 'sample'}
                >
                    <div className="vault-sample">
                        <p className="metadata">
                            {t(
                                'Simulated example using the sample values.',
                                'Simulierte Ausgabe mit den Beispielwerten.',
                                'مثال محاكى باستخدام القيم النموذجية.',
                            )}
                        </p>
                        <figure className="vault-example">
                            <figcaption>{t('Before', 'Vorher', 'قبل')}</figcaption>
                            <pre className="vault-source" lang="en" dir="ltr">
                                {workflow.sampleOutput.before}
                            </pre>
                        </figure>
                        <figure className="vault-example">
                            <figcaption>{t('After', 'Nachher', 'بعد')}</figcaption>
                            <pre className="vault-source" lang="en" dir="ltr">
                                {workflow.sampleOutput.after}
                            </pre>
                        </figure>
                    </div>
                </div>

                <details className="vault-setup">
                    <summary>
                        {t('How to install this', 'So richtest du es ein', 'طريقة التثبيت')}
                    </summary>
                    <ol lang="en" dir="ltr">
                        {workflow.setup.map((step) => (
                            <li key={step}>{step}</li>
                        ))}
                    </ol>
                </details>
            </div>

            <footer className="vault-actions">
                <button
                    type="button"
                    className="vault-primary"
                    aria-disabled={copyState === 'copying'}
                    data-copy-state={copyState}
                    onClick={copyPrompt}
                >
                    {copyState === 'copied' ? (
                        <>
                            {clipboardMessages.copied}
                            <span aria-hidden="true"> ✓</span>
                        </>
                    ) : (
                        t(
                            'Copy compiled prompt',
                            'Ausgefüllten Prompt kopieren',
                            'انسخ المطالبة المجمّعة',
                        )
                    )}
                </button>
                {launch && (
                    <a
                        href={launch.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-disabled={copyState === 'copying' || undefined}
                        title={t(
                            'Copies the prompt and opens a new tab',
                            'Kopiert den Prompt und öffnet einen neuen Tab',
                            'ينسخ المطالبة ويفتح علامة تبويب جديدة',
                        )}
                        onClick={(event) => {
                            if (copyPending.current) {
                                event.preventDefault();
                                return;
                            }
                            void copyPrompt();
                        }}
                    >
                        {launch.label} <span aria-hidden="true">↗</span>
                    </a>
                )}
                <p
                    role="status"
                    className={copyState === 'failed' ? 'vault-copy-feedback' : 'browse-sr-only'}
                >
                    {clipboardMessages[copyState]}
                </p>
            </footer>
        </dialog>
    );
}
