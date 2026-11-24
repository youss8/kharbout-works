type Role = 'Regional HR' | 'Manager' | 'Employee';
type Profile = { id: number; label: string; assignment: string };
export const colleagues = [
    { id: 42, label: 'Staff 042' },
    { id: 88, label: 'Staff 088' },
    { id: 91, label: 'Staff 091' },
];
function permittedProfile(id: number, role: Role): Profile | null {
    const row = colleagues.find((p) => p.id === id);
    if (!row || (id === 88 && role !== 'Regional HR') || (id === 91 && role === 'Employee'))
        return null;
    return {
        ...row,
        assignment:
            id === 42
                ? 'Site coordination'
                : id === 88
                  ? 'Restricted contract review'
                  : 'Operations planning',
    };
}
export default function createDrawer() {
    let sequence = 0;
    return {
        colleagues,
        role: 'Regional HR' as Role,
        requestedId: null as number | null,
        loadedId: null as number | null,
        profile: null as Profile | null,
        loading: false,
        unavailable: false,
        get ready() {
            return (
                this.requestedId !== null &&
                this.loadedId === this.requestedId &&
                this.profile?.id === this.requestedId
            );
        },
        async open(id: number) {
            const token = ++sequence,
                context = this.role;
            this.requestedId = id;
            this.loadedId = null;
            this.profile = null;
            this.unavailable = false;
            this.loading = true;
            await new Promise((resolve) => setTimeout(resolve, id === 88 ? 540 : 100));
            if (token !== sequence || context !== this.role || this.requestedId !== id) return;
            const record = permittedProfile(id, context);
            this.loading = false;
            this.unavailable = record === null;
            this.profile = record;
            this.loadedId = record?.id ?? null;
        },
        change(role: Role) {
            this.role = role;
            if (this.requestedId !== null) void this.open(this.requestedId);
        },
        close() {
            sequence++;
            this.requestedId = null;
            this.loadedId = null;
            this.profile = null;
            this.loading = false;
            this.unavailable = false;
        },
        destroy() {
            sequence++;
        },
    };
}
