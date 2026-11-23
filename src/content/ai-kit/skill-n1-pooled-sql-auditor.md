---
order: 6
id: skill-n1-pooled-sql-auditor
title: "N+1 and pooled SQL auditor"
kind: skill
category: "Backend & SQL"
summary: "Audit aggregate correctness and query count under grouped SQL reads."
compatibility: ["Codex","Claude Code","ChatGPT"]
tokenNotes: "Provide one query, its relation map and representative numerator and denominator rows."
isStarterPlaceholder: true
variables:
  - key: QUERY_CONTEXT
    label: "Query context"
    defaultValue: "Retention by site with 52/70, 9/20 and one missing denominator"
    placeholder: "Describe the grouped query and its grain"
  - key: GROUP_BY_MODE
    label: "Database grouping mode"
    defaultValue: "MySQL ONLY_FULL_GROUP_BY"
    placeholder: "Specify the grouping rules in production"
---

# N+1 and pooled SQL auditor

Audit {{QUERY_CONTEXT}} under {{GROUP_BY_MODE}}. State the grain of every source row, target row and output group. Trace joins and flag any path that multiplies a measurement.

Derive approved numerator and denominator terms at the target grain, then pool them with SUM(numerator) / NULLIF(SUM(denominator), 0). Define how missing or invalid denominators are excluded and counted. Keep unapproved values visibly separate. Identify count measures that sum and cumulative measures that need the latest reading.

Write one set-based query outline with a pre-aggregated derived table and explicit grouping. Compare its results with a small hand calculation, including an all-missing group. Distinguish an uncomputed value from zero.

Return a grain diagram, the corrected query shape, expected fixture outputs and a query-count check comparing a three-row page with a thirty-row page. Identify which supporting indexes require an execution plan before adoption.
