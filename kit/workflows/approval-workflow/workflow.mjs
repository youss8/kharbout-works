import matrix from './permission-matrix.json' with { type: 'json' };

export { matrix };

export const actors = [
    { id: 'casey', name: 'Casey Reed', role: 'author', branch: 'North' },
    { id: 'samira', name: 'Samira Noor', role: 'reviewer', branch: 'North' },
    { id: 'robin', name: 'Robin Lin', role: 'reviewer', branch: 'South' },
];

export const requests = [
    {
        id: 'REQ-1041',
        title: 'Order two spare headsets',
        owner: 'casey',
        branch: 'North',
        state: 'draft',
        complete: true,
    },
    {
        id: 'REQ-1042',
        title: 'Replace the warehouse scanner',
        owner: 'casey',
        branch: 'North',
        state: 'review',
        complete: true,
    },
    {
        id: 'REQ-1043',
        title: 'Repair the inventory tablet',
        owner: 'samira',
        branch: 'North',
        state: 'review',
        complete: true,
    },
    {
        id: 'REQ-1044',
        title: 'Replace a damaged display cable',
        owner: 'dima',
        branch: 'South',
        state: 'review',
        complete: true,
    },
].map((record) => ({ ...record, version: 1, history: [] }));

const label = {
    draft: 'Draft',
    review: 'In review',
    approved: 'Approved',
    author: 'Author',
    reviewer: 'Reviewer',
    submit: 'Submit',
    return: 'Return',
    approve: 'Approve',
    submitted: 'Submitted',
    returned: 'Returned',
    owns_record: 'Own record',
    complete: 'Required fields complete',
    same_branch: 'Same branch',
    return_reason: 'Written return reason',
    different_author: 'Different author',
};

export const display = (key) => label[key] ?? key;

export function canRead(record, actor) {
    if (!record || !actor || record.branch !== actor.branch) return false;
    return actor.role === 'reviewer' || (actor.role === 'author' && record.owner === actor.id);
}

export function availableActions(record, actor) {
    if (!canRead(record, actor)) return [];
    return matrix.transitions.filter(
        (edge) => edge.from === record.state && edge.roles.includes(actor.role),
    );
}

export function needsAttention(record, actor) {
    if (!canRead(record, actor)) return false;
    if (actor.role === 'author') return record.state === 'draft';
    return record.state === 'review' && record.owner !== actor.id;
}

export function transition(record, actor, action, expectedVersion, note = '') {
    const reject = (message) => ({ updated: null, message });
    if (!canRead(record, actor)) return reject('This request is outside the actor’s scope.');
    if (record.version !== expectedVersion)
        return reject('This request changed. Review the current version and retry.');
    const edge = matrix.transitions.find(
        (item) => item.from === record.state && item.action === action,
    );
    if (!edge) return reject('This action is unavailable in the current state.');
    if (!edge.roles.includes(actor.role)) return reject('This role cannot take that action.');

    const reason = note.trim();
    const failed = {
        owns_record: record.owner !== actor.id && 'Only the author can submit this request.',
        complete: !record.complete && 'Complete the required fields before submitting.',
        same_branch:
            actor.branch !== record.branch &&
            'Only a reviewer for this branch can take this action.',
        return_reason: !reason && 'Add a return reason before returning this request.',
        different_author:
            record.owner === actor.id && 'A reviewer cannot approve their own request.',
    };
    for (const guard of edge.requires) {
        if (!Object.hasOwn(failed, guard))
            return reject('This request has an unsupported requirement.');
        if (failed[guard]) return reject(failed[guard]);
    }

    const version = record.version + 1;
    const event = {
        type: edge.auditEvent,
        actor: actor.name,
        version,
        reason: action === 'return' ? reason : '',
    };
    return {
        updated: { ...record, state: edge.to, version, history: [...record.history, event] },
        message: `${record.id} moved to ${display(edge.to).toLowerCase()}.`,
    };
}
