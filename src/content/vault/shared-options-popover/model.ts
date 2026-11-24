import type Alpine from 'alpinejs';
import directoryUrl from './directory.json?url';

type Person = { id: number; name: string };
const directoryRequests = new Map<string, Promise<Person[]>>();
function loadDirectory(url: string) {
    const cached = directoryRequests.get(url);
    if (cached) return cached;
    const request = fetch(url)
        .then(async (response) => {
            if (!response.ok) throw new Error('Directory request failed.');
            const entries: unknown = await response.json();
            if (
                !Array.isArray(entries) ||
                !entries.every(
                    (person) =>
                        Number.isSafeInteger(person?.id) && typeof person?.name === 'string',
                )
            )
                throw new Error('Invalid directory response.');
            return entries as Person[];
        })
        .catch((error) => {
            directoryRequests.delete(url);
            throw error;
        });
    directoryRequests.set(url, request);
    return request;
}

const tasks = [
    'Verify site returns',
    'Check equipment handover',
    'Review service costs',
    'Reconcile receipts',
    'Approve time records',
    'Audit access requests',
    'Review open loans',
    'Inspect renewal dates',
    'Check inventory',
    'Review work orders',
    'Close supplier review',
    'Validate export',
];
export default function createAssignees() {
    let shared: { people: Person[] } | undefined;
    let observer: MutationObserver | undefined;
    return {
        count: 0,
        directory: [] as Person[],
        loading: false,
        error: '',
        async fetchDirectory() {
            if (this.directory.length || this.loading) return;
            this.loading = true;
            this.error = '';
            try {
                this.directory = shared?.people.length
                    ? shared.people
                    : await loadDirectory(directoryUrl);
                if (shared) shared.people = this.directory;
            } catch {
                this.error = 'Could not load the staff directory.';
            } finally {
                this.loading = false;
            }
        },
        init() {
            const measure = () => {
                const count = document.querySelectorAll('[data-assignee-option]').length;
                if (count !== this.count) this.count = count;
            };
            observer = new MutationObserver(measure);
            observer.observe(document.body, { childList: true, subtree: true });
            measure();
        },
        destroy() {
            observer?.disconnect();
        },
        registerDirectory(api: typeof Alpine) {
            if (!api.store('directory')) api.store('directory', { people: [] });
            shared = api.store('directory') as { people: Person[] };
        },
        tasks,
        active: -1,
        query: '',
        top: 0,
        inlineStart: 0,
        assigned: {} as Record<number, number[]>,
        get options() {
            return this.directory
                .filter((person) =>
                    person.name.toLowerCase().includes(this.query.trim().toLowerCase()),
                )
                .slice(0, 12);
        },
        open(index: number, button: HTMLElement) {
            this.active = index;
            void this.fetchDirectory();
            this.query = '';
            const box = button.getBoundingClientRect();
            const width = Math.min(320, innerWidth - 16);
            const lead =
                getComputedStyle(button).direction === 'rtl' ? innerWidth - box.right : box.left;
            this.inlineStart = Math.max(8, Math.min(innerWidth - width - 8, lead));
            this.top = Math.max(
                8,
                Math.min(innerHeight - Math.min(340, innerHeight - 16) - 8, box.bottom + 4),
            );
            requestAnimationFrame(() =>
                document.querySelector<HTMLInputElement>('[data-directory-search]')?.focus(),
            );
        },
        close() {
            const id = this.active;
            this.active = -1;
            document.getElementById('assign-' + id)?.focus();
        },
        toggle(id: number) {
            if (this.active < 0 || !this.directory.some((person) => person.id === id)) return;
            const current = this.assigned[this.active] ?? [];
            this.assigned = {
                ...this.assigned,
                [this.active]: current.includes(id)
                    ? current.filter((value) => value !== id)
                    : [...current, id],
            };
        },
        names(index: number) {
            return (
                (this.assigned[index] ?? [])
                    .map((id) => this.directory.find((person) => person.id === id)?.name)
                    .join(', ') || 'Unassigned'
            );
        },
    };
}
