# Build an approval workflow

This React starter joins a status gate, a role-scoped inbox, and an auditable approval workflow. The fictional equipment requests reset when the page reloads.

## Run the starter

Use Node.js 24 or later and npm. From the extracted folder, run:

```sh
npm ci
npm test
npm run dev
```

Open the local address printed by Vite. To build the production bundle, run `npm run build`.

## Try the workflow

1. Open request **REQ-1042** as **Samira Noor · Reviewer · North**. Return it once with the reason blank to see the denial. Add a reason and return it. The request moves to Draft and its history records the event, acting reviewer, reason, and new version.
2. Reset the demo, select **REQ-1043** as Samira and try to approve it. The request stays In review because she wrote it.
3. Switch to **Robin Lin · Reviewer · South**. Only South requests appear in the inbox and request picker.
4. Reset and switch to **Casey Reed · Author · North**. Open **REQ-1041** and submit it. Switch to Samira and approve it. The activity history now contains both events.

## Adapt the pattern

- `permission-matrix.json` defines the states, transitions, roles, guard names, and event names. Use it when reviewing or testing a workflow.
- `workflow.mjs` contains the fictional fixture, visibility checks, inbox criteria, and transition logic. Keep scope checks before showing records and before applying actions.
- `ApprovalDesk.jsx` renders the inbox, role scope, request, action result, and history from that model.
- `smoke.test.mjs` checks submission, approval, scope, rejection reasons, audit events, and stale versions.

The actor picker simulates role and branch context in memory. In a connected application, derive the actor from the authenticated session and enforce record scope, version checks, and audit writes on the server. Commit each transition and its audit event together.

Licensed under MIT. See `LICENSE` in the archive.
