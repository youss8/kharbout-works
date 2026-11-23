# Youssef Operations Kit

Youssef Kharbout’s engineering workbench brings six interactive system demonstrations, ten reusable UI patterns, eleven prompt blueprints, five operations templates, four personal prototypes and an International/DACH CV into a static site.

## Run the workbench

Use Node.js 24 and npm. From the repository root, run:

```sh
npm install
npm run dev
```

Open the [local workbench](http://localhost:4321). Browse the [systems](http://localhost:4321/systems/), [vault](http://localhost:4321/vault/), [AI toolkit](http://localhost:4321/ai-kit/), [templates](http://localhost:4321/templates/), [lab](http://localhost:4321/lab/) and [CV](http://localhost:4321/cv/). Press Ctrl+K or Cmd+K to search. The CV lets you choose a print format and substitute an employer name for the current browser visit.

| Case study | Youssef’s direct ownership | Live demonstrations |
| --- | --- | --- |
| IT Operations & Asset Helpdesk | 100% solo architecture and build. Architecture-verified, held from live fleet rollout. | Service-desk SLA queue and endpoint estate monitor |
| HR Lifecycle Platform | Core contributor and co-architect on the three-developer pre-RMS team | Leave approval desk and attendance month with signed-contract reconstruction |
| Funding, Portfolio & KPI Analytics | Primary architect and full-stack builder of approximately 80% on a three-developer team | Pooled KPI ratios and funding flow with agreement health |

## Architecture

Astro 5 builds static routes from four Zod-validated content collections. The service desk and estate monitor hydrate as React 19/TypeScript islands. Alpine 3 handles the HR, funding, toolkit and lab interactions. The six case-study fixtures and three Mermaid diagrams come directly from the master handoff. Runtime changes are local to the browser.

Vault entries include complete Alpine, React and Livewire implementations. Vite compiles the copyable React source, and each iframe runs an actual example in its own theme and writing direction. Shiki highlights the source at build time. Tailwind 4 and locally bundled Plus Jakarta Sans and JetBrains Mono supply the shared design tokens. The build-time search index powers the Fuse.js command bar.

## How to Replace Starter Assets

| Asset | Edit | What changes |
| --- | --- | --- |
| AI Gems, skills and workflows | [AI kit entries](src/content/ai-kit/) | Keep the frontmatter schema and match each variable key to its Markdown token. Update the starter flag when replacing a blueprint. |
| Architecture and operations templates | [Template entries](src/content/templates/) | Edit the Markdown body, supported formats and optional JSON schema. |
| Lab projects | [Lab metadata](src/data/lab.ts) | Update the summary or supply a screenshot, repository URL or live URL. Each current prototype also has a working demonstration. |
| DACH headshot | `public/photo.jpg` | Drop in a portrait and rebuild. A 96 × 116 monogram appears when a portrait is absent. |
| Career and contact information | [Profile](src/data/profile.ts) | Update the shared public profile and concise CV wording. |

## Verify and deploy

```sh
npm ci
npx astro check
npm run build
npx playwright install chromium
npm run test:workbench
python scripts/audit-public.py
```

The browser suite serves the built `dist/` directory on loopback port 4339. Install Poppler (`pdfinfo` and `pdftotext` on PATH) for the A4 print checks. To exercise an existing local production preview, set `PLAYWRIGHT_WORKBENCH_URL`. Run `npm run preview` to serve the static output yourself.

The production audit uses Python 3, Git and ripgrep to check publishable files, links and fixture integrity. The [verification report](docs/production-verification.md) records each phase gate.

To run the Livewire examples in isolation, create `test-results/livewire-runtime/`, then run `composer --working-dir=test-results/livewire-runtime require "laravel/framework:13.*" "livewire/livewire:4.*"` and `php tests/workbench/verify-livewire.php`. The check mounts and updates each component against the downloaded framework.

In Vercel, import the GitHub repository with the Astro preset. In Cloudflare Pages, connect the same repository and select the Astro preset. In either provider, use the repository root, Node 24, `npm run build` and output directory `dist`. Set `SITE_URL` to the public origin when a domain is assigned. Set `PUBLIC_SOURCE_REF` to a published Git revision if the provider does not supply its commit SHA. Only portfolio assets are copied into the static export. [Vercel deployment guide](https://docs.astro.build/en/guides/deploy/vercel/) · [Cloudflare Pages deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/)

Domain candidates are `youssefkharbout.dev`, `youss.dev`, `opskit.youss.dev` and `kharbout.dev`.

## Laravel reference catalogue

An open-source catalogue of components, pages, JavaScript utilities, Laravel modules and AI tools. Search by name or technology, filter by collection and open an entry for its preview, source, requirements and a quick verification step. The catalogue supports English, German and Arabic with right-to-left navigation. Reusable source examples retain their original text.

### Open the catalogue

![The catalogue in a desktop browser](docs/design/catalogue-desktop.png)

[View the mobile layout](docs/design/catalogue-mobile.png).

From the repository root, with Docker running:

```sh
docker compose up --build -d
```

Open [the local catalogue](http://127.0.0.1:8080). Run `docker compose down` to stop the preview. This configuration serves the local demonstration.

If port 8080 is occupied, set `CATALOGUE_PORT` in your shell before starting Compose. For example, run `$env:CATALOGUE_PORT = '8137'` in PowerShell or `export CATALOGUE_PORT=8137` in a POSIX shell, then open [the alternate port](http://127.0.0.1:8137).

For development, use PHP 8.4 with Phar enabled, Composer 2 and Node.js 24.

```sh
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
npm ci
npm run build:catalogue
php artisan serve
```

Open [the development server](http://127.0.0.1:8000). Keep Laravel running and use `npm run dev:catalogue` in a second terminal for frontend hot reload. Generate an application key on initial setup. The catalogue uses file sessions and needs no database or AI-provider account.

### What you can reuse

| Entry | Try it | Take it into your project |
| --- | --- | --- |
| Copy code | Copy a snippet with the keyboard. | React button with independent clipboard feedback and a manual fallback. |
| Keyboard search dialog | Press Ctrl+K or Cmd+K from any catalogue page. Type a term, use the arrow keys and press Enter. | [React dialog and standalone example](kit/components/search-dialog/README.md). |
| Keyboard shortcut label | Compare the shortcut and command at narrow widths. | HTML and CSS for a wrapping command label. |
| Empty search results | Clear an unmatched search and check focus. | [Standalone HTML page](kit/pages/empty-state-page/index.html). |
| Shareable URL filters | Change a search term and inspect the generated URL. | [TypeScript functions](kit/utilities/url-filters/filters.ts) used by Browse. |
| Catalogue search endpoint | Query a small public fixture and inspect the JSON. | [Laravel module](kit/modules/catalogue-search/README.md) with input validation and HTTP tests. |
| Accessible UI review | Compare a review with the worked keyboard example. | [Claude skill and Gemini Gem instructions](kit/ai-tools/accessible-ui-review/README.md). |

Each entry has a **Download source (.zip)** link. Extract the archive and open its README for requirements, setup and a quick check. The archive includes the MIT notice. Individual examples also have a Copy button.

On the home page, press `/` to search the **AI Skills, Gems & Command Vault** by keyword, platform or `#tag`. Open a workflow to fill its prompt variables, compare a simulated before-and-after example and copy the compiled prompt. Add or edit workflows in [the Vault registry](app/Catalogue/WorkflowVault.php). **Example tested** means the built-in example ran in the intended tool or review process.

To try the dialog outside Laravel, download it from its entry into an empty folder and extract it there. From the folder containing the extracted `package.json`, run `npm ci` and `npm run dev`, then open the local URL printed by Vite.

### Follow a request

The [routes](routes/web.php) send page requests to the [catalogue controller](app/Http/Controllers/CatalogueController.php). The [registry](app/Catalogue/EntryCatalogue.php) supplies entry metadata to [Browse](resources/js/pages/Browse.tsx) and [Entry](resources/js/pages/Entry.tsx). Both use the same search matcher. Each published slug has a page and a download route. The download controller builds a ZIP from an explicit list of repository files for that slug.

See the [entry authoring guide](docs/adding-an-entry.md), the [architecture decisions](docs/adr/) and the [security checklist](docs/SECURITY_CHECKLIST.md).

### Run the catalogue checks

```sh
composer validate --strict
vendor/bin/pint --test
composer analyse
composer test
npm run lint
npm run format:check
npm run test:kit
npm run build:catalogue
npx playwright install chromium
npm run test:browser
```

Playwright starts Laravel on port 8029 and uses the built assets. To test a running native or Docker preview, set `PLAYWRIGHT_BASE_URL` to its local URL. On Linux CI, install the browser with `npx playwright install --with-deps chromium`. To use an existing Chromium executable locally, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path.

## Roadmap

Start by reusing one entry in another project and recording any missing dependency or unclear instruction as an issue. Add subsequent entries when they solve a specific task, have a runnable example and pass their verification steps. A tagged release follows maintainer review of the candidate and green CI.

[Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [MIT license](LICENSE)
