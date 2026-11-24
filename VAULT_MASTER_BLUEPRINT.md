# Youssef Operations Kit — Master Component Vault & Design DNA Upgrade Blueprint

> **Repository:** `https://github.com/youss8/youssef-operations-kit` (MIT License)
> **Purpose:** Authoritative upgrade specification merging and deduplicating **97 extracted UI/UX components** across Youssef Kharbout's three audited enterprise platforms — **Project Tracking (44)**, **IT Helpdesk (28)**, and **Pre-RMS HR Core (25)** — into **1 Unified Design DNA**, **strict `[observed]` vs. `[spec]` honesty patches**, and **20 curated, non-overlapping staff-grade Component Vault blueprints** spanning Tiers 1–4.
> **Target Audience:** Existing base Astro 5 + Tailwind CSS v4 + Alpine.js 3 + React 19 repository built from `HANDOFF_MASTER_SPEC.md`. Preserve all existing working routes, Archival Stone & Deep Forest tokens, and CV/Profile rules while upgrading design craft, accuracy, component depth, and automated unit tests.

---

## 0. Merge Strategy & Honesty Guardrails

1. **Deduplication Over Bloat:** Rather than dumping 97 repetitive cards onto `/vault`, overlapping patterns across the three repos are consolidated into **20 high-signal, zero-duplicate engineering kits** across 4 complexity tiers (`T1 = 5`, `T2 = 6`, `T3 = 5`, `T4 = 4`).
2. **Strict `[observed]` vs. `[spec]` Transparency:**
   - Every Vault card displays a concise provenance chip (`Observed in Codebase` vs. `Observed + Clean-Room [spec]`) so Youssef can defend every single feature honestly in technical interviews.
   - **Zero Recruitment (RMS) Leakage:** Every HR pattern originates strictly from Youssef's **pre-RMS core ownership** (Org Structure, Employee Profiles, Contracts/`asSigned()`, Leave Pricing, Attendance Timesheets, Work Inbox, Draggable Dashboard, Shared UI Kit).
3. **Clean-Room & Sanitization Lock:** Zero real organization names, branch/city names, staff names, proprietary source code, or public CDN runtime imports. All data contracts are 100% fictional enterprise SaaS JSON.

---

## 1. Unified Design DNA (Global Upgrade Rules for `youssef-operations-kit`)

Keep the locked **Light-Default Archival Stone & Deep Forest** palette (`#F4F5F4` canvas, `#FFFFFF` surface, `#DCDFD9` hairline, `#101412` ink, `#0F5C4A` Deep Spruce accent; Dark toggle `#0B0F0E` / `#121816` / `#34D399`) and **`Plus Jakarta Sans` + `JetBrains Mono`** typography from `HANDOFF_MASTER_SPEC.md`, and layer these **9 engineering-grade UX laws** synthesized from all three repositories globally across the site:

| # | Design DNA Law | Concrete Implementation Rule |
| :---: | :--- | :--- |
| **1** | **Palette Lock & Data-Only Status Color** | Status colors (`ok`, `warn`, `crit`) are strictly for live data signals—never for navigation chrome or decorative gradients. In dark mode, communicate elevation with a crisp `1px` inset top highlight rather than heavy shadows. **Zero never carries an alarm tone** (`value === 0` always renders neutral). |
| **2** | **Color Is Never the Only Channel** | Every state pairs at least two channels (**Shape + Glyph + Word**): glyphs `■` critical, `◐` warn, `●` ok, `○` neutral; badge shapes `solid` (active/critical), `surface` (done/ok), `outline` (needs action), `dashed` (on hold/skipped/draft); risk/ratings read as words (`"Likelihood: High"`). |
| **3** | **Semantic Type Roles & Structural RTL** | Enforce 5 semantic roles (`figure` 1.75rem/700 `tabular-nums`, `heading`, `body` .875rem/1.55, `meta` .75rem, `label` .6875rem uppercase +.08em). Use CSS logical properties only (`ms-/me-/ps-/pe-/start-/end-`, `text-start`), `rtl:-scale-x-100` on directional icons, `<bdi>` around dates/numbers, and **disable `uppercase` and letter-tracking under `:lang(ar)`** (joined script, slightly taller `1.7` line-height). |
| **4** | **Failure Honesty & Null ≠ Zero** | A failed data fetch never renders as a calm empty state or fake `0`—always show an inline `role="alert"` error card with reasons and a Retry button, or drop failed digest sources while surfacing an `"incomplete"` note. `null` renders `—` with `aria-label="not set"`, never `0`. |
| **5** | **150ms Anti-Flicker Loading & `keepPreviousData`** | Apply an instant busy cursor on interaction, but delay visual pending opacity (`data-loading`) by **150ms** so fast updates never flicker. Keep previous table/filter rows visible while updating rather than flashing skeletons mid-triage. |
| **6** | **Draft-Then-Commit & Normalized Dirty Guards** | Complex filters, layout customization, and rule editors mutate a local draft and commit in one action (`Esc`/Cancel drops cleanly). Modal dirty checks normalize values (`5 === "5" === " 5 "`, `"001" !== "1"`, multi-select IDs compared as sets). |
| **7** | **Performance Doctrine** | Share **one** floating popover + memoized JSON options store across N rows instead of mounting N popovers; cap rendered rows; lazy-`import()` heavy libraries (Mermaid, XLSX/DOCX viewers); enforce a pending-ID lock against double drag-and-drop; maintain pure DOM-free layout/domain modules. |
| **8** | **Security-by-UI Patterns** | Withheld/redacted fields are omitted from the payload and shown as an explanatory lock notice—**never** a disabled input. Destructive/privileged confirmations default focus to `Cancel` (or typed-confirmation input) so stray `Enter` never deletes. CSV exports neutralize formula injection (`= + - @ \t \r`) and prepend a UTF-8 BOM from code point `\uFEFF`. |
| **9** | **Motion, Touch Targets & Arithmetic Contrast** | Single calm easing curve (`cubic-bezier(.25,.8,.25,1)` 220ms), `prefers-reduced-motion` disables count-up/FLIP/pulse globally, minimum `44px` (`min-h-11`) touch targets on mobile, and a **Node unit test verifying WCAG 2.2 AA contrast ratios** (`≥4.5:1` text, `≥3:1` UI boundaries) directly against `src/styles/tokens.css`. |

---

## 2. Mandatory Honesty & Accuracy Patches (Update Existing Case Studies & Sandboxes)

Before adding the upgraded Vault, patch these exact details in `src/content/systems/` and `src/components/demos/` so 100% of claims match observed repository reality:

### 2.1 System 01 (`SYS-01` — IT Operations & Asset Helpdesk · 100% Solo)
- **Ticket Detail Interaction (`01-it-ops-helpdesk.mdx` + `ServiceDeskDemo.tsx`):**
  - Update case-study copy and `ServiceDeskDemo.tsx` to accurately present the **inline expanding table row** synced to `?ticket=<id>` (relaxing active filters so deep links always surface their target), instead of claiming a slide-in drawer as shipped.
  - Keep a slide-in drawer optional solely as a clearly labeled `[spec]` toggle or Vault enhancement.
- **Bulk Action Bar:** Render inline in the panel header when `selected > 0` (matching observed code), rather than claiming a floating slide-in bar as shipped.
- **Audit History Distinction:** Keep the immutable field-level JSONB `record_history` trigger clearly in the **PostgreSQL Backend Architecture** section, while stating honestly in the UI section that the observed frontend renders a **message-based audit timeline** (and labeling visual JSONB before/after diffs as a clean-room Vault `[spec]`).
- **Copilot, Hierarchy & Checklist Honesty:**
  - Describe the AI Copilot accurately as a **full-page chat** using per-table safe-select degradation (explicit data-sharing consent drawer is a `[spec]` upgrade).
  - Describe the Hierarchy Explorer as **delete-only** (retire-vs-delete is `[spec]`), and the Checklist Runner as **request-confirmed** rather than optimistic.
  - Highlight **Formula-Safe CSV Export**, **RFC-4180 Normalized-Header Importer**, **Part-Based `{text, values}` Bilingual Formatters**, and **Arithmetic WCAG Contrast Testing** in System 01's engineering highlights.

### 2.2 System 02 (`SYS-02` — HR Lifecycle Platform · Pre-RMS Core · 3-Dev Team)
- **Org Chart Export Hygiene:** Ensure the clean-room Org Chart Vault component bundles any export helper locally or uses native SVG-to-Canvas export—**never** dynamically load libraries from a public CDN at runtime.
- **Profile Change Diff & Leave Exclusion Chips:** Clearly mark the side-by-side `before → after` Profile Change Request diff and visual day-by-day exclusion chips as `[spec]` clean-room enhancements built atop the observed server contracts (`proposed` values and `quote.excludedDates`).
- **Pre-RMS Boundary Check:** Confirm zero Recruitment / RMS components, tables, or demo controls appear anywhere in `SYS-02` or `/vault`.

---

## 3. Master Deduplicated Component Vault (20 Staff-Grade Kits · Tiers 1–4)

Upgrade `/vault` so visitors can filter by **Complexity Tier** (`All` | `T1 Primitives` | `T2 Controls & Guards` | `T3 Workflows` | `T4 Flagship Engines`), **Vault Category** (`Tables & Queues` | `Workflows & State` | `Forms & Guards` | `Data Visualization` | `Navigation & Shell`), **Source System** (`SYS-01 IT` | `SYS-02 HR` | `SYS-03 PT` | `Cross-System`), and **Keyword Search**.

Every single kit wraps in `PreviewFrame.astro` (`Desktop 100%` / `Tablet 768px` / `Mobile 375px` · Isolated `Light / Dark` · Live `LTR / RTL`) + `CodeTabs.astro` (4 Shiki-highlighted copyable tabs: `Live Preview`, `Tailwind v4 + Alpine.js`, `React 19 + TypeScript`, `Laravel 13 + Livewire 4 [PHP + Blade]`) + a provenance badge (`Observed` / `Observed + [spec]`).

---

### TIER 1 — Atomic Primitives & Data Display (5 Kits)

#### 01. Color-Independent Status, Glyph & Urgency Vocabulary (`status-tone-vocabulary`)
- **Tier / Category / Provenance:** `T1` · `Data Visualization` · `Cross-System [Observed]` (Merges PT #5/#7, IT #2/#4, HR #1/#2)
- **Anti-Template Signal:** Separates **state** (`work` solid, `done` surface, `attn` 1.5px outline, `stop` dashed, `wait` hairline card) from **urgency** (`act`, `late`, `rush`, `soft`) and pairs every status with a glyph (`■ ◐ ● ○`) and word rating (`"Likelihood: High"`). Lenient reader maps legacy priority aliases (`urgent`→`Critical`) and sorts unknown values last without throwing; strict writer rejects invalid values.
- **Interactive Preview:** Matrix switcher toggling Light/Dark, LTR/RTL, and grayscale simulation filter (`filter: grayscale(1)`) proving 100% legibility without color, plus live lenient-vs-strict priority parser input.
- **Data Contract:**
```json
{
  "states": [
    { "key": "work", "shape": "solid", "glyph": "●", "label": "In Progress", "held": true },
    { "key": "done", "shape": "surface", "glyph": "✓", "label": "Approved", "held": false },
    { "key": "attn", "shape": "outline", "glyph": "◐", "label": "Needs Review", "urgency": { "variant": "rush", "label": "Starts in 2d" } },
    { "key": "stop", "shape": "dashed", "glyph": "■", "label": "Blocked", "urgency": { "variant": "late", "label": "Overdue" } }
  ],
  "rating": { "kind": "Likelihood", "level": 3, "word": "High" }
}
```
- **Dual-Stack Blueprint:** Pure `toneMap` + `rankPriority(raw)` in TS/Alpine; `HasStatusTone` enum interface + `<x-ui.status-chip>` in Laravel 13/Livewire 4.

#### 02. Two-Band Progress (Over-Delivery Flip) & SLA Drain Cell (`two-band-progress-sla`)
- **Tier / Category / Provenance:** `T1` · `Data Visualization` · `SYS-01 + SYS-03 [Observed]` (Merges PT #1/#2 + IT #1)
- **Anti-Template Signal:** Combines two real production progress patterns: (a) **Two-Band + Over-Delivery Progress** where approved solid + pending hatched bands never inflate validated %, over-delivery (`>100%`) clamps visually and flips tone to warn with `"Over by 18%"`, and `null` renders `—` instead of `0%`; (b) **SLA Drain Cell** with a **2% minimum bar floor** so freshly opened tickets never read as "no data", part-based `{amount} overdue / left` phrasing for Arabic word order, and closed/missing-SLA safe fallbacks.
- **Interactive Preview:** Sliders to test `null`, `0%`, `1%` (shows 2% floor), `75% + 12% pending`, and `118%` over-delivery, plus a live SLA countdown scrub slider (`48h left → 1h closing → 30m overdue`).
- **Data Contract:**
```json
{
  "kpi": { "label": "Site visits delivered", "approved": 118, "pending": 6, "max": 100 },
  "sla": { "status": "In Progress", "priority": "High", "created_at": "2026-03-02T08:00:00Z", "sla_due_at": "2026-03-02T16:00:00Z", "now": "2026-03-02T14:40:00Z" }
}
```
- **Dual-Stack Blueprint:** Pure `slaState()`, `slaElapsedPercent()` (2% floor), `durationParts()` (unit-tested in Node); Livewire computed property + `wire:poll.30s` island.

#### 03. Currency-Guard Money & Hours Balance Strip (`currency-guard-balance`)
- **Tier / Category / Provenance:** `T1` · `Data Visualization` · `SYS-02 + SYS-03 [Observed + spec bar]` (Merges PT #4 + HR #3)
- **Anti-Template Signal:** Domain invariants built into primitives: **Currency-Guard Money** throws if `currency` is missing and never sums USD + EUR together; **Hours Balance Strip** tracks `deserved + overtimeCredit - used - pending = remaining`, hides `pending` when zero, surfaces negative balances plainly, and stacks cleanly on phones so `"41d 1h 52m"` never clips.
- **Interactive Preview:** Toggle attempting to mix currencies (shows guard refusal + per-currency split), plus interactive hours calculator with Overtime Credit and Pending toggles.
- **Data Contract:**
```json
{
  "money": [{ "amount": 125000.5, "currency": "EUR" }, { "amount": 420000, "currency": "USD" }],
  "balance": { "unit": "hours", "hoursPerDay": 8, "deserved": 120, "used": 40, "pending": 16, "overtimeCredit": 8 }
}
```
- **Dual-Stack Blueprint:** Strict `formatMoney(amount, currency)` throwing on empty code + `deriveBalance()` selector; PHP backed `Currency` enum + server pricing service.

#### 04. Zero-Safe Signal KPI Tiles & Segmented Status Strip (`zero-safe-signal-tiles`)
- **Tier / Category / Provenance:** `T1` · `Data Visualization` · `SYS-01 + SYS-03 [Observed]` (Merges PT #8/#9/#11 + IT #3/#17)
- **Anti-Template Signal:** Encodes the rule that **zero never carries an alarm tone** (`tone = value === 0 ? 'neutral' : tile.tone`) so a calm morning doesn't light up the dashboard. Tiles and segmented status-strip chips double as `aria-pressed` filter buttons computed over the *whole* dataset ("way back out of a filter"), with `"Showing 4 of 12 · Show all"` polite live announcements and reduced-motion-safe count-up.
- **Interactive Preview:** Interactive tile row + stacked 10px status strip (2% min segment width) with `"Zero Out Breaches"` button proving alarm styling vanishes immediately at `0`.
- **Data Contract:**
```json
{
  "tiles": [
    { "id": "active", "label": "Active queue", "value": 42, "tone": "neutral" },
    { "id": "breached", "label": "SLA breached", "value": 3, "tone": "critical" },
    { "id": "missing", "label": "Missing assets", "value": 0, "tone": "warn" },
    { "id": "unassigned", "label": "Unassigned", "value": 9, "tone": "warn" }
  ]
}
```
- **Dual-Stack Blueprint:** React/Alpine `activeSlice` + `toggle(id)` + `countUp()` (skipped under `prefers-reduced-motion`); Livewire `#[Computed]` parallel counts + `wire:click="toggleSlice"`.

#### 05. Redacted Pay Placeholder (By Omission) & 10-State Day Chip (`redacted-pay-day-state`)
- **Tier / Category / Provenance:** `T1` · `Forms & Guards` · `SYS-02 [Observed]` (Merges HR #4 + HR #5)
- **Anti-Template Signal:** Real security-by-omission UX: restricted roles (even an all-permissions Platform Admin by name) never receive salary values in the DOM and never see a disabled input—instead they see a bordered lock notice while server saves preserve the stored value untouched. Paired with HR's **10-state attendance day-cell vocabulary** where 0-punch and 1-punch days assume nothing until human-resolved.
- **Interactive Preview:** Role toggle (`HR Manager` vs `Platform Admin`) showing live DOM omission + preserved payload preview on save, alongside interactive 10-state day cells (`worked`, `one_punch`, `no_record`, `decided_absent`, `leave_pending`, `holiday`, `weekend`, `worked_on_day_off`).
- **Data Contract:**
```json
{
  "viewer": { "role": "Platform Admin", "canViewPay": false },
  "contract": { "title": "Operations Analyst", "pay": null, "payWithheld": true },
  "day": { "date": "2026-03-10", "kind": "one_punch", "first": "08:02", "last": null, "decidable": true }
}
```
- **Dual-Stack Blueprint:** Omit `pay` key from form submit payload when `payWithheld === true`; Laravel `canViewPay()` gate + Form object preserving stored value on save.

---

### TIER 2 — Composite Controls, Tables & Guards (6 Kits)

#### 06. Shared Options Store & Single Row Popover (`shared-options-popover`)
- **Tier / Category / Provenance:** `T2` · `Tables & Queues` · `SYS-03 [Observed]` (PT #27)
- **Anti-Template Signal:** Pure frontend performance architecture: replaces `20 rows × 200 assignees = 4,000` duplicated DOM buttons with **one** teleported floating popover reading a memoized JSON options store, applying an optimistic checkmark immediately before a `#[Renderless]` server persist.
- **Interactive Preview:** Live 12-row task list sharing 1 anchored searchable assignee popover with a real-time **DOM Node Counter** badge (`Rendered option buttons: 12 instead of 2,400`).
- **Data Contract:**
```json
{
  "store": [{ "id": "u1", "name": "Alex Rivera" }, { "id": "u2", "name": "Sam Okafor" }, { "id": "u3", "name": "Jordan Lee" }],
  "rows": [{ "id": "r1", "title": "Audit Q3 site returns", "assignedIds": ["u1"] }]
}
```
- **Dual-Stack Blueprint:** `Alpine.store('directory')` + `openFor(rowId, rect)` single floating panel; Livewire `#[Renderless] toggleAssignee($rowId, $userId)`.

#### 07. Sticky Debounced Filters, Header Selects & Role-Scoped Saved Views (`saved-views-sticky-filters`)
- **Tier / Category / Provenance:** `T2` · `Tables & Queues` · `Cross-System [Observed]` (Merges PT #15/#16/#17 + IT #8 + HR #11)
- **Anti-Template Signal:** Combines column-header-embedded searchable single/multi selects (`<option>` authoring API), 300ms debounced search with safe `localStorage` merging, **Draft → Done** deferred popups (one round-trip), and **Role-Scoped Saved Views** that store table state only (never row IDs/pay) and sanitize disallowed filters with a notice when switching roles.
- **Interactive Preview:** Interactive data grid with header-embedded filters, Draft→Done filter popover, Save/Apply/Delete named view chips, and an Active Role switcher demonstrating disallowed-filter sanitization.
- **Data Contract:**
```json
{
  "activeRole": "regional-hr",
  "views": [{ "name": "Expiring Soon", "roleContext": "regional-hr", "state": { "status": ["ending"], "sort": ["end_date", "asc"] } }]
}
```
- **Dual-Stack Blueprint:** `draft` + `sanitizeTableState(state, role)` in Alpine/React; Livewire `HasSavedViews` trait + `wire:model.live.debounce.300ms` + `applyFilters(array $draft)`.

#### 08. Guarded Modals: Normalized Dirty-Close, Typed-Confirm & Required-Note Popover (`guarded-modals-dirty-close`)
- **Tier / Category / Provenance:** `T2` · `Forms & Guards` · `Cross-System [Observed]` (Merges PT #19/#21 + IT #11 + HR #9/#10)
- **Anti-Template Signal:** Three production safety nets in one kit: (a) **Normalized Dirty-Close Guard** where `5 === "5" === " 5 "`, `"001" !== "1"`, and multi-select arrays compare as sets (preventing false "unsaved changes" prompts while blocking backdrop dismiss); (b) **Typed-Confirmation Destructive Modal** with initial focus on `Cancel` (stray Enter never deletes) morphing into a bottom sheet on `<640px`; (c) **Teleported Required-Note Popover** with live char counter disabling submit until non-empty.
- **Interactive Preview:** 3 interactive trigger buttons letting visitors test value normalization live (type `" 5 "` over `5` → stays clean; type `"005"` → dirty guard triggers), typed `"RESET"` confirmation, and required-note popover.
- **Data Contract:**
```json
{
  "baseline": { "hours": 8, "code": "001", "days": ["1", "3"] },
  "destructive": { "title": "Reset admin credentials?", "confirmWord": "RESET", "record": "Alex Rivera · North Hub" }
}
```
- **Dual-Stack Blueprint:** Pure `isNormalizedDirty(baseline, current)` (unit-tested in Node); Livewire `WithDirtyGuard` trait + server-side `in:RESET` validation.

#### 09. Failure-Honest Boundaries, 150ms Loading & Formula-Safe CSV Export (`failure-honest-boundaries`)
- **Tier / Category / Provenance:** `T2` · `Forms & Guards` · `Cross-System [Observed]` (Merges PT Design DNA + IT #12/#14 + HR #8)
- **Anti-Template Signal:** Demonstrates honest runtime resilience: (a) **150ms delayed pending state** (fast 80ms queries show zero flash; slow 900ms queries dim smoothly); (b) **Shell-Preserving Panel/Route Error** (`role="alert"` + Retry so failed fetches never look empty); (c) **Formula-Safe CSV Exporter** with `\uFEFF` code-point BOM for Arabic Excel and apostrophe neutralization for leading `= + - @ \t \r` cells.
- **Interactive Preview:** Interactive simulator with buttons: `Fast Fetch (80ms — no flash)`, `Slow Fetch (900ms — 150ms delay)`, `Simulate Failure (role=alert + Retry)`, plus a live CSV Formula Injection Tester (`=CMD|' /C calc'!A0` → `'=CMD...`) with real `.csv` download.
- **Data Contract:**
```json
{
  "rows": [
    { "item": "Laptop LT-01", "notes": "=SUM(A1:A9)" },
    { "item": "جهاز طباعة", "notes": "+44 20 7946 0000" }
  ]
}
```
- **Dual-Stack Blueprint:** Pure `escapeCsvCell()` + `toCsv()` with `\uFEFF` (unit-tested); Livewire `streamDownload` + `wire:loading.delay.short`.

#### 10. Client-Side In-Browser Office & PDF Preview (`office-pdf-preview`)
- **Tier / Category / Provenance:** `T2` · `Navigation & Shell` · `SYS-03 [Observed]` (PT #25)
- **Anti-Template Signal:** Previews spreadsheets, documents, and PDFs directly in the browser without sending private files to Google Docs/Office Online third-party viewers. Writes spreadsheet cells strictly via `textContent` (XSS-proof), caps rendering at `500 rows × 50 cols` with an explicit truncation banner, and supports RTL-flipped prev/next file navigation.
- **Interactive Preview:** Interactive multi-file modal switching between a multi-sheet synthetic spreadsheet (showing capped-row banner & `textContent` safety on a `<script>` cell), a formatted document preview, and an unsupported-type download fallback card.
- **Data Contract:**
```json
{
  "files": [
    { "name": "q3-budget.xlsx", "type": "xlsx", "sheets": ["Summary", "By Site"], "rowCount": 640, "cap": 500 },
    { "name": "grant-brief.docx", "type": "docx", "pages": 3 },
    { "name": "archive.zip", "type": "unsupported", "size": "4.2 MB" }
  ]
}
```
- **Dual-Stack Blueprint:** Dynamic `import('xlsx')` / `import('docx-preview')` only on modal open; Livewire `previewAdjacent(±1)` action.

#### 11. Active-Role Switcher & Fail-Closed Detail Drawer (`fail-closed-role-drawer`)
- **Tier / Category / Provenance:** `T2` · `Navigation & Shell` · `SYS-02 [Observed]` (Merges HR #12 + HR #13)
- **Anti-Template Signal:** Solves two subtle security/race bugs: (a) **Request-ID Race Guard** (`ready = requestedId === loadedId`) ensures rapid clicks never display Person A's data under Person B's header; (b) **Fail-Closed Role Switch** immediately re-checks drawer visibility when the user switches active role (e.g., `Regional HR → Employee`), converting 403/404 into one generic `"Record unavailable"` state with zero data leakage.
- **Interactive Preview:** Click colleagues rapidly (simulated variable latency) to watch the `requestedId` race guard work, then flip the header Role Switcher while a restricted drawer is open to watch it fail closed cleanly.
- **Data Contract:**
```json
{
  "roles": ["regional-hr:north", "manager", "employee"],
  "colleagues": [
    { "id": 42, "name": "Avery Lindqvist", "branch": "North Hub", "restrictedToHr": false },
    { "id": 88, "name": "Former Staff #88", "branch": "East Annex", "restrictedToHr": true }
  ]
}
```
- **Dual-Stack Blueprint:** Client `requestedId` vs `loadedId` guard + `contextVersion` cache invalidator; Livewire session active-role + policy check + `$intercept` 404 handler.

---

### TIER 3 — Stateful Domain Workflows & Analytical Views (5 Kits)

#### 12. Bilingual Intent-Parsing "Ask" Palette (`bilingual-ask-palette`)
- **Tier / Category / Provenance:** `T3` · `Navigation & Shell` · `SYS-03 [Observed]` (PT #37)
- **Anti-Template Signal:** Sub-millisecond pure client search engine handling **Arabic normalization** (strips diacritics/tatweel, unifies `أإآ→ا`, `ة→ه`, `ى→ي`, strips `«ال»` on long words), **typo edit distance** (1 edit ≥4 chars, 2 edits ≥7), **wrong-keyboard-layout detection** (typing English keys while on Arabic layout and vice-versa), verb intent grammar (`"what is late"`, `"new"`, `"dark"`), and **frecency ranking** from recent picks.
- **Interactive Preview:** Live interactive search palette right inside the Vault with preset test chips (`"retrns"` typo, `"العائدات"` Arabic `«ال»`, `";hk"` wrong keyboard layout, `"late"` intent) showing matched highlights and computed score breakdown.
- **Data Contract:**
```json
{
  "index": [
    { "key": "page:returns", "kind": "page", "label": "Monthly Site Returns", "aliases": ["العائدات الشهرية", "reports"] },
    { "key": "act:new-ticket", "kind": "action", "label": "New Support Request", "aliases": ["تذكرة جديدة", "create"] }
  ],
  "recent": ["page:returns"]
}
```
- **Dual-Stack Blueprint:** Pure `search(query, ctx)` module (`normalizeAr`, `swapLayout`, `editDistance`, `frecency`, `highlight`) unit-tested in Node; Livewire debounced `ask(string $q)` for server records.

#### 13. Auto-Centering RTL Lifecycle Stepper & Stale-Aware Status-Gate Modal (`status-gate-lifecycle`)
- **Tier / Category / Provenance:** `T3` · `Workflows & State` · `SYS-03 [Observed]` (Merges PT #29 + PT #30)
- **Anti-Template Signal:** Zero workflow logic in views: a declarative transition table drives both the horizontal **Lifecycle Stepper** (shape-coded past/current/ahead/rejected stops, hold flag chip *beside* status, RTL-safe auto-centering scroll) and the **Status-Gate Modal** (shows only legal next states, requires a reason note, detects **stale records** changed by another user, and lists exact unmet gate requirements instead of generic error toasts).
- **Interactive Preview:** Interactive 7-stage proposal stepper with an `"On Hold"` flag toggle, a `"Simulate Concurrent Edit (Stale)"` toggle, and a Status-Gate transition modal that blocks `"Approve"` until `"Signed Funding Agreement"` and `"Reason ≥ 10 chars"` are satisfied.
- **Data Contract:**
```json
{
  "current": "review",
  "held": true,
  "stale": false,
  "stops": [
    { "key": "brief", "label": "Brief", "state": "past", "date": "2026-01-12" },
    { "key": "review", "label": "Review", "state": "current", "date": "2026-02-03" },
    { "key": "approved", "label": "Approved", "state": "ahead", "date": null }
  ],
  "gates": { "approved": ["Signed Funding Agreement uploaded", "Budget & dates confirmed"] }
}
```
- **Dual-Stack Blueprint:** Declarative `transitions` + `gateErrors` state; Livewire `$statusExpectedFrom` optimistic guard + `changeStatus()` server re-validation.

#### 14. Partial-Failure Needs-Action Digest & Version-Token Work Inbox (`needs-action-inbox`)
- **Tier / Category / Provenance:** `T3` · `Workflows & State` · `SYS-01 + SYS-02 [Observed]` (Merges IT #18 + HR #19 + PT #23)
- **Anti-Template Signal:** Combines two staff-level operational patterns: (a) **Needs-Action Digest** aggregating 6 independent sources where a failed source adds **no row** and surfaces an explicit `"1 source unavailable — digest incomplete"` banner (never faking "all clear"); (b) **Version-Token Work Inbox** where every approval row carries a `version` token so stale clicks return a typed `{ outcome: "changed" | "already_handled" | "done" }` instead of blindly overwriting, paired with `j / k / e / s` keyboard triage and a 6-second Undo bar.
- **Interactive Preview:** Digest with a `"Fail Licenses Query"` fault-injection switch + Work Inbox with a `"Simulate Stale Version"` button, keyboard `j/k` focus navigation, and 6-second Undo bar.
- **Data Contract:**
```json
{
  "digest": [
    { "id": "loans", "label": "Overdue equipment loans", "count": 4, "tone": "critical", "failed": false },
    { "id": "licenses", "label": "Expiring software licenses", "count": 2, "tone": "warn", "failed": false }
  ],
  "inbox": [
    { "key": "leave:81", "version": "v4-a9f3", "subject": "Avery Lindqvist", "action": "Approve Annual Leave (3d)", "waitingDays": 3, "overlap": "Jordan Okafor off Dec 28–30" }
  ]
}
```
- **Dual-Stack Blueprint:** `Promise.allSettled` digest reducer + typed outcome state machine; Livewire `decide($key, $version, $decision)` + `WorkInbox` source adapters.

#### 15. Normalized-Header RFC-4180 CSV Importer & Config-Driven `Register` (`spreadsheet-importer-register`)
- **Tier / Category / Provenance:** `T3` · `Tables & Queues` · `SYS-01 [Observed + spec JSONB diff]` (Merges IT #22 + IT #25)
- **Anti-Template Signal:** Two workhorse engines from Youssef's 100% solo build: (a) **Config-Driven `Register`** where one declarative `fields[]` array generates searchable tables (`detail: true` columns hidden from table yet editable/exported), inline edit forms, domain `rowTone` rules, and **`cleanForWrite()`** (converts blanks → `null` and omits keys the form never rendered so partial edits never wipe hidden columns); (b) **RFC-4180 CSV Importer** matching headers by normalized aliases, parsing ISO/slash/Excel-serial dates, preserving unmapped columns as metadata, and emitting `file:row` warnings.
- **Interactive Preview:** Paste or load sample messy CSV (reordered columns, `"n/a"` cells, Excel serial date `46022`) → inspect parsed preview + row warnings → load rows directly into the live Config-Driven Register and test `cleanForWrite()` payload inspection on edit.
- **Data Contract:**
```json
{
  "fields": [
    { "key": "name", "label": "Backup Job", "type": "text", "required": true },
    { "key": "interval_hours", "label": "Interval (h)", "type": "number" },
    { "key": "notes", "label": "Internal Notes", "type": "textarea", "detail": true }
  ],
  "sampleCsv": "Job Name,Interval,Last Run,Extra Tag\nFile Server Nightly,24,46080,critical-tier\nApp DB Hourly,1,n/a,primary"
}
```
- **Dual-Stack Blueprint:** Pure `parseCsv()` + `cleanForWrite(fields, raw)` (unit-tested in Node); React `<Register>` / Livewire dynamic `Register` component + Form object.

#### 16. Contract `asSigned()` Amendment Diff & Dual-Line Org Chart Explorer (`amendment-diff-org-chart`)
- **Tier / Category / Provenance:** `T3` · `Workflows & State` · `SYS-02 [Observed + local export spec]` (Merges HR #20 + HR #21)
- **Anti-Template Signal:** Encodes legal and organizational truth visually: (a) **Contract `asSigned()` Diff** renders original signed terms reconstructed from Amendment 1's `before` snapshot separately from live terms, folding older amendments into crisp 1-line summaries and redacting encrypted pay lines for unauthorized viewers; (b) **Dual-Line Org Chart** draws solid direct reporting lines vs. dashed technical/dotted lines (stroke pattern, never color), treats Vacancies as first-class dashed nodes, and turns the `"Hide Vacancies"` toggle solid-accent while hidden so critical gaps can't be silently forgotten.
- **Interactive Preview:** Two-tab preview: Tab 1 toggles `Live Terms` vs `asSigned() Original` with expandable amendment chain; Tab 2 renders an interactive dual-line org tree with Compact/Comfortable density, Vacancy highlight toggle, and local client-side SVG download (zero public CDN scripts).
- **Data Contract:**
```json
{
  "org": [
    { "id": "P-1", "title": "Operations Director", "holder": "Sam Ridley", "vacant": false, "children": ["P-2", "P-3"] },
    { "id": "P-2", "title": "Systems Lead", "holder": "Avery Lindqvist", "vacant": false, "dottedTo": "P-4", "children": [] },
    { "id": "P-3", "title": "Data Analyst", "holder": null, "vacant": true, "children": [] }
  ]
}
```
- **Dual-Stack Blueprint:** Pure `reconstructAsSigned(contract, amendments)` + `layoutOrgTree(nodes, density)`; Livewire describer service + client SVG renderer.

---

### TIER 4 — Flagship Staff-Level Interactive Engines (4 Kits)

#### 17. 12-Col FLIP Drag-Swap-Resize Grid & Flush-Row Packing Kernel (`flush-row-desk-grid`)
- **Tier / Category / Provenance:** `T4` · `Navigation & Shell` · `SYS-02 + SYS-03 [Observed]` (Merges PT #40/#41 + HR #24)
- **Anti-Template Signal:** Combines a **12-column zero-hole dashboard grid** (header-handle drag, FLIP swap glide, RTL-aware edge resize with `0.65`-cell hysteresis preventing flicker, phone-vs-desktop baked-size protection, Draft→Done Customize mode, and catalog re-cleaning on read) with an interactive **Flush-Row Packing Kernel Visual Playground** proving invariant `Σ cols per row === 12` with zero orphaned gaps.
- **Interactive Preview:** Interactive 12-column grid supporting drag-swap, keyboard arrow move/resize, edge width stepping (`+2` / `-2` cols), live invariant monitor (`Rows: 2 · Every row Σ=12 ✓ · Zero holes ✓`), and Reset to Role Default.
- **Data Contract:**
```json
{
  "cols": 12,
  "layout": [
    { "panel": "returns", "title": "Monthly Returns", "cols": 6, "rows": 2, "minCols": 4 },
    { "panel": "money", "title": "Funding Health", "cols": 6, "rows": 2, "minCols": 4 },
    { "panel": "queue", "title": "Priority Queue", "cols": 8, "rows": 2, "minCols": 4 },
    { "panel": "digest", "title": "Needs Action", "cols": 4, "rows": 2, "minCols": 4 }
  ]
}
```
- **Dual-Stack Blueprint:** Pure DOM-free `flushRows(layout)` + `resizePanel(layout, id, edge, delta)` kernel (unit-tested under Node); mirrored in PHP `Panels::flush()` so preview === saved layout.

#### 18. HTML + SVG Sankey Funding Flow with Synchronized Directional Trace (`html-svg-sankey-flow`)
- **Tier / Category / Provenance:** `T4` · `Data Visualization` · `SYS-03 [Observed]` (PT #42)
- **Anti-Template Signal:** Nodes stay real semantic HTML links/buttons (crisp text, accessible keyboard focus, automatic RTL column mirroring) while JS measures DOM rects via `ResizeObserver` and draws closed cubic-Bézier SVG ribbons proportional to budget. Focusing any node runs a directional BFS (down from sponsors, up from projects—**never sideways**) synchronized with a register table below and separated into per-currency tabs so USD and EUR never mix.
- **Interactive Preview:** Live 3-column HTML+SVG Sankey with Currency tabs (`USD` / `EUR`), hover/focus chain tracing, RTL flip test proving SVG paths recalculate cleanly, and synced register rows below.
- **Data Contract:** Uses `src/data/demos/pt-funding-flow.json` (`SP1–SP3`, `P-2026-014/021/009`, `PRJ-101–103`, `FA-01–03`).
- **Dual-Stack Blueprint:** Alpine `fundingFlow()` + `Alpine.store('flow')` + `ResizeObserver` redraw; Livewire computed `flow` graph + `wire:ignore` SVG layer.

#### 19. Two-Row Branch-Grouped Patch-Panel Estate Strip (`patch-panel-estate-strip`)
- **Tier / Category / Provenance:** `T4` · `Data Visualization` · `SYS-01 [Observed + RTL tooltip spec]` (IT #26)
- **Anti-Template Signal:** Packs dozens or hundreds of endpoints into the vertical height of two table rows—filled top-then-bottom per column like a physical network patch panel, grouped by busiest branch first with `online/total` header counters, color+glyph port states (`● ◐ ○`), and hover/focus telemetry tooltips showing accessible CPU/RAM/Disk load meters (`role="meter"`).
- **Interactive Preview:** Live 36-endpoint multi-branch patch panel with hover/keyboard-focus telemetry tooltip, `"Simulate Branch Outage"` / `"Simulate Agent Check-In"` triggers, and RTL-safe viewport-clamped tooltip positioning.
- **Data Contract:** Extends `src/data/demos/it-estate-ops.json` with 24–36 synthetic endpoints across `North Hub`, `Harbor Office`, and `Central Campus`.
- **Dual-Stack Blueprint:** React `useMemo` branch grouping + focusable `<button>` ports; Livewire `wire:poll.15s` island + Alpine tooltip.

#### 20. Interactive Gantt Engine & Month Timesheet State Machine (`gantt-and-timesheet-machines`)
- **Tier / Category / Provenance:** `T4` · `Data Visualization` · `SYS-02 + SYS-03 [Observed]` (Merges PT #43/#44 + HR #25)
- **Anti-Template Signal:** Showcases two non-CRUD state-machine UIs in one flagship Vault entry:
  - **Tab A — Mini Interactive Gantt Engine:** Integer day-number timescale (zero DST drift), 5 zoom levels, weekend shading, baseline ghost bars + slip tails, critical-path highlight, **route tracing** (lighting upstream drivers + downstream dependents + 2-hop funding links), and **Undo/Redo that replays server-side successor ripples**.
  - **Tab B — Month Timesheet State Machine:** `Open → Confirmed → Approved → Locked` workflow bar with per-role abilities (nobody approves their own month), `DRAFT` print/export gate until every 0/1-punch day is explicitly answered, and live overtime-to-leave-credit conversion + rollback on Reopen.
- **Interactive Preview:** Two full interactive tabs—drag a Gantt task bar forward to watch its dependent successor ripple forward, then hit `Undo (Ctrl+Z)` to revert both bars atomically; switch to Tab B to resolve unanswered punches, unlock printing, and lock overtime into leave credits.
- **Data Contract:**
```json
{
  "gantt": {
    "weekend": "fri-sat",
    "rows": [
      { "id": "r1", "wbs": "1.1", "name": "Schema & Invariants", "startDay": 1, "endDay": 8, "baselineEnd": 7, "progress": 80, "critical": true },
      { "id": "r2", "wbs": "1.2", "name": "Live Sandboxes & QA", "startDay": 9, "endDay": 16, "baselineEnd": 15, "progress": 30, "critical": true }
    ],
    "links": [{ "from": "r1", "to": "r2", "type": "FS", "lag": 0 }]
  }
}
```
- **Dual-Stack Blueprint:** Pure `timescale`, `traceRoute`, `applyRippleEdit`, and `reduceMonth(state, action)` modules (unit-tested under Node); Livewire actions returning `{ ok, payload, changes[] }`.

---

## 4. Pure Domain Kernels & Automated Node Unit Tests (`tests/`)

Mirror the exact engineering discipline proven across Youssef's real repositories by adding a fast, zero-dependency **`node:test`** suite (`npm test`) inside `youssef-operations-kit/tests/` covering:

1. **`tests/contrast.test.mjs`** — Parses `src/styles/tokens.css` (both `:root` Light Archival Stone and `[data-theme="dark"]` Deep Slate-Charcoal) and arithmetically asserts **WCAG 2.2 AA** contrast ratios (`≥4.5:1` for primary/secondary text and accent-on-surface; `≥3.0:1` for UI control boundaries).
2. **`tests/kernels.test.mjs`** — Unit tests all 7 pure client/domain engines shared by the Sandboxes and Vault:
   - `flushRows()` invariant (`Σ cols per row === 12`, zero empty rows, idempotent).
   - `slaElapsedPercent()` (2% minimum floor, `null` safe, `>100%` clamped) & `compareUrgency()` (breached → closing → ok).
   - `isNormalizedDirty()` (`5 === "5" === " 5 "`, `"001" !== "1"`, set-order-independent arrays).
   - `computePooledRatio()` (verifies `61/90 = 67.8%` vs naive `59.6%` and excluded-site count).
   - `escapeCsvCell()` (neutralizes `= + - @ \t \r` and prepends `\uFEFF` BOM).
   - `cleanForWrite()` (converts blanks → `null`, omits unseen form keys).
   - `bilingualSearch()` (Arabic `أإآ→ا`, `ة→ه`, `«ال»` stripping, wrong keyboard layout swap, 1-edit typo match).
3. **`tests/sanitization.test.mjs`** — Scans `src/` and `public/` to fail CI if any forbidden proprietary string, internal URL pattern, or stray `[cite:` artifact ever enters the repo.

---

## 5. Phased Upgrade Plan (Non-Destructive Over Existing Base Structure)

1. **Upgrade Phase A — Global Design DNA & Honesty Patches:**
   - Enhance `src/styles/tokens.css` with semantic type-role utilities, `:lang(ar)` typography overrides, 150ms `data-loading` anti-flicker rule, and shape-based status utilities.
   - Patch `01-it-ops-helpdesk.mdx`, `ServiceDeskDemo.tsx` (inline expanding `?ticket=` row + inline header bulk bar + honest scope callout), and `02-hr-lifecycle-crm.mdx` (pre-RMS boundary + `[spec]` tags).
2. **Upgrade Phase B — Pure Kernels & Automated `node:test` Suite:**
   - Extract shared pure TypeScript modules under `src/lib/kernels/` (`flushRows.ts`, `sla.ts`, `dirtyGuard.ts`, `pooledRatio.ts`, `safeCsv.ts`, `cleanForWrite.ts`, `bilingualAsk.ts`) and add `tests/contrast.test.mjs`, `tests/kernels.test.mjs`, and `tests/sanitization.test.mjs` wired to `"test": "node --test tests/*.test.mjs"` in `package.json`.
3. **Upgrade Phase C — Full 20-Kit Master Component Vault (`/vault`):**
   - Upgrade `src/content.config.ts` (`vault` schema adds `tier: 1|2|3|4`, `provenance: "observed" | "observed-plus-spec"`, `sourceSystems: string[]`).
   - Add Tier filter pills + Provenance badges + Grayscale/RTL/Theme/Viewport controls in `PreviewFrame.astro`.
   - Implement all **20 deduplicated kits** (`T1: 01–05`, `T2: 06–11`, `T3: 12–16`, `T4: 17–20`) with real working previews and complete 4-tab Shiki code snippets (Alpine, React 19, Livewire 4 PHP+Blade).
4. **Upgrade Phase D — Global `Ctrl+K` Bilingual Ask Upgrade & Final Verification:**
   - Upgrade `CommandAskBar.astro` to use `src/lib/kernels/bilingualAsk.ts` (Arabic normalization, typo tolerance, wrong-layout swap, frecency ranking) and index all 20 Vault kits.
   - Run `npm test`, `npx astro check`, and `npm run build` — all must exit `0`.