import createModel, { type Stage } from '../../content/vault/status-gate-lifecycle/model.ts';

export interface StackParityCheckpoint {
    stage: string;
    version: number;
    message: string;
    event: {
        type: string;
        from: string;
        to: string;
        version: number;
        reason: string;
    } | null;
}

export type StackParityTrace = Record<'initial' | 'stale' | 'fresh', StackParityCheckpoint>;

export function runReactStackParity({
    approval,
}: {
    approval: { target: string; signed: boolean; budget: boolean; reason: string };
}): StackParityTrace {
    const model = createModel();
    const checkpoint = (message: string) => ({
        stage: model.current,
        version: model.version,
        message,
        event: model.transitionEvent,
    });
    const initial = checkpoint(model.notice);

    model.begin();
    model.version += 1;
    model.target = approval.target as Stage;
    model.signed = approval.signed;
    model.budget = approval.budget;
    model.reason = approval.reason;
    const stale = checkpoint(model.apply() ? model.notice : (model.errors[0] ?? ''));

    model.expected = model.version;
    const fresh = checkpoint(model.apply() ? model.notice : (model.errors[0] ?? ''));
    return { initial, stale, fresh };
}

export function sameCheckpoint(first: StackParityCheckpoint, second: StackParityCheckpoint) {
    return (
        first.stage === second.stage &&
        first.version === second.version &&
        first.message === second.message &&
        first.event?.type === second.event?.type &&
        first.event?.from === second.event?.from &&
        first.event?.to === second.event?.to &&
        first.event?.version === second.event?.version &&
        first.event?.reason === second.event?.reason
    );
}
