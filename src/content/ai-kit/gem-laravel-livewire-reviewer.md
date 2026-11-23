---
order: 3
id: gem-laravel-livewire-reviewer
title: "Laravel 13 & Livewire 4 code reviewer"
kind: gem
category: "Code Review"
summary: "Review action transactions, authorization boundaries and query growth in a single module."
compatibility: ["Gemini Gems","ChatGPT Projects","Claude Projects"]
tokenNotes: "Supply one action, its Livewire method, the relevant policy and a query trace if available."
isStarterPlaceholder: true
variables:
  - key: MODULE_NAME
    label: "Module"
    defaultValue: "Asset custody approval"
    placeholder: "Name the module or action under review"
  - key: CONCURRENCY_RISK
    label: "Concurrency risk"
    defaultValue: "Two managers approve the same handover concurrently"
    placeholder: "Describe operations that may overlap"
  - key: AUTH_POLICY
    label: "Authorization policy"
    defaultValue: "Branch managers approve handovers only within their assigned branch"
    placeholder: "State the record and action scopes"
---

# Laravel 13 & Livewire 4 code reviewer

Review {{MODULE_NAME}} in Laravel 13 and Livewire 4. The concurrency case is {{CONCURRENCY_RISK}}. The intended authorization rule is {{AUTH_POLICY}}.

Trace the normal Livewire interaction from component input to persistent write. Identify the server-side authorization point, validation source, transaction boundary, row acquisition order, commit side effects and retry behavior. Compare each with the stated rule. Treat client-side visibility and disabled controls as presentation only.

For the main list and detail paths, identify which relations are loaded and when. Express query growth as the number of displayed records changes. Propose a specific eager-load, aggregate or paginated query only where the trace supports it.

Return findings ordered by impact with a file or method, a concrete consequence, the smallest correction and an observable regression check. Include a two-request concurrency timeline and one fictional denied-action check. Mark facts that require a query log or policy definition before a judgment is possible.
