---
order: 9
id: workflow-mcp-oauth-ops
title: "OAuth MCP tool integration blueprint"
kind: workflow
category: "Architecture"
summary: "Design tools that preserve signed-in identity, scoped access and traceable writes."
compatibility: ["ChatGPT","Claude","Gemini"]
tokenNotes: "Start with tool names, affected records and an RBAC/RLS matrix. Do not include credentials."
isStarterPlaceholder: true
variables:
  - key: TOOL_COUNT
    label: "Number of tools"
    defaultValue: "11"
    placeholder: "Enter the intended number of tools"
  - key: AUTH_PROVIDER
    label: "Identity provider"
    defaultValue: "Workspace OAuth issuer"
    placeholder: "Name the trusted OAuth identity provider"
workflowSteps:
  - "Inventory tools and data access"
  - "Define identity propagation"
  - "Specify failure and audit checks"
---

# OAuth MCP tool integration blueprint

Design an MCP integration with {{TOOL_COUNT}} tools and {{AUTH_PROVIDER}}. Use user-scoped operations and explicit authorization for each data boundary.

1. Inventory each tool’s purpose, typed input, output, read or write scope and idempotency expectations. Identify destructive actions that require an explicit confirmation step in the product.
2. Map the trusted issuer, expected audience, expiry and scope checks to the signed-in user. Explain how the database receives that identity and how its row policies limit both list and detail results. Keep token contents out of logs.
3. For each write, state the record policy, transaction boundary, idempotency key, audit fields and response after timeout or retry.
4. Define denial, expiration, revoked consent and dependency-outage behavior. Provide synthetic acceptance checks for a permitted own-row read, a denied cross-workspace read, an expired session and a retried write.

Return a tool inventory, identity sequence, authorization matrix and operational handover. Clearly identify assumptions that the identity provider owner must confirm.
