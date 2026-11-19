<?php

namespace App\Catalogue;

/**
 * @phpstan-type Workflow array{
 *     id: string,
 *     title: string,
 *     summary: string,
 *     platform: 'claude'|'gemini'|'codex'|'multi-agent',
 *     status: 'planned'|'example-tested',
 *     tags: list<string>,
 *     template: string,
 *     variables: list<array{name: string, label: string, example: string, multiline: bool}>,
 *     sampleOutput: array{before: string, after: string},
 *     setup: array{string, string}
 * }
 */
final class WorkflowVault
{
    /** @var list<Workflow> */
    private const array WORKFLOWS = [
        [
            'id' => 'behavior-preserving-refactor',
            'title' => 'Behavior-preserving refactor',
            'summary' => 'Map the behavior callers depend on and turn a risky cleanup into a reviewable sequence.',
            'platform' => 'claude',
            'status' => 'planned',
            'tags' => ['Refactor', 'Testing', 'PHP'],
            'template' => <<<'PROMPT'
                Plan a behavior-preserving refactor for {{TARGET_STACK}}.

                Target code or paths:
                {{TARGET_CODE}}

                Caller contract and known edge cases:
                {{CALLER_CONTRACT}}

                Trace each allowed caller and cite a file and symbol or a line from the supplied snippet. Record return values, errors, and side-effect order. Flag any caller you cannot inspect. If a contract is ambiguous, ask the smallest question needed to resolve it.

                Return a contract table, the characterization tests to add first, and a sequence of independently reviewable changes. Include an observable check with each change. Keep this pass read-only.
                PROMPT,
            'variables' => [
                ['name' => 'TARGET_STACK', 'label' => 'Target stack', 'example' => 'Laravel 13 and Pest', 'multiline' => false],
                [
                    'name' => 'TARGET_CODE',
                    'label' => 'Target code or paths',
                    'example' => <<<'CODE'
                        // app/Inventory/ReserveStock.php, ReserveStock::handle
                        if ($existing = $this->reservations->findByRequestId($requestId)) {
                            return $existing;
                        }
                        $this->stock->decrementOrThrow($sku, $quantity);
                        $reservation = $this->reservations->create($requestId, $sku, $quantity);
                        StockReserved::dispatch($reservation);
                        return $reservation;

                        // app/Http/Controllers/StockReservationController.php, store
                        try {
                            return new ReservationResource($reserveStock->handle($id, $sku, $quantity));
                        } catch (InsufficientStock) {
                            return response()->json(['error' => 'insufficient_stock'], 409);
                        }
                        CODE,
                    'multiline' => true,
                ],
                ['name' => 'CALLER_CONTRACT', 'label' => 'Caller contract', 'example' => 'A repeated request ID returns the original reservation. Insufficient stock returns 409. Only a new reservation dispatches StockReserved.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'Proposal: Extract validation and event dispatch together. Check the successful reservation.',
                'after' => <<<'OUTPUT'
                    Contract | ReserveStock::handle | Repeat IDs return the original reservation and emit no second event.
                    First guard | Submit the same request ID twice. Assert matching reservation IDs, one stock decrement and one StockReserved event.
                    First change | Extract the repeat-ID lookup. Re-run the guard and the insufficient-stock 409 test before moving validation.
                    OUTPUT,
            ],
            'setup' => [
                'Create .claude/skills/behavior-preserving-refactor/SKILL.md in the project. Add YAML front matter with a description and disable-model-invocation: true, then paste the reusable instructions beneath it.',
                'Run /behavior-preserving-refactor in Claude Code and supply the variable values. For a one-off Claude chat, paste the compiled prompt and include the relevant code snippets.',
            ],
        ],
        [
            'id' => 'migration-compatibility-review',
            'title' => 'Migration compatibility review',
            'summary' => 'Review schema changes across a rolling deploy, with backfill checks and a rollback boundary.',
            'platform' => 'claude',
            'status' => 'planned',
            'tags' => ['Architecture', 'Database', 'Release'],
            'template' => <<<'PROMPT'
                Review the compatibility of this proposed schema change.

                Migration and affected query paths:
                {{SCHEMA_CHANGE}}

                Database and rollout constraints:
                {{ROLLOUT_CONSTRAINTS}}

                Map reads and writes from both application versions against each rollout phase. Cite the supplied migration or query for every claimed incompatibility. Call out any engine-specific locking behavior that needs a staging measurement.

                Return a compatibility matrix, ordered deploy and backfill steps, a measurement or abort condition for each step, and the last safe application rollback point. Surface unknowns with an owner and a next check. Keep the review read-only.
                PROMPT,
            'variables' => [
                ['name' => 'SCHEMA_CHANGE', 'label' => 'Schema change and query paths', 'example' => "Rename parcels.status to delivery_status.\nDispatchParcel writes status. ParcelDashboard reads status.", 'multiline' => true],
                ['name' => 'ROLLOUT_CONSTRAINTS', 'label' => 'Rollout constraints', 'example' => 'MySQL 8.4, 2 million rows, rolling web deploy, and old workers may run for 20 minutes.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'Rename parcels.status during deploy. Roll back to the old app if the health check fails.',
                'after' => <<<'OUTPUT'
                    Mixed fleet | Direct rename breaks DispatchParcel on old workers. Add delivery_status alongside status first.
                    Cutover gate | Drain old workers, backfill in batches, and verify zero mismatches before switching reads.
                    Rollback boundary | Keep both columns and writes synchronized during the rollback window. Dropping status ends old-version rollback.
                    OUTPUT,
            ],
            'setup' => [
                'Create .claude/skills/migration-compatibility-review/SKILL.md. Add YAML front matter with a description and disable-model-invocation: true, then paste the reusable instructions beneath it.',
                'Run /migration-compatibility-review in Claude Code with the proposed migration, affected paths, and rollout constraints. Use a sanitized diff or fictional example.',
            ],
        ],
        [
            'id' => 'ui-state-spec',
            'title' => 'UI state specification',
            'summary' => 'Turn a short product brief into a state table with copy, keyboard behavior and acceptance checks.',
            'platform' => 'gemini',
            'status' => 'example-tested',
            'tags' => ['UX', 'Accessibility', 'Testing'],
            'template' => <<<'PROMPT'
                Specify interaction states for this flow:
                {{PRODUCT_FLOW}}

                Existing components and constraints:
                {{DESIGN_CONSTRAINTS}}

                Map the relevant initial, pending, empty, success, recoverable error, and repeat-action states. For every state, specify the triggering event, visible copy, available action, focus behavior, and any screen-reader announcement. Use the named components. Mark product decisions that need approval.

                Return the state table and up to five given/when/then acceptance checks. Include a keyboard-only path and one small-screen failure case. Explain which fixture should trigger each non-default state.
                PROMPT,
            'variables' => [
                ['name' => 'PRODUCT_FLOW', 'label' => 'Product flow', 'example' => 'On a team settings page, invite a teammate by email. An address may already have an open invitation.', 'multiline' => true],
                ['name' => 'DESIGN_CONSTRAINTS', 'label' => 'Design constraints', 'example' => 'Use InlineNotice, the existing email field, and the primary button. German and Arabic are supported at 320 px.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'Invitation failed. Press Submit again.',
                'after' => <<<'OUTPUT'
                    Duplicate | Server returns invite_pending | “An invitation is already pending for this email.”
                    Action | Keep the email and offer “View pending invitations.” Keep focus on the submit button and announce the notice once.
                    Check | Given an existing invitation, submit by keyboard at 320 px. The notice wraps, the action stays visible, and the second submission creates zero invitations.
                    OUTPUT,
            ],
            'setup' => [
                'In Gemini on the web, use Customize → Skills → Create manually, or Gems → New Gem if your account still offers it. Name it UI state specification, paste the reusable instructions, and finish creation.',
                'Select your skill in a new Gemini chat using the skill picker, or open the saved Gem. Supply a fixture brief and the names of the design-system components to use.',
            ],
        ],
        [
            'id' => 'support-incident-update',
            'title' => 'Support incident update',
            'summary' => 'Draft a customer update and an internal handoff from a sparse, timestamped incident timeline.',
            'platform' => 'gemini',
            'status' => 'example-tested',
            'tags' => ['Operations', 'Communication', 'Debug'],
            'template' => <<<'PROMPT'
                Draft an incident update for {{AUDIENCE}} from the facts below.

                Timestamped timeline and known impact:
                {{INCIDENT_TIMELINE}}

                Confirmed actions and owners:
                {{CONFIRMED_ACTIONS}}

                Produce two drafts. The customer update should state the affected action, the confirmed scope, a verified workaround if one exists, and the next update time in the supplied time zone. The internal handoff should pair each claim with a timeline item and list open questions with a proposed owner.

                Label any scope estimate, suspected cause, or recovery time that is still unverified. Preserve event times, drop internal identifiers from the customer draft, and leave sending to the human reviewer.
                PROMPT,
            'variables' => [
                ['name' => 'AUDIENCE', 'label' => 'Audience', 'example' => 'Workspace admins waiting for a CSV export', 'multiline' => false],
                ['name' => 'INCIDENT_TIMELINE', 'label' => 'Timeline and known impact', 'example' => "09:12 UTC: large CSV exports began timing out.\n09:20 UTC: EU workspace affected in the confirmed report. Other regions unverified.", 'multiline' => true],
                ['name' => 'CONFIRMED_ACTIONS', 'label' => 'Confirmed actions and owners', 'example' => 'Operations owns scope checks. Support confirmed that exporting seven-day ranges succeeds. The next update is at 09:45 UTC.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'Exports are broken everywhere. We should have this fixed shortly.',
                'after' => <<<'OUTPUT'
                    Customer | Large CSV exports are timing out for a confirmed EU workspace. If you need an export now, try a date range of seven days or less. Our next update is at 09:45 UTC.
                    Handoff | The 09:20 report supports the EU workspace claim. Operations will check regional scope and confirm whether the workaround holds for additional workspaces.
                    OUTPUT,
            ],
            'setup' => [
                'In Gemini on the web, use Customize → Skills → Create manually, or Gems → New Gem if your account still offers it. Name it Support incident update, paste the reusable instructions, and finish creation.',
                'Open the Gem or select the skill in a fresh chat. Supply sanitized timeline entries, scope, and the next update time. Check both drafts against your source before sharing.',
            ],
        ],
        [
            'id' => 'flaky-test-triage',
            'title' => 'Flaky test triage',
            'summary' => 'Trace an intermittent failure to a discriminating check before spending time on a fix.',
            'platform' => 'codex',
            'status' => 'example-tested',
            'tags' => ['Debug', 'Testing', 'CLI'],
            'template' => <<<'PROMPT'
                Triage this intermittent test failure using local repository evidence.

                Test target and runner:
                {{TEST_TARGET}}

                Sanitized failure log:
                {{ERROR_LOG}}

                Known conditions and relevant source or test script excerpts:
                {{RUN_CONDITIONS}}

                Trace test setup, shared state, async boundaries, and cleanup. Separate observations from explanations. Rank up to three hypotheses and give each a file and symbol, the smallest check that distinguishes it from the alternatives, and the outcome that would disprove it.

                Return the order and exact commands for a targeted test run based on the available repository scripts or excerpts. Keep this pass read-only. Record which checks still need a human to run them.
                PROMPT,
            'variables' => [
                ['name' => 'TEST_TARGET', 'label' => 'Test target and runner', 'example' => 'tests/browser/invite.spec.ts in Playwright', 'multiline' => false],
                ['name' => 'ERROR_LOG', 'label' => 'Sanitized failure log', 'example' => "Expected: Invitation sent\nReceived: An invitation already exists\nTimeout: 5000 ms", 'multiline' => true],
                [
                    'name' => 'RUN_CONDITIONS',
                    'label' => 'Run conditions and source',
                    'example' => <<<'CODE'
                        Passes in isolation. Fails during parallel CI runs. The tests use the same seeded workspace and setup does not clear invitations.
                        tests/browser/invite.spec.ts, inviteMember: await inviteMember(page, 'invitee@example.test');
                        tests/browser/invite-existing.spec.ts, seedInvite: await seedInvite('invitee@example.test');
                        package.json scripts: { "test:browser": "playwright test" }
                        CODE,
                    'multiline' => true,
                ],
            ],
            'sampleOutput' => [
                'before' => 'Try raising the assertion timeout to 15 seconds.',
                'after' => <<<'OUTPUT'
                    Observed | The request finishes with a duplicate-invite response. More waiting cannot change that response.
                    First hypothesis | Both invite specs use the same email and seeded workspace. Compare the pair with --workers=1 and --workers=2 before editing.
                    Falsifier | If failures persist with distinct emails and clean tenants, trace the backend duplicate predicate next.
                    OUTPUT,
            ],
            'setup' => [
                'With the Codex CLI installed and signed in, enter the repository and run codex --sandbox read-only.',
                'Paste the compiled prompt at the Codex input. Confirm proposed commands against package scripts, then run the smallest discriminating check in your test environment.',
            ],
        ],
        [
            'id' => 'bundle-regression-review',
            'title' => 'Bundle regression review',
            'summary' => 'Use a build report and entry-point imports to explain a JavaScript budget regression.',
            'platform' => 'codex',
            'status' => 'example-tested',
            'tags' => ['Performance', 'Refactor', 'CLI'],
            'template' => <<<'PROMPT'
                Trace the JavaScript payload regression on {{PAGE_OR_ENTRY}}.

                Comparable build metrics and relevant import excerpts:
                {{BUILD_REPORT}}

                Load-time requirements and budget:
                {{PERFORMANCE_BUDGET}}

                Inspect the supplied report and import excerpts, and use local build artifacts when available. Rank candidates by measured size where the report supports it. Distinguish first-load chunks, shared dependencies, and code loaded on interaction. If a manifest or comparable metric is unavailable, state the evidence needed before assigning a cause.

                Return one import chain with file references, a minimal change proposal, and a before-and-after measurement plan that uses the same route, build mode, compression and cache state. Keep this pass read-only.
                PROMPT,
            'variables' => [
                ['name' => 'PAGE_OR_ENTRY', 'label' => 'Page or entry', 'example' => '/reports, resources/js/pages/Reports.tsx', 'multiline' => false],
                [
                    'name' => 'BUILD_REPORT',
                    'label' => 'Build report and imports',
                    'example' => <<<'CODE'
                        Baseline: Reports.js 68 kB gzip. Current: Reports.js 117 kB gzip. Both production builds use the same gzip level.
                        resources/js/pages/Reports.tsx: import { exportRows } from '../report-export'; exportRows is used only on the Export click.
                        resources/js/report-export.ts: import { writeWorkbook } from 'workbook-tools';
                        The manifest shows report-export is eagerly imported. Package-level size attribution is unavailable.
                        CODE,
                    'multiline' => true,
                ],
                ['name' => 'PERFORMANCE_BUDGET', 'label' => 'Performance budget', 'example' => 'Initial route JavaScript budget is 90 kB gzip. CSV export can load on first click.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'The build is bigger. Replace the spreadsheet and chart libraries.',
                'after' => <<<'OUTPUT'
                    Evidence | Reports.js grew by 49 kB gzip against a 90 kB first-load budget.
                    Candidate | Reports.tsx → report-export.ts → spreadsheet library. Confirm attribution in the manifest.
                    Smallest proposal | Load report-export.ts on export click. Measure the first-load gzip total and verify the first export with a cold cache.
                    OUTPUT,
            ],
            'setup' => [
                'Collect comparable production build reports, then run codex --sandbox read-only from the repository with the reports available locally.',
                'Paste the compiled prompt and review the import chain. Validate the proposed change in a separate build using the same measurement settings.',
            ],
        ],
        [
            'id' => 'architecture-decision-panel',
            'title' => 'Architecture decision panel',
            'summary' => 'Get independent delivery, operations and data reviews before recording an architecture decision.',
            'platform' => 'multi-agent',
            'status' => 'example-tested',
            'tags' => ['Architecture', 'Planning', 'Multi-Agent'],
            'template' => <<<'PROMPT'
                Coordinate a read-only review of this architecture decision:
                {{DECISION_BRIEF}}

                Options and available evidence:
                {{CANDIDATE_OPTIONS}}

                Constraints and decision deadline:
                {{DECISION_CONSTRAINTS}}

                Give three independent reviewers the same brief. Delivery assesses change scope, migration effort, and reversibility. Operations assesses support, observability, and cost. Data assesses consistency, ownership, and recovery. Each returns a preferred option, one evidence-backed risk, and one unresolved question before seeing the other reports.

                As the coordinator, reconcile the reports into a draft decision record. Include the recommendation, decisive constraint, dissent, evidence gaps, and a reversible experiment with an owner and acceptance threshold. Leave the final decision to the requester.
                PROMPT,
            'variables' => [
                ['name' => 'DECISION_BRIEF', 'label' => 'Decision brief', 'example' => 'Choose how to queue nightly invoice summaries as volume grows from 500 to 6,000 jobs.', 'multiline' => true],
                ['name' => 'CANDIDATE_OPTIONS', 'label' => 'Candidate options', 'example' => "A: Keep the existing database queue.\nB: Introduce a managed queue.\nCurrent drain time for 500 jobs is 3 minutes.", 'multiline' => true],
                ['name' => 'DECISION_CONSTRAINTS', 'label' => 'Decision constraints', 'example' => 'Two maintainers, one week for a decision, 20-minute delivery window, and duplicate messages must never bill customers.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'Choose a managed queue because it scales better.',
                'after' => <<<'OUTPUT'
                    Provisional decision | Benchmark the existing queue. The only baseline is 500 jobs in 3 minutes. A linear projection of 36 minutes exceeds the 20-minute window.
                    Fallback | Operations would switch to a managed queue if the current one fails the drain or database latency test. Data still needs a durable billing idempotency key.
                    Experiment | The billing maintainer replays 6,000 jobs under representative load. Require a drain within 20 minutes, zero duplicate invoices on replay, and an agreed query-latency budget.
                    OUTPUT,
            ],
            'setup' => [
                'Open a coordinator session in an assistant with subagents. If delegation is unavailable, open three separate reviewer chats with the same brief and one assigned role per chat.',
                'Collect independent reports, then give them to the coordinator to reconcile. Compare the draft decision and proposed experiment with your original constraints.',
            ],
        ],
        [
            'id' => 'feature-release-review',
            'title' => 'Feature release review',
            'summary' => 'Combine independent implementation, user-path and QA reviews into a release decision with evidence.',
            'platform' => 'multi-agent',
            'status' => 'example-tested',
            'tags' => ['UX', 'Release', 'Testing', 'Multi-Agent'],
            'template' => <<<'PROMPT'
                Coordinate independent readiness reviews of {{FEATURE_SCOPE}}.

                Acceptance criteria and test evidence:
                {{ACCEPTANCE_EVIDENCE}}

                Release guardrails and rollback:
                {{RELEASE_GUARDRAILS}}

                Ask the implementation reviewer to trace contracts and side effects, the user-path reviewer to check keyboard, error and small-screen paths, and the QA reviewer to map each criterion to a passing check or a reproducible gap. Give each reviewer the same evidence and require citations to a check result, file, or fixture.

                Reconcile findings into a release recommendation, a short list of blockers with owners and verification steps, and the rollback trigger. Treat untested behavior as unknown. Keep the review read-only and leave release execution to the requester.
                PROMPT,
            'variables' => [
                ['name' => 'FEATURE_SCOPE', 'label' => 'Feature scope', 'example' => 'New bulk archive flow in the orders dashboard, behind a feature flag', 'multiline' => false],
                ['name' => 'ACCEPTANCE_EVIDENCE', 'label' => 'Acceptance criteria and evidence', 'example' => "Mouse happy path passed for two open orders.\nMixed eligibility must report each skipped order.\nThe confirmation dialog must restore keyboard focus.", 'multiline' => true],
                ['name' => 'RELEASE_GUARDRAILS', 'label' => 'Release guardrails', 'example' => 'Start with internal workspaces. Disable the flag immediately if an order outside the selection is archived.', 'multiline' => true],
            ],
            'sampleOutput' => [
                'before' => 'The demo worked. Ship to internal workspaces.',
                'after' => <<<'OUTPUT'
                    Recommendation | Hold the internal pilot. Only the mouse path for two open orders has passed.
                    QA and implementation | Select one open and two archived orders. Confirm both skipped IDs are reported, only the open order changes, and an unselected control order stays untouched.
                    UI | Close the confirmation with Escape and verify focus returns to the bulk action. Check that the skipped-order message is readable and announced at narrow widths.
                    Rollback | Disable the flag if audit events contain any order ID outside the submitted selection.
                    OUTPUT,
            ],
            'setup' => [
                'Give the compiled prompt to a coordinating assistant. Use three independent reviewer sessions if the assistant cannot delegate.',
                'Supply the same acceptance criteria and test evidence to every reviewer. Hand their reports to the coordinator and verify its blocker checks before enabling the flag.',
            ],
        ],
    ];

    /** @return list<Workflow> */
    public function all(): array
    {
        return self::WORKFLOWS;
    }
}
