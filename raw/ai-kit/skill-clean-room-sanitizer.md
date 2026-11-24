---
order: 7
id: skill-clean-room-sanitizer
title: "Clean-room publication review"
kind: skill
category: "Code Review"
summary: "Review text, fixtures and export artifacts for a public clean-room release."
compatibility: ["Codex","Claude Code","ChatGPT"]
tokenNotes: "Provide changed paths, public terminology and synthetic fixture formats. Record findings without copying values."
isStarterPlaceholder: true
variables:
  - key: REPO_DOMAIN
    label: "Repository domain"
    defaultValue: "An open-source operational interface catalogue"
    placeholder: "Describe the public artifact"
  - key: SENSITIVE_ENTITIES
    label: "Sensitive entity classes"
    defaultValue: "Employer identifiers, internal hostnames, personal records and credential material"
    placeholder: "List categories; use aliases instead of actual secrets"
---

# Clean-room publication review

Review {{REPO_DOMAIN}} for clean-room publication. The restricted categories are {{SENSITIVE_ENTITIES}}. Work from authorized source material and an explicitly public terminology map.

Inventory data paths from source through build output, screenshots, test fixtures, exported files, metadata and examples. Identify embedded values and derived labels that could reconnect a fictional record with a real organization. Separate generic technology names and approved public profile details from restricted operational data.

For each issue, report only the path, record type and reason. Replace affected material with an independently authored synthetic example while preserving relational integrity, edge cases and test expectations. If a credential may be present, report its class and location without reproducing the value.

Return a release table with reviewed paths, evidence checked and remaining unknowns. Include a repeatable scan using safe categories, a fixture integrity check and a final visual review of pages, downloads and screenshots.
