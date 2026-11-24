# Vault upgrade verification

24 November 2026 · Local production build · Windows · Node 24 · Chrome

## Scope

The extraction indexes contain 44 Project Tracking, 28 IT Helpdesk and 25 pre-RMS HR entries. All 97 numbered entries were checked for continuity in their respective extraction lists. The master blueprint explicitly maps 24 Project Tracking, 13 IT and 16 HR IDs into 20 kits across four tiers (5, 6, 5 and 4). Each kit displays its cited IDs. The other original entries remain part of the extraction inventory.

The private extraction documents are excluded from Git and the public build. The root master blueprint matches the supplied upgrade attachment (SHA-256 `F9981E5BFEDE83BF84C4A965B5B3445DC8631D8A803D50396296C60CEBD2329C`). The provenance badges identify the source of the patterns. Browser and PHP checks exercise the clean-room implementations in this checkout.

## Verification gates

| Command | Result |
| --- | --- |
| `npm test && npx astro check && npm run build` | 37 Node tests passed. Astro checked 113 files with zero diagnostics and built 100 static pages. The build contains 60 highlighted source panels, 20 canonical previews, ten earlier preview routes and 20 Vault destinations in the bilingual search index. |
| `npm run test:workbench -- --workers=4` | 123 production browser tests passed, including the local Office viewer and copies of the complete generated source. |
| `php tests/workbench/verify-livewire.php` | All 20 canonical and ten earlier examples mounted and handled a Livewire update. The verifier also built a real Vite asset manifest and exercised additional action contracts. |
| `npx playwright test --config tests/workbench/livewire.playwright.config.mjs --reporter=line` | 10 browser tests passed with the actual Laravel 13 and Livewire 4 client. Covered kits 06, 07, 08, 10, 11, 12, 17 and 20. |
| `php tests/workbench/verify-tier4-contracts.php` | Gantt receipts, telemetry polling and per-currency funding checks passed. |
| `python scripts/audit-public.py` | 100 HTML documents, 909 references and 14 CSS asset references checked. Six original datasets and three diagrams matched the handoff. Credential, internal URL and stub scans passed. |
| `npx tsc -p tsconfig.json --noEmit` | TypeScript passed. |
| `php vendor/bin/pint --test src/content/vault tests/workbench` | PHP formatting passed. |
| `npm run lint` | Passed. |
| `npm run format:check` | Passed. |
| `npm run test:kit` | All four existing URL-filter tests passed. |
| `git diff --check` | Passed. |
| `git check-ignore VAULT_EXTRACTION_PT.md` | The local source extraction is ignored by Git. |

The browser run used the installed Chrome executable and a temporary Astro production preview on loopback. The browser checks include combined catalogue filters, original-ID search, isolated themes and directions, both preview engines, 375px overflow, Shiki source copying, search ranking, and both one-page, text-selectable A4 CV exports.

## Contrast

WCAG relative luminance was calculated from the token values in each theme. Each theme covers 19 text pairs and three functional control-boundary pairs.

| Minimum ratio | Required | Light | Dark |
| --- | ---: | ---: | ---: |
| Text | 4.50:1 | 4.65:1 | 6.30:1 |
| Control boundaries | 3.00:1 | 3.50:1 | 4.85:1 |

## Upgraded files

The inventory records the 248 files added or changed by the Vault upgrade relative to the preceding workbench revision. Build output and temporary test artifacts are omitted.

### Kit implementations

| Kit | Files within its directory |
| --- | --- |
| status-tone-vocabulary | [Example.php](../src/content/vault/status-tone-vocabulary/Example.php) · [Example.tsx](../src/content/vault/status-tone-vocabulary/Example.tsx) · [alpine.html](../src/content/vault/status-tone-vocabulary/alpine.html) · [app/Vault/HasStatusTone.php](../src/content/vault/status-tone-vocabulary/app/Vault/HasStatusTone.php) · [app/Vault/WorkState.php](../src/content/vault/status-tone-vocabulary/app/Vault/WorkState.php) · [kit.json](../src/content/vault/status-tone-vocabulary/kit.json) · [model.ts](../src/content/vault/status-tone-vocabulary/model.ts) · [resources/views/components/ui/status-chip.blade.php](../src/content/vault/status-tone-vocabulary/resources/views/components/ui/status-chip.blade.php) · [style.css](../src/content/vault/status-tone-vocabulary/style.css) · [view.blade.php](../src/content/vault/status-tone-vocabulary/view.blade.php) |
| two-band-progress-sla | [Example.php](../src/content/vault/two-band-progress-sla/Example.php) · [Example.tsx](../src/content/vault/two-band-progress-sla/Example.tsx) · [alpine.html](../src/content/vault/two-band-progress-sla/alpine.html) · [app/Vault/FundingCurrency.php](../src/content/vault/two-band-progress-sla/app/Vault/FundingCurrency.php) · [kit.json](../src/content/vault/two-band-progress-sla/kit.json) · [model.ts](../src/content/vault/two-band-progress-sla/model.ts) · [resources/views/components/ui/progress-bands.blade.php](../src/content/vault/two-band-progress-sla/resources/views/components/ui/progress-bands.blade.php) · [style.css](../src/content/vault/two-band-progress-sla/style.css) · [view.blade.php](../src/content/vault/two-band-progress-sla/view.blade.php) |
| currency-guard-balance | [Example.php](../src/content/vault/currency-guard-balance/Example.php) · [Example.tsx](../src/content/vault/currency-guard-balance/Example.tsx) · [alpine.html](../src/content/vault/currency-guard-balance/alpine.html) · [app/Vault/BalancePricing.php](../src/content/vault/currency-guard-balance/app/Vault/BalancePricing.php) · [app/Vault/Currency.php](../src/content/vault/currency-guard-balance/app/Vault/Currency.php) · [kit.json](../src/content/vault/currency-guard-balance/kit.json) · [model.ts](../src/content/vault/currency-guard-balance/model.ts) · [style.css](../src/content/vault/currency-guard-balance/style.css) · [view.blade.php](../src/content/vault/currency-guard-balance/view.blade.php) |
| zero-safe-signal-tiles | [Example.php](../src/content/vault/zero-safe-signal-tiles/Example.php) · [Example.tsx](../src/content/vault/zero-safe-signal-tiles/Example.tsx) · [alpine.html](../src/content/vault/zero-safe-signal-tiles/alpine.html) · [kit.json](../src/content/vault/zero-safe-signal-tiles/kit.json) · [model.ts](../src/content/vault/zero-safe-signal-tiles/model.ts) · [style.css](../src/content/vault/zero-safe-signal-tiles/style.css) · [view.blade.php](../src/content/vault/zero-safe-signal-tiles/view.blade.php) |
| redacted-pay-day-state | [Example.php](../src/content/vault/redacted-pay-day-state/Example.php) · [Example.tsx](../src/content/vault/redacted-pay-day-state/Example.tsx) · [alpine.html](../src/content/vault/redacted-pay-day-state/alpine.html) · [app/Livewire/Forms/ContractTerms.php](../src/content/vault/redacted-pay-day-state/app/Livewire/Forms/ContractTerms.php) · [kit.json](../src/content/vault/redacted-pay-day-state/kit.json) · [model.ts](../src/content/vault/redacted-pay-day-state/model.ts) · [view.blade.php](../src/content/vault/redacted-pay-day-state/view.blade.php) |
| shared-options-popover | [Example.php](../src/content/vault/shared-options-popover/Example.php) · [Example.tsx](../src/content/vault/shared-options-popover/Example.tsx) · [alpine.html](../src/content/vault/shared-options-popover/alpine.html) · [directory.json](../src/content/vault/shared-options-popover/directory.json) · [kit.json](../src/content/vault/shared-options-popover/kit.json) · [model.ts](../src/content/vault/shared-options-popover/model.ts) · [view.blade.php](../src/content/vault/shared-options-popover/view.blade.php) |
| saved-views-sticky-filters | [Example.php](../src/content/vault/saved-views-sticky-filters/Example.php) · [Example.tsx](../src/content/vault/saved-views-sticky-filters/Example.tsx) · [alpine.html](../src/content/vault/saved-views-sticky-filters/alpine.html) · [app/Livewire/Concerns/HasSavedViews.php](../src/content/vault/saved-views-sticky-filters/app/Livewire/Concerns/HasSavedViews.php) · [header-picker.ts](../src/content/vault/saved-views-sticky-filters/header-picker.ts) · [kit.json](../src/content/vault/saved-views-sticky-filters/kit.json) · [model.ts](../src/content/vault/saved-views-sticky-filters/model.ts) · [resources/views/components/ui/header-select.blade.php](../src/content/vault/saved-views-sticky-filters/resources/views/components/ui/header-select.blade.php) · [style.css](../src/content/vault/saved-views-sticky-filters/style.css) · [view.blade.php](../src/content/vault/saved-views-sticky-filters/view.blade.php) |
| guarded-modals-dirty-close | [Example.php](../src/content/vault/guarded-modals-dirty-close/Example.php) · [Example.tsx](../src/content/vault/guarded-modals-dirty-close/Example.tsx) · [alpine.html](../src/content/vault/guarded-modals-dirty-close/alpine.html) · [app/Livewire/Concerns/WithDirtyGuard.php](../src/content/vault/guarded-modals-dirty-close/app/Livewire/Concerns/WithDirtyGuard.php) · [kit.json](../src/content/vault/guarded-modals-dirty-close/kit.json) · [model.ts](../src/content/vault/guarded-modals-dirty-close/model.ts) · [public/vault/schedule-guard.js](../src/content/vault/guarded-modals-dirty-close/public/vault/schedule-guard.js) · [style.css](../src/content/vault/guarded-modals-dirty-close/style.css) · [view.blade.php](../src/content/vault/guarded-modals-dirty-close/view.blade.php) |
| failure-honest-boundaries | [Example.php](../src/content/vault/failure-honest-boundaries/Example.php) · [Example.tsx](../src/content/vault/failure-honest-boundaries/Example.tsx) · [alpine.html](../src/content/vault/failure-honest-boundaries/alpine.html) · [kit.json](../src/content/vault/failure-honest-boundaries/kit.json) · [model.ts](../src/content/vault/failure-honest-boundaries/model.ts) · [view.blade.php](../src/content/vault/failure-honest-boundaries/view.blade.php) |
| office-pdf-preview | [Example.php](../src/content/vault/office-pdf-preview/Example.php) · [Example.tsx](../src/content/vault/office-pdf-preview/Example.tsx) · [alpine.html](../src/content/vault/office-pdf-preview/alpine.html) · [kit.json](../src/content/vault/office-pdf-preview/kit.json) · [model.ts](../src/content/vault/office-pdf-preview/model.ts) · [office-reader.ts](../src/content/vault/office-pdf-preview/office-reader.ts) · [register.ts](../src/content/vault/office-pdf-preview/register.ts) · [sample.docx](../src/content/vault/office-pdf-preview/sample.docx) · [sample.pdf](../src/content/vault/office-pdf-preview/sample.pdf) · [sample.xlsx](../src/content/vault/office-pdf-preview/sample.xlsx) · [sample.zip](../src/content/vault/office-pdf-preview/sample.zip) · [style.css](../src/content/vault/office-pdf-preview/style.css) · [view.blade.php](../src/content/vault/office-pdf-preview/view.blade.php) |
| fail-closed-role-drawer | [Example.php](../src/content/vault/fail-closed-role-drawer/Example.php) · [Example.tsx](../src/content/vault/fail-closed-role-drawer/Example.tsx) · [alpine.html](../src/content/vault/fail-closed-role-drawer/alpine.html) · [kit.json](../src/content/vault/fail-closed-role-drawer/kit.json) · [model.ts](../src/content/vault/fail-closed-role-drawer/model.ts) · [style.css](../src/content/vault/fail-closed-role-drawer/style.css) · [view.blade.php](../src/content/vault/fail-closed-role-drawer/view.blade.php) |
| bilingual-ask-palette | [Example.php](../src/content/vault/bilingual-ask-palette/Example.php) · [Example.tsx](../src/content/vault/bilingual-ask-palette/Example.tsx) · [alpine.html](../src/content/vault/bilingual-ask-palette/alpine.html) · [app/Livewire/AskIndex.php](../src/content/vault/bilingual-ask-palette/app/Livewire/AskIndex.php) · [kit.json](../src/content/vault/bilingual-ask-palette/kit.json) · [model.ts](../src/content/vault/bilingual-ask-palette/model.ts) · [view.blade.php](../src/content/vault/bilingual-ask-palette/view.blade.php) |
| status-gate-lifecycle | [Example.php](../src/content/vault/status-gate-lifecycle/Example.php) · [Example.tsx](../src/content/vault/status-gate-lifecycle/Example.tsx) · [alpine.html](../src/content/vault/status-gate-lifecycle/alpine.html) · [kit.json](../src/content/vault/status-gate-lifecycle/kit.json) · [model.ts](../src/content/vault/status-gate-lifecycle/model.ts) · [style.css](../src/content/vault/status-gate-lifecycle/style.css) · [view.blade.php](../src/content/vault/status-gate-lifecycle/view.blade.php) |
| needs-action-inbox | [Example.php](../src/content/vault/needs-action-inbox/Example.php) · [Example.tsx](../src/content/vault/needs-action-inbox/Example.tsx) · [alpine.html](../src/content/vault/needs-action-inbox/alpine.html) · [app/Livewire/WorkInbox.php](../src/content/vault/needs-action-inbox/app/Livewire/WorkInbox.php) · [digest.ts](../src/content/vault/needs-action-inbox/digest.ts) · [kit.json](../src/content/vault/needs-action-inbox/kit.json) · [model.ts](../src/content/vault/needs-action-inbox/model.ts) · [view.blade.php](../src/content/vault/needs-action-inbox/view.blade.php) |
| spreadsheet-importer-register | [Example.php](../src/content/vault/spreadsheet-importer-register/Example.php) · [Example.tsx](../src/content/vault/spreadsheet-importer-register/Example.tsx) · [alpine.html](../src/content/vault/spreadsheet-importer-register/alpine.html) · [app/Livewire/RegisterForm.php](../src/content/vault/spreadsheet-importer-register/app/Livewire/RegisterForm.php) · [kit.json](../src/content/vault/spreadsheet-importer-register/kit.json) · [model.ts](../src/content/vault/spreadsheet-importer-register/model.ts) · [view.blade.php](../src/content/vault/spreadsheet-importer-register/view.blade.php) |
| amendment-diff-org-chart | [Example.php](../src/content/vault/amendment-diff-org-chart/Example.php) · [Example.tsx](../src/content/vault/amendment-diff-org-chart/Example.tsx) · [alpine.html](../src/content/vault/amendment-diff-org-chart/alpine.html) · [app/Livewire/ContractDescriber.php](../src/content/vault/amendment-diff-org-chart/app/Livewire/ContractDescriber.php) · [kit.json](../src/content/vault/amendment-diff-org-chart/kit.json) · [model.ts](../src/content/vault/amendment-diff-org-chart/model.ts) · [pay-fixture.ts](../src/content/vault/amendment-diff-org-chart/pay-fixture.ts) · [style.css](../src/content/vault/amendment-diff-org-chart/style.css) · [view.blade.php](../src/content/vault/amendment-diff-org-chart/view.blade.php) |
| flush-row-desk-grid | [Example.php](../src/content/vault/flush-row-desk-grid/Example.php) · [Example.tsx](../src/content/vault/flush-row-desk-grid/Example.tsx) · [alpine.html](../src/content/vault/flush-row-desk-grid/alpine.html) · [kit.json](../src/content/vault/flush-row-desk-grid/kit.json) · [model.ts](../src/content/vault/flush-row-desk-grid/model.ts) · [style.css](../src/content/vault/flush-row-desk-grid/style.css) · [view.blade.php](../src/content/vault/flush-row-desk-grid/view.blade.php) |
| html-svg-sankey-flow | [Example.php](../src/content/vault/html-svg-sankey-flow/Example.php) · [Example.tsx](../src/content/vault/html-svg-sankey-flow/Example.tsx) · [alpine.html](../src/content/vault/html-svg-sankey-flow/alpine.html) · [kit.json](../src/content/vault/html-svg-sankey-flow/kit.json) · [model.ts](../src/content/vault/html-svg-sankey-flow/model.ts) · [style.css](../src/content/vault/html-svg-sankey-flow/style.css) · [view.blade.php](../src/content/vault/html-svg-sankey-flow/view.blade.php) |
| patch-panel-estate-strip | [Example.php](../src/content/vault/patch-panel-estate-strip/Example.php) · [Example.tsx](../src/content/vault/patch-panel-estate-strip/Example.tsx) · [alpine.html](../src/content/vault/patch-panel-estate-strip/alpine.html) · [kit.json](../src/content/vault/patch-panel-estate-strip/kit.json) · [model.ts](../src/content/vault/patch-panel-estate-strip/model.ts) · [style.css](../src/content/vault/patch-panel-estate-strip/style.css) · [view.blade.php](../src/content/vault/patch-panel-estate-strip/view.blade.php) |
| gantt-and-timesheet-machines | [Example.php](../src/content/vault/gantt-and-timesheet-machines/Example.php) · [Example.tsx](../src/content/vault/gantt-and-timesheet-machines/Example.tsx) · [alpine.html](../src/content/vault/gantt-and-timesheet-machines/alpine.html) · [kit.json](../src/content/vault/gantt-and-timesheet-machines/kit.json) · [model.ts](../src/content/vault/gantt-and-timesheet-machines/model.ts) · [style.css](../src/content/vault/gantt-and-timesheet-machines/style.css) · [view.blade.php](../src/content/vault/gantt-and-timesheet-machines/view.blade.php) |

### Shared source, routes, tests and documentation

- [.gitattributes](../.gitattributes)
- [.github/workflows/checks.yml](../.github/workflows/checks.yml)
- [.gitignore](../.gitignore)
- [README.md](../README.md)
- [VAULT_MASTER_BLUEPRINT.md](../VAULT_MASTER_BLUEPRINT.md)
- [docs/vault-upgrade-verification.md](../docs/vault-upgrade-verification.md)
- [package-lock.json](../package-lock.json)
- [package.json](../package.json)
- [src/components/demos/AttendanceAmendDemo.astro](../src/components/demos/AttendanceAmendDemo.astro)
- [src/components/demos/EstateOverviewDemo.tsx](../src/components/demos/EstateOverviewDemo.tsx)
- [src/components/demos/FundingFlowDemo.astro](../src/components/demos/FundingFlowDemo.astro)
- [src/components/demos/KpiCockpitDemo.astro](../src/components/demos/KpiCockpitDemo.astro)
- [src/components/demos/LeaveEngineDemo.astro](../src/components/demos/LeaveEngineDemo.astro)
- [src/components/demos/ServiceDeskDemo.tsx](../src/components/demos/ServiceDeskDemo.tsx)
- [src/components/demos/hr-alpine.js](../src/components/demos/hr-alpine.js)
- [src/components/demos/hr-demos.css](../src/components/demos/hr-demos.css)
- [src/components/demos/portfolio-alpine.js](../src/components/demos/portfolio-alpine.js)
- [src/components/layout/CommandAskBar.astro](../src/components/layout/CommandAskBar.astro)
- [src/components/layout/TopNav.astro](../src/components/layout/TopNav.astro)
- [src/components/layout/ask-palette.ts](../src/components/layout/ask-palette.ts)
- [src/components/toolkit/ExportBar.astro](../src/components/toolkit/ExportBar.astro)
- [src/components/toolkit/PromptCompiler.astro](../src/components/toolkit/PromptCompiler.astro)
- [src/components/ui/CodeTabs.astro](../src/components/ui/CodeTabs.astro)
- [src/components/ui/MermaidDiagram.astro](../src/components/ui/MermaidDiagram.astro)
- [src/components/ui/MetricStrip.astro](../src/components/ui/MetricStrip.astro)
- [src/components/ui/PreviewFrame.astro](../src/components/ui/PreviewFrame.astro)
- [src/components/ui/SectionRail.astro](../src/components/ui/SectionRail.astro)
- [src/components/ui/StatusBadge.astro](../src/components/ui/StatusBadge.astro)
- [src/components/vault/ReactExample.tsx](../src/components/vault/ReactExample.tsx)
- [src/components/vault/useKitModel.ts](../src/components/vault/useKitModel.ts)
- [src/content.config.ts](../src/content.config.ts)
- [src/content/systems/01-it-ops-helpdesk.mdx](../src/content/systems/01-it-ops-helpdesk.mdx)
- [src/content/systems/02-hr-lifecycle-crm.mdx](../src/content/systems/02-hr-lifecycle-crm.mdx)
- [src/data/command-index.ts](../src/data/command-index.ts)
- [src/data/vault-legacy.ts](../src/data/vault-legacy.ts)
- [src/lib/kernels/bilingualAsk.ts](../src/lib/kernels/bilingualAsk.ts)
- [src/lib/kernels/cleanForWrite.ts](../src/lib/kernels/cleanForWrite.ts)
- [src/lib/kernels/dirtyGuard.ts](../src/lib/kernels/dirtyGuard.ts)
- [src/lib/kernels/flushRows.ts](../src/lib/kernels/flushRows.ts)
- [src/lib/kernels/pooledRatio.ts](../src/lib/kernels/pooledRatio.ts)
- [src/lib/kernels/safeCsv.ts](../src/lib/kernels/safeCsv.ts)
- [src/lib/kernels/sla.ts](../src/lib/kernels/sla.ts)
- [src/lib/vault-sources.ts](../src/lib/vault-sources.ts)
- [src/pages/ai-kit/index.astro](../src/pages/ai-kit/index.astro)
- [src/pages/index.astro](../src/pages/index.astro)
- [src/pages/lab/index.astro](../src/pages/lab/index.astro)
- [src/pages/search-index.json.ts](../src/pages/search-index.json.ts)
- [src/pages/systems/index.astro](../src/pages/systems/index.astro)
- [src/pages/templates/index.astro](../src/pages/templates/index.astro)
- [src/pages/vault/index.astro](../src/pages/vault/index.astro)
- [src/pages/vault/preview/[slug].astro](../src/pages/vault/preview/%5Bslug%5D.astro)
- [src/pages/vault/source/[slug]/[stack].astro](../src/pages/vault/source/%5Bslug%5D/%5Bstack%5D.astro)
- [src/styles/sys01.css](../src/styles/sys01.css)
- [src/styles/tokens.css](../src/styles/tokens.css)
- [src/styles/vault-preview.css](../src/styles/vault-preview.css)
- [src/styles/workbench.css](../src/styles/workbench.css)
- [tests/bilingual-cases.mjs](../tests/bilingual-cases.mjs)
- [tests/contrast.test.mjs](../tests/contrast.test.mjs)
- [tests/grid-guard-cases.mjs](../tests/grid-guard-cases.mjs)
- [tests/kernels.test.mjs](../tests/kernels.test.mjs)
- [tests/register-cases.mjs](../tests/register-cases.mjs)
- [tests/sanitization.test.mjs](../tests/sanitization.test.mjs)
- [tests/saved-views.test.mjs](../tests/saved-views.test.mjs)
- [tests/tier3-kits.test.mjs](../tests/tier3-kits.test.mjs)
- [tests/vault-catalogue.test.mjs](../tests/vault-catalogue.test.mjs)
- [tests/workbench/ask.spec.mjs](../tests/workbench/ask.spec.mjs)
- [tests/workbench/build-livewire-office.mjs](../tests/workbench/build-livewire-office.mjs)
- [tests/workbench/controls-livewire.php](../tests/workbench/controls-livewire.php)
- [tests/workbench/guarded-file-cases.mjs](../tests/workbench/guarded-file-cases.mjs)
- [tests/workbench/guarded-file-livewire.php](../tests/workbench/guarded-file-livewire.php)
- [tests/workbench/guarded-file.browser.mjs](../tests/workbench/guarded-file.browser.mjs)
- [tests/workbench/guarded-file.spec.mjs](../tests/workbench/guarded-file.spec.mjs)
- [tests/workbench/livewire-browser.php](../tests/workbench/livewire-browser.php)
- [tests/workbench/livewire-hooks.browser.mjs](../tests/workbench/livewire-hooks.browser.mjs)
- [tests/workbench/livewire.playwright.config.mjs](../tests/workbench/livewire.playwright.config.mjs)
- [tests/workbench/saved-views-livewire.php](../tests/workbench/saved-views-livewire.php)
- [tests/workbench/sys01.spec.mjs](../tests/workbench/sys01.spec.mjs)
- [tests/workbench/sys02.spec.mjs](../tests/workbench/sys02.spec.mjs)
- [tests/workbench/tier3-livewire.php](../tests/workbench/tier3-livewire.php)
- [tests/workbench/vault-controls.spec.mjs](../tests/workbench/vault-controls.spec.mjs)
- [tests/workbench/vault-primitives-parity.spec.mjs](../tests/workbench/vault-primitives-parity.spec.mjs)
- [tests/workbench/vault-primitives.spec.mjs](../tests/workbench/vault-primitives.spec.mjs)
- [tests/workbench/vault-tier3.spec.mjs](../tests/workbench/vault-tier3.spec.mjs)
- [tests/workbench/vault-tier4.spec.mjs](../tests/workbench/vault-tier4.spec.mjs)
- [tests/workbench/vault.spec.mjs](../tests/workbench/vault.spec.mjs)
- [tests/workbench/verify-livewire.php](../tests/workbench/verify-livewire.php)
- [tests/workbench/verify-tier4-contracts.php](../tests/workbench/verify-tier4-contracts.php)
- [tests/workflow-machines.test.mjs](../tests/workflow-machines.test.mjs)
