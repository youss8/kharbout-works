---
order: 5
id: skill-expand-contract-migration
title: "Expand–contract migration playbook"
kind: skill
category: "Backend & SQL"
summary: "Plan a compatible column transition across mixed application versions and resumable backfills."
compatibility: ["Codex","Claude Code","ChatGPT"]
tokenNotes: "Supply table size, relevant key definitions and the longest supported deployment overlap."
isStarterPlaceholder: true
variables:
  - key: TABLE_NAME
    label: "Table"
    defaultValue: "equipment_loans"
    placeholder: "Table receiving the compatible change"
  - key: OLD_COLUMN
    label: "Current column"
    defaultValue: "member_id"
    placeholder: "Name the existing populated column"
  - key: NEW_COLUMN
    label: "Replacement column"
    defaultValue: "custodian_id"
    placeholder: "Name the intended replacement"
---

# Expand–contract migration playbook

Plan a migration of {{TABLE_NAME}} from {{OLD_COLUMN}} to {{NEW_COLUMN}} while old and new application versions coexist.

List current readers, writers, queued jobs and exports. Specify the meaning of null, any conversion rule and the stable key used to resume a backfill. Stop and ask for those details if lossless conversion cannot be established.

Sequence the rollout into independently deployable changes. Add the compatible column, introduce coordinated writes, run bounded idempotent batches, verify parity, switch reads, retire old writers and finally remove the old column after the agreed window. For each stage, identify the safe previous app version, expected locks, monitoring query and rollback action.

Return a deployment table with preconditions, measurable exit criteria and an owner for each irreversible decision. Include a verification sample covering a null value, a concurrent update during backfill and a retried batch. Never claim zero downtime without the engine-specific lock and deployment assumptions.
