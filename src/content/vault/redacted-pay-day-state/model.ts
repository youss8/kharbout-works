export const days = [
    ['worked', 'Worked', '●'],
    ['one_punch', 'One punch', '◐'],
    ['no_record', 'No record', '○'],
    ['decided_absent', 'Decided absent', '■'],
    ['leave_pending', 'Leave pending', '◐'],
    ['leave_approved', 'Leave approved', '●'],
    ['holiday', 'Holiday', '○'],
    ['weekend', 'Weekend', '○'],
    ['worked_on_day_off', 'Worked on day off', '●'],
    ['decided_present', 'Decided present', '●'],
] as const;
export type Contract = { title: string; pay: number };
export type Role = 'Platform Admin' | 'HR Manager';
export function project(contract: Contract, role: Role): { title: string; pay?: number } {
    return role === 'HR Manager' ? { ...contract } : { title: contract.title };
}
export default function employeeContract() {
    let stored: Contract = { title: 'Operations Analyst', pay: 4200 };
    return {
        role: 'Platform Admin' as Role,
        form: project(stored, 'Platform Admin'),
        days,
        day: 'one_punch',
        receipt: '',
        switchRole(role: Role) {
            this.role = role;
            this.form = project(stored, role);
            this.receipt = '';
        },
        save() {
            const patch =
                this.role === 'HR Manager'
                    ? { title: this.form.title, pay: Number(this.form.pay) }
                    : { title: this.form.title };
            stored = { ...stored, ...patch };
            this.receipt = JSON.stringify(patch, null, 2);
        },
        get decidable() {
            return ['one_punch', 'no_record'].includes(this.day);
        },
    };
}
