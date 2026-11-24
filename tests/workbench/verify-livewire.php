<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;
use Symfony\Component\Process\Process;

// Install Laravel 13 and Livewire 4 in this isolated verification directory first.
$runtime = realpath(__DIR__.'/../../test-results/livewire-runtime');
if ($runtime === false || ! is_file($runtime.'/vendor/autoload.php')) {
    throw new RuntimeException('The isolated Laravel and Livewire runtime is required.');
}
require $runtime.'/vendor/autoload.php';
$composerPath = $runtime.'/composer.json';
$composer = json_decode(file_get_contents($composerPath), true, flags: JSON_THROW_ON_ERROR);
if (! isset($composer['autoload']['psr-4']['App\\'])) {
    $composer['autoload']['psr-4']['App\\'] = 'app/';
    file_put_contents($composerPath, json_encode($composer, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL);
}
foreach (['app', 'bootstrap/cache', 'storage/framework/views', 'storage/framework/sessions', 'resources/views/livewire', 'components'] as $dir) {
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
    'status-tone-vocabulary' => ['save', [], ['raw' => 'Low']],
    'two-band-progress-sla' => [null, [], ['approved' => 118]],
    'currency-guard-balance' => [null, [], ['mix' => true]],
    'zero-safe-signal-tiles' => ['clearBreaches', []],
    'redacted-pay-day-state' => ['decide', [true]],
    'shared-options-popover' => ['toggleAssignee', [1, 1]],
    'saved-views-sticky-filters' => ['applyFilters', [], ['draft' => ['Ending']]],
    'guarded-modals-dirty-close' => ['saveSchedule', ['8', ['1', '2']]],
    'failure-honest-boundaries' => ['refreshInventory', ['fast']],
    'office-pdf-preview' => ['previewModule', []],
    'fail-closed-role-drawer' => ['inspectProfile', [42]],
    'bilingual-ask-palette' => ['pick', ['returns']],
    'status-gate-lifecycle' => ['begin', []],
    'needs-action-inbox' => ['decide', ['leave:81', 1, 'Approve']],
    'spreadsheet-importer-register' => ['parse', []],
    'amendment-diff-org-chart' => ['switchTerms', []],
    'flush-row-desk-grid' => ['customize', []],
    'html-svg-sankey-flow' => ['chooseCurrency', ['EUR']],
    'patch-panel-estate-strip' => ['outage', []],
    'gantt-and-timesheet-machines' => ['move', [0, 1]],
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
(new Process(['node', __DIR__.'/build-livewire-office.mjs']))->mustRun();
$verifyTier3 = require __DIR__.'/tier3-livewire.php';
$verifySavedViews = require __DIR__.'/saved-views-livewire.php';
$verifyGuardedFile = require __DIR__.'/guarded-file-livewire.php';
$verifyControls = require __DIR__.'/controls-livewire.php';
$base = __DIR__.'/../../src/content/vault';
spl_autoload_register(static function (string $class) use ($base): void {
    if (! str_starts_with($class, 'App\\')) {
        return;
    }
    $path = str_replace('\\', '/', substr($class, 4)).'.php';
    foreach (glob($base.'/*/app', GLOB_ONLYDIR) as $directory) {
        if (is_file($directory.'/'.$path)) {
            require $directory.'/'.$path;

            return;
        }
    }
});
foreach (['resources/views', 'public'] as $subpath) {
    foreach (glob($base.'/*/'.$subpath, GLOB_ONLYDIR) as $directory) {
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS));
        foreach ($files as $file) {
            $destination = $runtime.'/'.$subpath.'/'.substr($file->getPathname(), strlen($directory) + 1);
            if (! is_dir(dirname($destination))) {
                mkdir(dirname($destination), 0755, true);
            }
            copy($file->getPathname(), $destination);
        }
    }
}
foreach ([...glob($base.'/*.json'), ...glob($base.'/*/kit.json')] as $path) {
    $entry = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    $slug = $entry['id'];
    if (! preg_match('/^[a-z0-9-]+$/D', $slug)) {
        throw new RuntimeException('Invalid example identifier');
    }
    $code = $entry['codeLivewirePhp'] ?? file_get_contents(dirname($path).'/Example.php');
    preg_match('/namespace\s+([^;]+);/', $code, $namespace);
    preg_match('/\bclass\s+(\w+)\s+extends/', $code, $class);
    file_put_contents($runtime.'/resources/views/livewire/'.$slug.'.blade.php', $entry['codeLivewireBlade'] ?? file_get_contents(dirname($path).'/view.blade.php'));
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
    $verifyTier3($slug, $snapshot);
    if ($slug === 'saved-views-sticky-filters') {
        $verifySavedViews($snapshot);
    }
    if ($slug === 'guarded-modals-dirty-close') {
        $verifyGuardedFile($snapshot);
    }
    $verifyControls($slug, $snapshot);
    [$method, $parameters] = $actions[$slug];
    [$updated, $effects] = Livewire::update($snapshot, $actions[$slug][2] ?? [], $method === null ? [] : [
        ['method' => $method, 'params' => $parameters],
    ]);
    $renderless = in_array($slug, ['shared-options-popover', 'office-pdf-preview', 'fail-closed-role-drawer'], true);
    if ($renderless ? ! array_key_exists(0, $effects['returns'] ?? []) : ($updated['data'] === $snapshot['data'] || empty($effects['html']))) {
        throw new RuntimeException($slug.' failed to update its rendered state');
    }
    echo $slug.' mounted and updated via '.($method ?? 'wire:model').PHP_EOL;
}
