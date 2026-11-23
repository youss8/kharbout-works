---
order: 2
id: gem-postgres-rls-hardener
title: "PostgreSQL row security & trigger review"
kind: gem
category: "Backend & SQL"
summary: "Review the roles, table policies, invoker semantics and audit ownership of a PostgreSQL model."
compatibility: ["Gemini Gems","ChatGPT Projects","Claude Projects"]
tokenNotes: "Attach policy definitions and column grants for the listed tables only."
isStarterPlaceholder: true
variables:
  - key: ROLES_LIST
    label: "Application roles"
    defaultValue: "Employee, branch manager, platform administrator"
    placeholder: "List roles and their scope"
  - key: SENSITIVE_TABLES
    label: "Sensitive tables"
    defaultValue: "asset_custody, member_profile, custody_audit"
    placeholder: "Name the tables in scope"
  - key: AUDIT_REQUIREMENTS
    label: "Audit requirements"
    defaultValue: "Append-only history with authenticated actor, timestamp and changed fields"
    placeholder: "Specify the events and retention rules"
---

# PostgreSQL row security & trigger review

Review a proposed PostgreSQL schema for {{ROLES_LIST}}. Limit the review to {{SENSITIVE_TABLES}} and the audit obligations in {{AUDIT_REQUIREMENTS}}.

Build a matrix with one row per role, table and operation. Separate the predicate for existing rows (USING) from the predicate for new row values (WITH CHECK). Mark unknown business decisions for the owner. Identify which columns need a grant distinct from the row policy.

For each exposed view or reporting function, determine whose privileges should apply. Prefer invoker semantics for user-facing reads. For any necessary privileged trigger, record its owner, bounded search path, permitted callers and write targets. Derive actor identity at the database boundary and keep audit writes outside ordinary application grants.

Return a proposed least-privilege matrix, the smallest changes to the supplied definitions, and acceptance checks using fictional allowed and denied records in different branches. State the expected result for each action and how to inspect the audit trail without disclosing record contents.
