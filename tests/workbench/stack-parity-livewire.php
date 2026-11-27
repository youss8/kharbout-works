<?php

declare(strict_types=1);

use App\Livewire\StatusGateLifecycle;
use Composer\InstalledVersions;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;

$root = dirname(__DIR__, 2);
$isolated = $root.'/test-results/livewire-runtime';
$runtime = realpath($argv[1] ?? (is_file($isolated.'/vendor/autoload.php') ? $isolated : $root));
if ($runtime === false || ! is_file($runtime.'/vendor/autoload.php')) {
    throw new RuntimeException('Install the Laravel and Livewire dependencies before capturing the trace.');
}
require $runtime.'/vendor/autoload.php';

$work = $root.'/test-results/stack-parity-livewire';
foreach ([$runtime.'/bootstrap/cache', $work.'/views/livewire', $work.'/compiled'] as $directory) {
    if (! is_dir($directory) && ! mkdir($directory, 0755, true) && ! is_dir($directory)) {
        throw new RuntimeException('Could not create the Livewire test directory.');
    }
}

$kit = $root.'/src/content/vault/status-gate-lifecycle';
$fixturePath = $root.'/src/data/stack-parity.json';
$fixture = json_decode(file_get_contents($fixturePath), true, flags: JSON_THROW_ON_ERROR);
require $kit.'/Example.php';
copy($kit.'/view.blade.php', $work.'/views/livewire/status-gate-lifecycle.blade.php');

$app = Application::configure(basePath: $runtime)
    ->withProviders([LivewireServiceProvider::class])
    ->withExceptions()
    ->withMiddleware()
    ->withRouting(using: static function (): void {})
    ->create();
$app->make(Kernel::class)->bootstrap();
config([
    'app.key' => 'base64:'.base64_encode(random_bytes(32)),
    'cache.default' => 'array',
    'session.driver' => 'array',
    'view.paths' => [$work.'/views'],
    'view.compiled' => $work.'/compiled',
]);

Livewire::component('status-gate-lifecycle', StatusGateLifecycle::class);
$html = Livewire::mount('status-gate-lifecycle');
if (! preg_match('/wire:snapshot="([^"]+)"/', $html, $match)) {
    throw new RuntimeException('The component did not mount.');
}
$snapshot = json_decode(html_entity_decode($match[1], ENT_QUOTES), true, flags: JSON_THROW_ON_ERROR);
$update = static function (string $method, array $changes = []) use (&$snapshot): array {
    [$snapshot, $effects] = Livewire::update($snapshot, $changes, [['method' => $method, 'params' => []]]);

    return $effects;
};
$checkpoint = static function (string $message) use (&$snapshot): array {
    return [
        'stage' => $snapshot['data']['current'],
        'version' => $snapshot['data']['version'],
        'message' => $message,
        'event' => $snapshot['data']['transitionEvent'][0] ?? null,
    ];
};

$initial = $checkpoint($snapshot['data']['notice']);
$update('begin');
$update('concurrentEdit');
$effects = $update('changeStatus', $fixture['approval']);
$expectedMessage = $fixture['expected']['stale']['message'];
if (! str_contains(html_entity_decode(strip_tags($effects['html']), ENT_QUOTES), $expectedMessage)) {
    throw new RuntimeException('The rendered component did not report the stale edit.');
}
$stale = $checkpoint($expectedMessage);
$update('reloadVersion');
$update('changeStatus');
$fresh = $checkpoint($snapshot['data']['notice']);
$trace = compact('initial', 'stale', 'fresh');
if ($trace !== $fixture['expected']) {
    throw new RuntimeException('The Livewire trace differs from the fixture expectations.');
}

$digest = static fn (string $path): string => hash('sha256', str_replace(["\r\n", "\r"], "\n", file_get_contents($path)));
echo json_encode([
    'recordedOn' => gmdate('Y-m-d'),
    'phpVersion' => PHP_VERSION,
    'laravelVersion' => InstalledVersions::getPrettyVersion('laravel/framework'),
    'livewireVersion' => InstalledVersions::getPrettyVersion('livewire/livewire'),
    'fixtureSha256' => $digest($fixturePath),
    'componentSha256' => $digest($kit.'/Example.php'),
    'viewSha256' => $digest($kit.'/view.blade.php'),
    'trace' => $trace,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR).PHP_EOL;
