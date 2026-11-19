import { useRef, useState } from 'react';
import '../../css/copy-code.css';

type CopyCodeButtonProps = {
    label: string;
    code: string;
    messages?: { button: string; pending: string; success: string; failure: string };
};

type CopyState = 'idle' | 'copying' | 'copied' | 'failed';

export default function CopyCodeButton({ label, code, messages }: CopyCodeButtonProps) {
    const [state, setState] = useState<CopyState>('idle');
    const pending = useRef(false);

    async function copy() {
        if (pending.current) return;
        pending.current = true;
        setState('copying');

        try {
            await navigator.clipboard.writeText(code);
            setState('copied');
        } catch {
            setState('failed');
        } finally {
            pending.current = false;
        }
    }

    return (
        <div className="copy-code">
            <button type="button" onClick={copy} aria-disabled={state === 'copying'}>
                {messages?.button ?? `Copy ${label}`}
            </button>
            <span role="status" className="copy-code-feedback">
                {state === 'copying' && (messages?.pending ?? 'Copying…')}
                {state === 'copied' && (messages?.success ?? `Copied ${label}.`)}
                {state === 'failed' &&
                    (messages?.failure ??
                        `Couldn’t copy ${label}. Select the code and use your device’s Copy command.`)}
            </span>
        </div>
    );
}
