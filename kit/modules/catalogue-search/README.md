# Catalogue search endpoint

Use Laravel 13 with PHP 8.4 or later and the mbstring extension. Copy this directory to `kit/modules/catalogue-search/` in your application. Register the route file from `routes/web.php`.

```php
require base_path('kit/modules/catalogue-search/routes.php');
```

Request `GET /examples/catalogue-search?q=filters` to receive a JSON list. The optional query matches a title or category, ignores case and accepts up to 80 characters. An empty query lists the public fixtures. Replace `entries.php` with your project's public index and change the path and route name if they overlap an existing route.

This in-memory example suits a small public list. Keep private entries outside this index. The included feature test expects the three supplied fixtures and the registered route. In a Laravel project with Pest or PHPUnit installed, run `php artisan test kit/modules/catalogue-search/CatalogueSearchTest.php` from the app root.
