import { mountHeaderPicker } from './header-picker.ts';
import { demoStorage } from '../../../lib/kernels/demoStorage.ts';

type Role = 'Regional HR' | 'Employee';
type Region = '' | 'North' | 'East';
type Sort = 'Ascending' | 'Descending';
type Filters = { status: string[]; region: Region; query: string; sort: Sort };
type View = Filters & { name: string; role: Role };
const viewKey = 'vault-register-views-v1',
    stateKey = 'vault-register-state-v2';
const records = [
    { label: 'Contract A', status: 'Ending', region: 'North' },
    { label: 'Contract B', status: 'Current', region: 'East' },
    { label: 'Contract C', status: 'Restricted', region: 'North' },
    { label: 'Contract D', status: 'Ending', region: 'East' },
];
const roles: Role[] = ['Regional HR', 'Employee'];
const statuses = ['Current', 'Ending', 'Restricted'];
const allowed = (role: Role) =>
    statuses.filter((s) => role === 'Regional HR' || s !== 'Restricted');
function sanitize(raw: Partial<Filters>, role: Role): Filters {
    return {
        status: allowed(role).filter((s) => Array.isArray(raw.status) && raw.status.includes(s)),
        region: raw.region === 'North' || raw.region === 'East' ? raw.region : '',
        query: typeof raw.query === 'string' ? raw.query.trim().slice(0, 100) : '',
        sort: raw.sort === 'Descending' ? 'Descending' : 'Ascending',
    };
}
function read(key: string) {
    try {
        return JSON.parse(demoStorage().getItem(key) ?? 'null') as unknown;
    } catch {
        return null;
    }
}
function object(raw: unknown): raw is Record<string, unknown> {
    return !!raw && typeof raw === 'object' && !Array.isArray(raw);
}
function readViews(fallback: View[]): View[] {
    const loaded = read(viewKey);
    if (!Array.isArray(loaded)) return fallback;
    return loaded
        .flatMap((raw) => {
            if (
                !object(raw) ||
                !roles.includes(raw.role as Role) ||
                typeof raw.name !== 'string' ||
                !raw.name.trim()
            )
                return [];
            const role = raw.role as Role;
            return [{ ...sanitize(raw, role), role, name: raw.name.trim().slice(0, 60) }];
        })
        .slice(-40);
}
function readStates(): Partial<Record<Role, Filters>> {
    const stored = read(stateKey);
    if (!object(stored)) return {};
    return Object.fromEntries(
        roles.flatMap((role) =>
            object(stored[role]) ? [[role, sanitize(stored[role] as Filters, role)]] : [],
        ),
    );
}
export default function createViews() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let memoryOnly = false;
    const cleanups: (() => void)[] = [];
    const headers = new Set<HTMLElement>();
    return {
        role: 'Regional HR' as Role,
        search: '',
        query: '',
        sort: 'Ascending' as Sort,
        region: '' as Region,
        active: [] as string[],
        name: '',
        views: [] as View[],
        notice: '',
        get allowed() {
            return allowed(this.role);
        },
        get scopedViews() {
            return this.views.filter((v) => v.role === this.role);
        },
        get state(): Filters {
            return { status: this.active, region: this.region, sort: this.sort, query: this.query };
        },
        get statusSummary() {
            return this.active.length > 1
                ? this.active[0] + ' +' + (this.active.length - 1)
                : (this.active[0] ?? 'All');
        },
        get rows() {
            const visible = records.filter(
                (r) =>
                    this.allowed.includes(r.status) &&
                    (!this.active.length || this.active.includes(r.status)) &&
                    (!this.region || r.region === this.region) &&
                    r.label.toLowerCase().includes(this.query.toLowerCase()),
            );
            return this.sort === 'Descending' ? visible.reverse() : visible;
        },
        init() {
            this.views = readViews([]);
            this.restore(readStates()[this.role] ?? sanitize({}, this.role));
            const reload = (e: StorageEvent) => {
                if (e.key === viewKey || e.key === null) this.views = readViews([]);
            };
            window.addEventListener('storage', reload);
            cleanups.push(() => window.removeEventListener('storage', reload));
        },
        destroy() {
            clearTimeout(timer);
            for (const stop of cleanups) stop();
            headers.clear();
        },
        restore(state: Filters) {
            clearTimeout(timer);
            this.search = this.query = state.query;
            this.active = [...state.status];
            this.region = state.region;
            this.sort = state.sort;
            for (const h of headers) h.dispatchEvent(new Event('reset-header-draft'));
        },
        persist() {
            if (memoryOnly) return;
            try {
                demoStorage().setItem(
                    stateKey,
                    JSON.stringify({ ...readStates(), [this.role]: this.state }),
                );
            } catch {
                memoryOnly = true;
                this.notice = 'Browser storage unavailable. Filters last for this visit.';
            }
        },
        attachHeader(host: HTMLElement, field: 'status' | 'region') {
            cleanups.push(this.bindHeader(host, field));
        },
        bindHeader(host: HTMLElement, field: 'status' | 'region') {
            headers.add(host);
            const remove = mountHeaderPicker(host, {
                read: () => (field === 'status' ? this.active : [this.region]),
                commit: (values) => {
                    if (field === 'status')
                        this.active = this.allowed.filter((v) => values.includes(v));
                    else this.region = sanitize({ region: values[0] as Region }, this.role).region;
                    this.persist();
                },
            });
            const detach = () => {
                headers.delete(host);
                remove();
            };
            return detach;
        },
        type(value: string) {
            this.search = value.slice(0, 100);
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.query = this.search.trim();
                this.persist();
            }, 300);
        },
        sortBy(sort: string) {
            this.sort = sort === 'Descending' ? 'Descending' : 'Ascending';
            this.persist();
        },
        changeRole(next: Role) {
            if (!roles.includes(next)) return;
            this.query = this.search.trim();
            this.persist();
            const current = this.state,
                clean = sanitize(current, next),
                removed = clean.status.length !== current.status.length;
            this.role = next;
            this.restore(readStates()[next] ?? clean);
            this.notice = removed ? 'Removed filters unavailable to this role.' : 'Role changed.';
            this.persist();
        },
        clearFilter(field: 'status' | 'region' | 'query') {
            if (field === 'status') this.active = [];
            else if (field === 'region') this.region = '';
            else {
                clearTimeout(timer);
                this.query = this.search = '';
            }
            this.persist();
        },
        write(views: View[]) {
            this.views = views.slice(-40);
            if (memoryOnly) return;
            try {
                demoStorage().setItem(viewKey, JSON.stringify(this.views));
            } catch {
                memoryOnly = true;
                this.notice = 'Browser storage unavailable. Views last for this visit.';
            }
        },
        save() {
            const name = this.name.trim().slice(0, 60);
            if (!name) return;
            const current = memoryOnly ? this.views : readViews(this.views);
            const view = {
                ...sanitize({ ...this.state, query: this.search }, this.role),
                name,
                role: this.role,
            };
            this.notice = 'View saved.';
            this.write([...current.filter((v) => v.name !== name || v.role !== this.role), view]);
            this.name = '';
        },
        apply(view: View) {
            if (view.role !== this.role) return;
            this.restore(sanitize(view, this.role));
            this.persist();
            this.notice = 'View applied.';
        },
        remove(view: View) {
            if (view.role !== this.role) return;
            const current = memoryOnly ? this.views : readViews(this.views);
            this.notice = 'View deleted.';
            this.write(current.filter((v) => v.role !== this.role || v.name !== view.name));
        },
    };
}
