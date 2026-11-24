import { scheduleGuardCases } from './guarded-file-cases.mjs';

for (const engine of ['alpine', 'react']) {
    scheduleGuardCases(engine, '/vault/preview/guarded-modals-dirty-close/?dir=rtl&engine=' + engine);
}
