import { useEffect, useState, useSyncExternalStore } from 'react';

/** Both preview stacks observe the same model. Replace arrays and records when updating them. */
export function useKitModel<T extends object>(create: () => T): T {
    const [store] = useState(() => {
        let version = 0;
        const listeners = new Set<() => void>();
        const model = new Proxy(create(), {
            set(target, key, value) {
                if (Object.is(Reflect.get(target, key), value)) return true;
                const written = Reflect.set(target, key, value);
                if (written) {
                    version++;
                    listeners.forEach((notify) => notify());
                }
                return written;
            },
        });
        return {
            model,
            version: () => version,
            subscribe(notify: () => void) {
                listeners.add(notify);
                return () => {
                    listeners.delete(notify);
                };
            },
        };
    });
    useSyncExternalStore(store.subscribe, store.version, store.version);
    useEffect(() => {
        const model = store.model as T & { init?(): void; destroy?(): void };
        model.init?.();
        return () => model.destroy?.();
    }, [store]);
    return store.model;
}
