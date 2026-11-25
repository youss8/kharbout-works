import type { Draft } from './model';

export interface LibraryEntry {
    id: string;
    name: string;
    kind: 'draft' | 'preset';
    updated: string;
    draft: Draft;
}

export interface Library {
    id: 'library';
    entries: LibraryEntry[];
    favorites: string[];
}

export const emptyLibrary = (): Library => ({ id: 'library', entries: [], favorites: [] });

async function accessLibrary<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const opening = indexedDB.open('kharbout-prompt-builder', 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore('workspace', { keyPath: 'id' });
        opening.onsuccess = () => resolve(opening.result);
        opening.onerror = () => reject(opening.error);
    });
    try {
        return await new Promise<T>((resolve, reject) => {
            const transaction = database.transaction('workspace', mode);
            const request = operation(transaction.objectStore('workspace'));
            transaction.oncomplete = () => resolve(request.result);
            transaction.onabort = () => reject(transaction.error ?? request.error);
        });
    } finally {
        database.close();
    }
}

export const loadLibrary = async (): Promise<Library> =>
    await accessLibrary('readonly', store => store.get('library')) ?? emptyLibrary();

export async function updateLibrary(change: (library: Library) => Library): Promise<Library> {
    let result = emptyLibrary();
    await accessLibrary('readwrite', store => {
        const request = store.get('library');
        request.onsuccess = () => {
            result = change(request.result ?? emptyLibrary());
            store.put(result);
        };
        return request;
    });
    return result;
}
