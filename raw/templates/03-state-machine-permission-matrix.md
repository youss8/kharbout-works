---
order: 3
id: 03-state-machine-permission-matrix
title: State Machine & Permission Matrix
category: Operations
summary: Define allowed state transitions, the actors who may request them and the evidence each transition requires.
isStarterPlaceholder: true
formats: [md, json]
jsonContent: |
  {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Workflow permission matrix",
    "type": "object",
    "additionalProperties": false,
    "required": ["version", "initial", "states", "roles", "transitions"],
    "properties": {
      "version": { "type": "integer", "minimum": 1 },
      "initial": { "$ref": "#/$defs/name" },
      "states": { "$ref": "#/$defs/names" },
      "roles": { "$ref": "#/$defs/names" },
      "transitions": {
        "type": "array",
        "minItems": 1,
        "uniqueItems": true,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": ["from", "to", "action", "roles", "requires", "auditEvent"],
          "properties": {
            "from": { "$ref": "#/$defs/name" },
            "to": { "$ref": "#/$defs/name" },
            "action": { "$ref": "#/$defs/name" },
            "roles": { "$ref": "#/$defs/names" },
            "requires": { "type": "array", "uniqueItems": true, "items": { "$ref": "#/$defs/name" } },
            "auditEvent": { "$ref": "#/$defs/name" }
          }
        }
      }
    },
    "$defs": {
      "name": { "type": "string", "pattern": "^[a-z][a-z0-9_]*$" },
      "names": { "type": "array", "minItems": 1, "uniqueItems": true, "items": { "$ref": "#/$defs/name" } }
    }
  }
---
## Workflow transition contract

Record one row per allowed edge. An absent edge is denied. A transition requires both permission on the record and evidence that the named guard passes.

### Example review register

| From | Action | To | Allowed role and scope | Required evidence | Audit event |
| --- | --- | --- | --- | --- | --- |
| Draft | Submit | Review | Author of this record | Required fields complete | Submitted |
| Review | Return | Draft | Reviewer for this branch | Written return reason | Returned |
| Review | Approve | Approved | Reviewer for this branch | Reviewer differs from author | Approved |

### Machine-readable instance

```json
{
  "version": 1,
  "initial": "draft",
  "states": ["draft", "review", "approved"],
  "roles": ["author", "reviewer"],
  "transitions": [
    {"from":"draft","to":"review","action":"submit","roles":["author"],"requires":["owns_record","complete"],"auditEvent":"submitted"},
    {"from":"review","to":"draft","action":"return","roles":["reviewer"],"requires":["same_branch","return_reason"],"auditEvent":"returned"},
    {"from":"review","to":"approved","action":"approve","roles":["reviewer"],"requires":["same_branch","different_author"],"auditEvent":"approved"}
  ]
}
```

### Enforcement sequence

1. Validate the document against the downloadable JSON Schema. Check that the initial state, edge endpoints and role references exist in the declared lists. Reject duplicate action names for the same source state.
2. Resolve the actor from the authenticated session. Scope the record and lock it before re-reading its current version and state.
3. Locate the declared edge. Evaluate each named requirement against server-owned facts and return a specific rejection if one fails.
4. Write the new state, increment the version and append the audit event in one transaction. Use an idempotency key for retryable requests.

### Verification cases

- An author submits a complete record once. A replay produces no second transition or event.
- A reviewer trying to approve their own record is refused. Both the stored state and version remain unchanged.
- A return without a reason is refused. Supplying a reason updates the review state and records the objection.
- Two reviewers race on the same version. One transition commits, and the second reviewer sees the updated state.
