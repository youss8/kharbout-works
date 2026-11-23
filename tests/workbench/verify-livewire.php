<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;

// Install Laravel 13 and Livewire 4 in this isolated verification directory first.
$runtime = realpath(__DIR__.'/../../test-results/livewire-runtime');
if ($runtime === false || ! is_file($runtime.'/vendor/autoload.php')) {
    throw new RuntimeException('The isolated Laravel and Livewire runtime is required.');
}
require $runtime.'/vendor/autoload.php';
foreach (['bootstrap/cache', 'storage/framework/views', 'storage/framework/sessions', 'resources/views/livewire', 'components'] as $dir) {
    if (! is_dir($runtime.'/'.$dir)) {
        mkdir($runtime.'/'.$dir, 0755, true);
    }
}
$app = Application::configure(basePath: $runtime)
    ->withProviders([LivewireServiceProvider::class])
    ->withExceptions()
    ->withMiddleware()
    ->withRouting(using: static function (): void {})
    ->create();
$app->make(Kernel::class)->bootstrap();
set_exception_handler(static function (Throwable $exception): void {
    fwrite(STDERR, $exception->getMessage().PHP_EOL);
    exit(1);
});
config([
    'app.key' => 'base64:'.base64_encode(random_bytes(32)),
    'cache.default' => 'array',
    'session.driver' => 'array',
    'view.paths' => [$runtime.'/resources/views'],
    'view.compiled' => $runtime.'/storage/framework/views',
]);

$actions = [
    'approval-stepper-checklist' => ['selectVersion', ['v1']],
    'command-ask-bar' => ['choose', ['solo']],
    'config-driven-register' => ['edit', [1]],
    'dirty-modal-guard' => ['saveRecord', ['Inspection device', 'North Hub']],
    'guarded-workflow-kanban' => ['requestMove', ['WR-18', 'Review']],
    'live-quoting-composer' => ['reserve', []],
    'patch-panel-strip' => ['inspect', ['HO-LT-007']],
    'sla-priority-queue' => ['assign', [], ['selected' => [1043]]],
    'slice-kpi-tiles' => ['toggle', ['Active']],
    'status-vocabulary-primitives' => ['selectCurrency', ['EUR']],
];
foreach (glob(__DIR__.'/../../src/content/vault/*.json') as $path) {
    $entry = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    $slug = $entry['id'];
    if (! preg_match('/^[a-z0-9-]+$/D', $slug)) {
        throw new RuntimeException('Invalid example identifier');
    }
    $code = $entry['codeLivewirePhp'];
    preg_match('/namespace\s+([^;]+);/', $code, $namespace);
    preg_match('/\bclass\s+(\w+)\s+extends/', $code, $class);
    file_put_contents($runtime.'/resources/views/livewire/'.$slug.'.blade.php', $entry['codeLivewireBlade']);
    $file = $runtime.'/components/'.$slug.'.php';
    file_put_contents($file, $code);
    require $file;
    Livewire::component($slug, $namespace[1].'\\'.$class[1]);
    $html = Livewire::mount($slug);
    if (! str_contains($html, 'wire:snapshot=') || trim(strip_tags($html)) === '') {
        throw new RuntimeException($slug.' failed to mount');
    }
    preg_match('/wire:snapshot="([^"]+)"/', $html, $match);
    $snapshot = json_decode(html_entity_decode($match[1], ENT_QUOTES), true, flags: JSON_THROW_ON_ERROR);
    [$method, $parameters] = $actions[$slug];
    [$updated, $effects] = Livewire::update($snapshot, $actions[$slug][2] ?? [], [
        ['method' => $method, 'params' => $parameters],
    ]);
    if ($updated['data'] === $snapshot['data'] || empty($effects['html'])) {
        throw new RuntimeException($slug.' failed to update its rendered state');
    }
    echo $slug.' mounted and updated via '.$method.PHP_EOL;
}
