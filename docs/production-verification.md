# Production verification

On November 23, 2026, the complete browser suite passed **61 of 61 tests in 1.4 minutes** against the local production preview. The final Astro check examined 56 files and reported **0 errors, 0 warnings and 0 hints**. The final build generated 20 static HTML pages, a search index and 16 raw Markdown source downloads.

| Phase | Static HTML pages | Gate results |
| --- | ---: | --- |
| 1 · Workbench and CV | 2 | Six browser tests passed. International and DACH each exported one text-selectable A4 page. The DACH portrait, private employer override, print controls, theme persistence, keyboard navigation and 375px layout were checked. |
| 2 · Systems and sandboxes | 6 | All 20 cumulative browser tests passed. Checks covered six resets, service-desk timestamps, alert deduplication, HR approval and refunds, attendance credits, original contract terms, pooled KPI math and funding health updates. |
| 3 · Component vault | 17 | All 31 phase-specific browser tests passed across four files. Coverage included Alpine and React interactions, viewport and direction controls, local themes and code copying. The isolated Laravel 13 and Livewire 4 runtime also rendered all 10 Blade views and exercised a server action for each component. |
| 4 · Toolkit, templates, lab and Ask bar | 20 | Ten new browser tests passed across four files. They covered all 11 prompt compilers, 22 clipboard copies, 22 prompt downloads, five templates, four prototypes and keyboard intent navigation. |

Each phase passed `npx astro check` and `npm run build`. The gate commands below ran against the built site.

```sh
# Phase 1
npm run test:workbench -- phase1.spec.mjs

# Phase 2, including the Phase 1 regressions
npm run test:workbench -- --output=test-results/gate2

# Phase 3
npm run test:workbench -- vault.spec.mjs --output=test-results/vault-shell --max-failures=2
npx playwright test --config playwright.workbench.config.mjs vault-queues --output=test-results/vaultqueues
npm run test:workbench -- vault-forms.spec.mjs --output=test-results/vaultforms
npm run test:workbench -- vault-workflow.spec.mjs --output=test-results/vaultworkflow
php tests/workbench/verify-livewire.php

# Phase 4
npm run test:workbench -- ai-kit.spec.mjs --output=test-results/ai-kit
npm run test:workbench -- templates.spec.mjs --output=test-results/templates
npm run test:workbench -- lab.spec.mjs --output=test-results/lab
npx playwright test --config playwright.workbench.config.mjs ask.spec --output=test-results/ask

# Final production checks
npx astro check
npm run build
npm run test:workbench
python scripts/audit-public.py
git diff --check
```

The final browser command used `PLAYWRIGHT_WORKBENCH_URL=http://127.0.0.1:4340`. Chromium drove the built pages. Poppler checked PDF page size, count and text. The PHP check used an isolated runtime in `test-results/livewire-runtime`.

The sanitization and link audit passed for 237 publishable Git files and 81 files in the static export. It checked 578 references across 20 HTML pages and 14 CSS asset references. All 16 original Markdown downloads matched their sources. It found zero credential signatures, unapproved public contacts, private application URLs, implementation stubs or broken internal references. Fixture comparison covers all six supplied datasets and all three ER diagrams. Ownership, impact and deployment history are attributed to the supplied handoff.

The retained Laravel catalogue passed `npm run build:catalogue`, `npm run lint`, `npm run format:check`, `npm run test:kit` (4 tests), `composer test` (9 tests, 288 assertions), `composer analyse` and `npm run test:browser -- --output=test-results/catalogue-regression` (22 browser tests).

## Fixture interpretation

The leave fixture contains a 24-hour open annual request and a 16-hour pending balance. On reset the desk reconciles the working ledger to the recorded 24-hour reservation. The original JSON stays verbatim. The estate monitor presents organization-wide aggregates in the all-branches view. KPI history shows missing readings where the fixture supplies only a reporting-cutoff snapshot.
