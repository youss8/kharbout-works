---
order: 4
id: 04-scope-tradeoff-alignment
title: Scope & Priority Trade-Off Matrix
category: Planning
summary: Compare the delivery, capacity and verification impact of late scope changes before agreeing a release decision.
isStarterPlaceholder: true
formats: [md]
---
## Change decision

Capture the current release goal, requested change, target date, decision owner and evidence of user impact. This worked example introduces a new export into a release whose acceptance tests already cover the review queue.

### Establish the constraint

The review queue is due at the end of the iteration. An additional export would need field mapping, authorization review, locale checks and a download test. Ask the team to estimate these tasks before making a delivery promise.

### Compare feasible choices

| Choice | What ships now | Consequence | Evidence before commitment |
| --- | --- | --- | --- |
| Keep the release | Existing queue with its agreed checks | Export moves to the next review | Named requester confirms priority |
| Exchange scope | Queue and export, with a lower-priority saved view deferred | Existing saved-view users wait longer | Owner accepts the deferred view and updated tests |
| Move the date | Queue, saved view and export | Release date moves by the reviewed estimate | Operations confirms the new window |
| Deliver a narrower export | A documented subset of authorized columns | Some reports still need manual preparation | Requester validates a sample file |

### Resolve the decision

1. Record the user task gained and the work displaced by each option.
2. Identify immovable constraints such as contractual dates, column-level permissions and access review.
3. Ask the implementer and reviewer for separate effort estimates. Record any dependency outside their control.
4. Choose one option. Name the owner, decision time, revised acceptance checks and follow-up date.

### Confirmation message

“We agreed to keep the queue release on its current date. The export will enter the next review with an approved field list and a sample file. The product owner will confirm the column set before estimation. The release reviewer will continue to verify access scope and queue transitions.”

Replace this example with the decision actually taken. Add a link to the change record and notify the people whose milestones moved.
