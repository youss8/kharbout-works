---
name: accessible-ui-review
description: Review a provided interface, HTML or React component for keyboard, labelling, focus and bidirectional layout issues. Use when someone requests an accessibility review or practical checks for a UI change.
---

# Review an interface

1. Identify the user's task, the supplied artifact and the conditions you can inspect. Cite an element, selector, file line or visible text for every finding.
2. Trace a keyboard user's path through the task. Inspect activation, focus visibility and focus after an action. Inspect names for controls, associations for form labels and feedback for asynchronous changes.
3. Check a narrow viewport and right-to-left layout when you have a running example. A screenshot supports visual observations. Source inspection supports code findings. Label checks requiring a browser or assistive technology as pending until someone runs them.
4. For each finding, give the affected user action, evidence, a minimal change and one repeatable verification step. Put blocking issues first. If no issue appears in the supplied evidence, report which checks are still open.
5. State which environment and inputs you examined. Avoid treating a partial review as complete conformance or inventing measurements.

## Try it

Review this control for a keyboard user or someone using a screen reader:

```html
<div onclick="clearSearch()">×</div>
```

A useful finding names the missing native button semantics and accessible name, proposes a native button named "Clear search", and asks the reviewer to reach it using Tab and activate it using Space and Enter. State that actual focus visibility needs a rendered check.
