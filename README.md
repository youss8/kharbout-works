# Youssef's Operations Kit

An open-source catalogue of components, pages, JavaScript utilities, Laravel modules and AI tools. Search by name or technology, filter by collection and open an entry for its preview, source, requirements and a quick verification step. The catalogue supports English, German and Arabic with right-to-left navigation. Reusable source examples retain their original text.

## Open the catalogue

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
npm run build
php artisan serve
```

Open [the development server](http://127.0.0.1:8000). Keep Laravel running and use `npm run dev` in a second terminal for frontend hot reload. Generate an application key on initial setup. The catalogue uses file sessions and needs no database or AI-provider account.

## What you can reuse

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

To try the dialog outside Laravel, download it from its entry into an empty folder and extract it there. From the folder containing the extracted `package.json`, run `npm ci` and `npm run dev`, then open the local URL printed by Vite.

## Follow a request

The [routes](routes/web.php) send page requests to the [catalogue controller](app/Http/Controllers/CatalogueController.php). The [registry](app/Catalogue/EntryCatalogue.php) supplies entry metadata to [Browse](resources/js/pages/Browse.tsx) and [Entry](resources/js/pages/Entry.tsx). Both use the same search matcher. Each published slug has a page and a download route. The download controller builds a ZIP from an explicit list of repository files for that slug.

See the [entry authoring guide](docs/adding-an-entry.md), the [architecture decisions](docs/adr/) and the [security checklist](docs/SECURITY_CHECKLIST.md).

## Run the checks

```sh
composer validate --strict
vendor/bin/pint --test
composer analyse
composer test
npm run lint
npm run format:check
npm run test:kit
npm run build
npx playwright install chromium
npm run test:browser
```

Playwright starts Laravel on port 8029 and uses the built assets. To test a running native or Docker preview, set `PLAYWRIGHT_BASE_URL` to its local URL. On Linux CI, install the browser with `npx playwright install --with-deps chromium`. To use an existing Chromium executable locally, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path.

## Roadmap

Start by reusing one entry in another project and recording any missing dependency or unclear instruction as an issue. Add subsequent entries when they solve a specific task, have a runnable example and pass their verification steps. A tagged release follows maintainer review of the candidate and green CI.

[Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) · [MIT license](LICENSE)
