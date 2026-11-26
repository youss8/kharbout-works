import { setDemoStorage } from './kernels/demoStorage';

// Only these demo preferences cross the opaque iframe boundary.
const preferenceKeys: Record<string, readonly string[]> = {
    'flush-row-desk-grid': ['vault.operations-desk.v1'],
    'saved-views-sticky-filters': ['vault-register-views-v1', 'vault-register-state-v2'],
};
const maxPreferenceChars = 32_768;
const channel = 'kharbout-vault-preview';
export function connectPreview(): Promise<void> {
    if (window.parent === window) return Promise.resolve();
    const root = document.documentElement;
    const origin = location.origin;
    const preferences = new Map<string, string>();
    let persistent = false;
    setDemoStorage({
        getItem: (key) => preferences.get(key) ?? null,
        setItem(key, value) {
            if (!persistent) throw new Error('Browser storage is unavailable');
            if (value.length > maxPreferenceChars)
                throw new Error('Preview preference is too large');
            preferences.set(key, value);
            window.parent.postMessage({ channel, type: 'save', key, value }, origin);
        },
    });
    return new Promise((resolve) => {
        const wait = window.setTimeout(resolve, 800);
        window.addEventListener('message', (event) => {
            const message = event.data;
            if (
                event.source !== window.parent ||
                event.origin !== origin ||
                message?.channel !== channel
            )
                return;
            if (message.type !== 'configure') return;
            if (message.theme === 'light' || message.theme === 'dark')
                root.dataset.theme = message.theme;
            if (message.dir === 'ltr' || message.dir === 'rtl') root.dir = message.dir;
            if (Array.isArray(message.preferences)) {
                preferences.clear();
                for (const [key, value] of message.preferences) preferences.set(key, value);
                persistent = message.persistent === true;
                if (message.changed)
                    window.dispatchEvent(new StorageEvent('storage', { key: message.changedKey }));
                window.clearTimeout(wait);
                resolve();
            }
        });
        const measure = () =>
            window.parent.postMessage(
                {
                    channel,
                    type: 'size',
                    height: Math.ceil(document.body.getBoundingClientRect().height) + 4,
                },
                origin,
            );
        new ResizeObserver(measure).observe(document.body);
        window.parent.postMessage({ channel, type: 'ready' }, origin);
        measure();
    });
}

export function managePreview(frame: HTMLIFrameElement, slug: string) {
    const keys = preferenceKeys[slug] ?? [];
    const frameOrigin = frame.hasAttribute('sandbox') ? 'null' : location.origin;
    const read = () => {
        try {
            const storage = localStorage;
            const entries = keys.flatMap((key) => {
                const value = storage.getItem(key);
                return value !== null && value.length <= maxPreferenceChars ? [[key, value]] : [];
            });
            return { preferences: entries, persistent: true };
        } catch {
            return { preferences: [], persistent: false };
        }
    };
    let theme = 'light';
    let dir = 'ltr';
    const configure = (includePreferences: boolean, change?: StorageEvent) => {
        // A sandboxed frame has an opaque origin. Only appearance flags and its own public-demo preferences go to it.
        frame.contentWindow?.postMessage(
            {
                channel,
                type: 'configure',
                theme,
                dir,
                ...(includePreferences ? read() : {}),
                ...(change ? { changed: true, changedKey: change.key } : {}),
            },
            frameOrigin === 'null' ? '*' : frameOrigin,
        );
    };
    const lifecycle = new AbortController();
    window.addEventListener(
        'message',
        (event) => {
            const message = event.data;
            if (
                event.source !== frame.contentWindow ||
                event.origin !== frameOrigin ||
                message?.channel !== channel
            )
                return;
            if (message.type === 'ready') configure(true);
            if (message.type === 'size' && Number.isFinite(message.height)) {
                frame.style.height = Math.min(680, Math.max(270, message.height)) + 'px';
            }
            if (
                message.type === 'save' &&
                keys.includes(message.key) &&
                typeof message.value === 'string' &&
                message.value.length <= maxPreferenceChars
            ) {
                try {
                    localStorage.setItem(message.key, message.value);
                } catch {
                    /* View state remains in the preview. */
                }
            }
        },
        { signal: lifecycle.signal },
    );
    if (keys.length) {
        window.addEventListener(
            'storage',
            (event) => {
                if (event.key === null || keys.includes(event.key)) configure(true, event);
            },
            { signal: lifecycle.signal },
        );
    }
    return {
        navigate(engine?: string) {
            const url = new URL(frame.dataset.src!, location.href);
            if (engine) url.searchParams.set('engine', engine);
            url.searchParams.set('theme', theme);
            url.searchParams.set('dir', dir);
            frame.src = url.href;
        },
        appearance(nextTheme?: string, nextDir?: string) {
            theme = nextTheme ?? theme;
            dir = nextDir ?? dir;
            configure(false);
        },
        disconnect: () => lifecycle.abort(),
    };
}
