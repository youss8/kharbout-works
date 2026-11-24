---
order: 1
id: 01-system-architecture-spec
title: System Architecture Spec
category: Architecture
summary: Decide the data boundaries, lifecycle, permissions and rollout for a new operational workflow.
isStarterPlaceholder: true
formats: [md]
---
## Pre-code architecture record

Record the decision owner, review date, affected teams and links to evidence. This worked example scopes a fictional equipment checkout at one branch. Replace its entities and acceptance criteria with the ones your team can verify.

### Problem and acceptance

Two operators can reserve the same asset while working with separate spreadsheets. A custodian needs one answer to “who has this device now?” The first release covers checkout, return and the custody history. Procurement belongs to a separate workflow.

Accept the design when two simultaneous requests for one device yield one active loan, and a return makes the device available without removing its previous custody record.

### Domain boundaries

| Entity | Identity and relationships | Owner of changes |
| --- | --- | --- |
| Asset | Stable asset ID, one home branch | Register service |
| Member | Stable member ID, one current branch | Directory service |
| Loan | Asset, borrower, issuer, issued time, optional returned time | Custody service |
| Custody event | Actor, loan, action and timestamp | Append-only audit writer |

### Lifecycle and invariants

1. **Available → Issued.** Lock the asset row, confirm the operator's branch scope, reject an existing active loan, then write the loan and issue event in one transaction.
2. **Issued → Returned.** Lock rows in the same order. Record the return only when the loan remains active. A repeated return reports the established result.
3. **Historical corrections.** Append a correction event with its reason and reference to the original event. The original record remains available to the reviewer.

Enforce uniqueness of active custody at the database boundary. In PostgreSQL a partial unique index can cover the asset ID where the return time is null. Document an equivalent guard if the production engine differs.

### Access matrix

| Actor | Read | Write | Boundary |
| --- | --- | --- | --- |
| Borrower | Own current and past loans | None | Member ID |
| Branch operator | Branch assets and custody | Issue and return | Asset's home branch |
| Auditor | Authorized custody history | None | Assigned review scope |

Test the same scope on API, background job and user-interface paths. Record how the service obtains the actor identity.

### Rollout and recovery

- Introduce additive tables and indexes. Dry-run the import against synthetic duplicates and retain a rejected-row report.
- Pilot a single branch. Reconcile active records against the old register before enabling checkout.
- Watch duplicate rejection counts and unreturned loans. If reconciliation fails, pause new checkouts, preserve the audit history and reconcile against the last accepted export.
- Record the release owner, fallback owner and the evidence each signs before expanding the rollout.
