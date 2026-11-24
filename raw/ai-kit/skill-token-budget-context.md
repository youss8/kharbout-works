---
order: 8
id: skill-token-budget-context
title: "Token-budgeted engineering context"
kind: skill
category: "Operations"
summary: "Select the smallest evidence set an engineer needs to complete a bounded task."
compatibility: ["Codex","Claude Code","ChatGPT"]
tokenNotes: "The supplied limit includes file excerpts, task context and the completion criteria."
isStarterPlaceholder: true
variables:
  - key: TASK_SCOPE
    label: "Task scope"
    defaultValue: "Repair keyboard focus restoration after closing a catalogue dialog"
    placeholder: "Describe the change and acceptance condition"
  - key: TOKEN_LIMIT
    label: "Token limit"
    defaultValue: "4,000"
    placeholder: "Specify the approximate context budget"
---

# Token-budgeted engineering context

Prepare an engineering handoff for {{TASK_SCOPE}} within approximately {{TOKEN_LIMIT}} tokens.

Start with the intended user-visible outcome and the normal entry point. Map the smallest chain of routes, components, data contracts and checks needed to reason about the change. For each source excerpt, say what decision it enables. Prefer exact symbols, paths and current behavior to general framework background.

Allocate an explicit budget for requirements, source evidence, failure observations and acceptance checks. Remove duplicate code and unrelated sibling modules. Keep unresolved questions and the smallest next read that would answer each. Treat a token count as an estimate unless a tokenizer was used.

Return the handoff with a context inventory, retained excerpts or pointers, observed invariants and a completion checklist. Finish with the estimated total and which lower-priority evidence could be retrieved if the scope changes.
