---
order: 10
id: workflow-llm-gateway-fallback
title: "Provider-agnostic LLM gateway fallback"
kind: workflow
category: "Backend & SQL"
summary: "Preserve data-sharing consent, deadlines and auditability across provider transitions."
compatibility: ["ChatGPT","Claude","Gemini"]
tokenNotes: "Supply a provider contract, data classification rules and a representative failure trace."
isStarterPlaceholder: true
variables:
  - key: PRIMARY_PROVIDER
    label: "Primary provider"
    defaultValue: "Local model gateway"
    placeholder: "Name the first provider"
  - key: FALLBACK_PROVIDER
    label: "Fallback provider"
    defaultValue: "Approved hosted model"
    placeholder: "Name the permitted alternative"
workflowSteps:
  - "Establish the sharing gate"
  - "Specify retry and fallback behavior"
  - "Verify audit events and response mapping"
---

# Provider-agnostic LLM gateway fallback

Design a gateway that calls {{PRIMARY_PROVIDER}} first and may fall back to {{FALLBACK_PROVIDER}}. Define a common request and response envelope with request ID, task, data classification, deadline and consent scope.

Before each provider call, check whether that provider may receive the payload. If fallback consent is absent, return a clear unavailable result and a local continuation path. Define a total deadline shared across attempts and distinguish throttling, transient outage, invalid input and policy rejection.

Write a decision table covering success, timeout before output, partial streamed output, retry exhaustion and denial by the sharing gate. Include when to reuse an idempotency key and how to avoid double-counting or replaying external tool effects.

Return the adapter interface, a minimal state diagram, allowed audit fields and synthetic acceptance cases. Logs should record timing, provider choice, decision and usage without retaining raw prompts by default.
