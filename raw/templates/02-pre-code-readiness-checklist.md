---
order: 2
id: 02-pre-code-readiness-checklist
title: Pre-Code Readiness Checklist
category: Planning
summary: Confirm ownership and evidence for integrity, concurrent writes, accessibility and recovery before implementation.
isStarterPlaceholder: true
formats: [md]
---
## Readiness review

Use one review per proposed workflow. For each line, record the reviewer, evidence, and either an acceptance decision or a dated exception with an owner. A blank decision leaves the item open.

### Protect the data

- [ ] List the entities, stable identifiers, null rules, foreign keys and uniqueness constraints. Provide one invalid example that the database must reject.
- [ ] Define valid transitions and transaction boundaries. Record a consistent lock order for two concurrent saves and the expected result of replaying the same request.
- [ ] Specify the source of every calculated total, its rounding policy and the meaning of missing inputs. Keep amounts in separate currency totals.
- [ ] Scope reads and writes by actor and record. Confirm that the caller cannot supply the authoritative actor identity.

### Make the workflow usable

- [ ] Describe the initial, empty, loading, stale, failed and completed views. For each recoverable failure, state the retry action and which form values survive.
- [ ] Record the keyboard sequence to open, complete and dismiss the main task. Identify the initial focus target and where focus returns.
- [ ] Inspect a 375px viewport and RTL layout with a long label. Verify table scrolling stays inside its labelled region.
- [ ] Give each status an icon, text and differentiated shape. Confirm all essential information remains readable in grayscale.

### Operate and verify it

- [ ] Identify audit events, actor and timestamp sources, redacted fields, retention owner and safe diagnostic context.
- [ ] Define timeouts, bounded retries and idempotency for each external call. State how a human reconciles an ambiguous result.
- [ ] Link runnable examples for one normal transaction, one refused transition, one simultaneous write and one restricted user.
- [ ] Identify the rollout switch, a recovery owner, the last known good state and a rollback rehearsal.

### Decision log

| Gate | Evidence to record | Review decision |
| --- | --- | --- |
| Concurrent submit | Request pair, committed row count, audit IDs | Accept after one mutation |
| Accessibility | Keyboard route, mobile capture, RTL reading order | Accept after reviewer walkthrough |
| Recovery | Retry result and reconciled external record | Accept after supervised rehearsal |

Before coding begins, the decision owner records the date, remaining exceptions and the first milestone at which each exception will be revisited.
