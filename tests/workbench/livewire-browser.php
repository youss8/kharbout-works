<?php

declare(strict_types=1);

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;

// This authenticated test fixture runs only on the local PHP development server.
if (PHP_SAPI !== 'cli-server' || ! in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(404);

    return;
}

$root = dirname(__DIR__, 2);
$runtime = $root.'/test-results/livewire-runtime';
$key = getenv('LIVEWIRE_BROWSER_TEST_KEY');
if (! $key || ! is_file($runtime.'/vendor/autoload.php') || ! is_file($runtime.'/components/saved-views-sticky-filters.php')) {
    throw new RuntimeException('Prepare the isolated runtime with php tests/workbench/verify-livewire.php and use the Livewire Playwright config.');
}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (str_starts_with($path, '/build/assets/')) {
    $assets = realpath($runtime.'/public/build/assets');
    $file = realpath($runtime.'/public'.rawurldecode($path));
    if (! $assets || ! $file || ! str_starts_with($file, $assets.DIRECTORY_SEPARATOR) || ! is_file($file)) {
        http_response_code(404);

        return;
    }
    header('Content-Type: '.match (pathinfo($file, PATHINFO_EXTENSION)) {
        'js', 'mjs' => 'text/javascript',
        'css' => 'text/css',
        'pdf' => 'application/pdf',
        default => 'application/octet-stream',
    });
    readfile($file);

    return;
}
if ($path === '/vault/schedule-guard.js') {
    header('Content-Type: text/javascript');
    readfile($runtime.'/public/vault/schedule-guard.js');

    return;
}
require $runtime.'/vendor/autoload.php';

$app = Application::configure(basePath: $runtime)
    ->withProviders([LivewireServiceProvider::class])
    ->withExceptions()
    ->withMiddleware()
    ->withRouting(using: static function (): void {
        Route::get('/health', static fn () => 'Ready');
        Route::middleware('web')->get('/k/{slug}', static function (string $slug) {
            abort_unless(preg_match('/^[a-z0-9-]+$/D', $slug), 404);

            return Blade::render(<<<'BLADE'
                <!DOCTYPE html><html><head>
                @livewireStyles
                <style>[x-cloak]{display:none!important}</style>
                <meta name="csrf-token" content="{{ csrf_token() }}">
                </head><body>@livewire($slug) @livewireScripts</body></html>
                BLADE, ['slug' => $slug]);
        });
    })
    ->create();

$kernel = $app->make(Kernel::class);
$request = Request::capture();
$app->instance('request', $request);
$kernel->bootstrap();
config([
    'app.key' => 'base64:'.$key,
    'app.debug' => false,
    'cache.default' => 'array',
    'session.driver' => 'file',
    'session.files' => $runtime.'/storage/framework/sessions',
    'view.paths' => [$runtime.'/resources/views'],
    'view.compiled' => $runtime.'/storage/framework/views',
]);
foreach (['vault.regional-hr', 'vault.manager', 'view-contract-pay'] as $ability) {
    Gate::define($ability, static fn (?object $user = null) => true);
}
$kits = $root.'/src/content/vault';
spl_autoload_register(static function (string $class) use ($kits): void {
    if (! str_starts_with($class, 'App\\')) {
        return;
    }
    $path = str_replace('\\', '/', substr($class, 4)).'.php';
    foreach (glob($kits.'/*/app', GLOB_ONLYDIR) as $directory) {
        if (is_file($directory.'/'.$path)) {
            require $directory.'/'.$path;

            return;
        }
    }
});
foreach (glob($kits.'/*/kit.json') as $path) {
    $slug = basename(dirname($path));
    $file = $runtime.'/components/'.$slug.'.php';
    $code = file_get_contents($file);
    preg_match('/namespace\s+([^;]+);/', $code, $namespace);
    preg_match('/\bclass\s+(\w+)\s+extends/', $code, $class);
    require $file;
    Livewire::component($slug, $namespace[1].'\\'.$class[1]);
}
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
