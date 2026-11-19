# Youssef's Operations Kit

Browse reusable components, pages, utilities, modules and AI tools. Each entry shows what you can take into your own project, what it requires and how to check that it works.

## Run locally

Use PHP 8.4, Composer 2 and Node.js 24. From a fresh checkout, run:

```sh
composer install
php -r "file_exists('.env') || copy('.env.example', '.env');"
php artisan key:generate
npm ci
npm run build
php artisan serve
```

Open [the catalogue](http://127.0.0.1:8000). Select **Keyboard shortcut label** to preview the component and see its HTML and CSS. This base serves versioned catalogue content with file-backed sessions. It runs locally without a database server or API keys.

For live editing, keep the Laravel server running and start `npm run dev` in a second terminal. Vite reloads the frontend as you edit.

## Follow a request through the project

| File | What to look for |
| --- | --- |
| [Laravel routes](routes/web.php) | The URL and Inertia page name for each public screen. |
| [Inertia entry point](resources/js/app.tsx) | Where React starts and the active page is resolved. |
| [Browse](resources/js/pages/Browse.tsx) | The collection index and link to the sample entry. |
| [Entry](resources/js/pages/Entry.tsx) | The preview, requirements and instructions for reuse. |
| [Catalogue content](resources/js/catalogue.ts) | The collection descriptions and sample entry metadata. |
| [Application CSS](resources/css/app.css) | The layout, colours, keyboard focus and responsive behaviour. |

The [architecture decision](docs/adr/0001-catalogue-foundation.md) explains why these screens share one Laravel application. The [original design concept](docs/design/catalogue.html) is available as a standalone HTML file.

## Verify a change

```sh
npm run lint
npm run format:check
npm run build
vendor/bin/pint --test
composer analyse
composer test
```

The frontend build checks strict TypeScript before bundling assets. The route tests exercise the Laravel responses used by the two screens.

Work proceeds one entry at a time through an issue, a focused change and review. See the [contributing guide](CONTRIBUTING.md) and [MIT license](LICENSE).
