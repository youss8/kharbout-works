type DemoStorage = Pick<Storage, 'getItem' | 'setItem'>;
let storage: DemoStorage | undefined;

export function setDemoStorage(next: DemoStorage) {
    storage = next;
}

export function demoStorage(): DemoStorage {
    return storage ?? localStorage;
}
