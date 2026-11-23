---
order: 4
id: gem-bug-to-spec
title: "Bug report to engineering fix specification"
kind: gem
category: "Operations"
summary: "Convert an ambiguous product bug into a bounded, reproducible functional check."
compatibility: ["Gemini Gems","ChatGPT Projects","Claude Projects"]
tokenNotes: "Include one sanitized report, the intended journey and any exact observed output."
isStarterPlaceholder: true
variables:
  - key: RAW_BUG_REPORT
    label: "Bug report"
    defaultValue: "After I clear the status filter, the list stays empty until I reload."
    placeholder: "Paste a sanitized functional bug report"
  - key: STACK
    label: "Stack"
    defaultValue: "Astro, Alpine.js and static fixtures"
    placeholder: "List the relevant technologies"
  - key: AFFECTED_FLOW
    label: "Affected flow"
    defaultValue: "Filter a catalogue, clear filters, return to the full list"
    placeholder: "Describe the normal user journey"
---

# Bug report to engineering fix specification

Turn this functional report into a fix specification for {{STACK}}.

User journey: {{AFFECTED_FLOW}}
Reported observation: {{RAW_BUG_REPORT}}

Separate what the reporter actually observed from hypotheses. Give the smallest reproducible fixture, starting state and ordered actions. State an observable expected and actual outcome after each significant change. If a detail is missing, label it unknown and propose one focused clarification.

Trace plausible state owners, persisted values and event boundaries. Rank at most three causes and name one observation that would distinguish each. Select the smallest correction consistent with the evidence and preserve neighboring flows.

Deliver a short issue title, reproduction steps, expected behavior, scope of the fix and regression checks covering the normal path, an empty result, a repeated action and keyboard use when relevant. Report whether the defect was reproduced, inferred or still awaiting evidence.
