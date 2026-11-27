import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const readClient = () => true;
const readServer = () => false;

export function useClientReady() {
    return useSyncExternalStore(subscribe, readClient, readServer);
}
