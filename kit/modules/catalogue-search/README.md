# Catalogue search endpoint

Copy this directory to `kit/modules/catalogue-search/` in a Laravel 13 application. Register the route file from `routes/web.php`:

```php
require base_path('kit/modules/catalogue-search/routes.php');
```

Request `GET /examples/catalogue-search?q=filters` to receive a JSON list. The optional query matches a title or category, ignores case and accepts up to 80 characters. An empty query lists the public fixtures. Replace `entries.php` with your project's public index and change the path and route name if they overlap an existing route. PHP needs the mbstring extension.

This in-memory example suits a small public list. Keep private entries outside this index. The included feature test expects the three supplied fixtures and the registered route. Run it using `vendor/bin/pest kit/modules/catalogue-search/CatalogueSearchTest.php` from the app root.
