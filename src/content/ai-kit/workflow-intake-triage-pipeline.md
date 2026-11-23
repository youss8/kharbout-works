---
order: 11
id: workflow-intake-triage-pipeline
title: "Intake-to-triage escalation workflow"
kind: workflow
category: "Operations"
summary: "Trace a structured intake through routing, acknowledgement and time-based escalation."
compatibility: ["ChatGPT","Claude","Gemini"]
tokenNotes: "Provide one synthetic input record, routing rules and the service calendar."
isStarterPlaceholder: true
variables:
  - key: INTAKE_SOURCE
    label: "Intake source"
    defaultValue: "Public service request form"
    placeholder: "Name the source of structured submissions"
  - key: ROUTING_TARGET
    label: "Routing destination"
    defaultValue: "Regional operations triage sheet"
    placeholder: "Name the queue or sheet receiving records"
workflowSteps:
  - "Normalize and validate intake"
  - "Route idempotently"
  - "Schedule acknowledgement and escalation"
---

# Intake-to-triage escalation workflow

Design an intake pipeline from {{INTAKE_SOURCE}} to {{ROUTING_TARGET}}. Define required fields, validation, sensitive-field minimization and the stable source identifier used to deduplicate submissions.

Map each intake type and priority to a queue owner. Specify the first acknowledgement deadline using the service calendar and time zone. Describe the fallback when no routing rule matches or the queue is temporarily unavailable. Preserve the original receipt time on retry.

Model received, validated, routed, acknowledged, escalated and closed states. Give each transition a responsible actor and an audit event. Use a delivery ledger so timer retries send at most one escalation for a given threshold.

Return the intake schema, routing table, state transitions and a worked timeline. Demonstrate duplicate delivery, an after-hours request, a missing owner and recovery after a temporary outage. End with the operational counters a maintainer can inspect to verify the pipeline.
