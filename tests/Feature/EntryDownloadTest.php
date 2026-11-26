<?php

use App\Catalogue\EntryBundles;
use App\Catalogue\EntryCatalogue;
use Illuminate\Cache\Events\CacheHit;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\File;

it('downloads exactly the reusable repository files for each published entry', function () {
    $packages = [
        'copy-code' => ['kit/components/copy-code', ['resources/js/components/CopyCodeButton.tsx', 'resources/css/copy-code.css']],
        'keyboard-shortcut-label' => ['kit/components/keyboard-shortcut-label', ['index.html', 'shortcut.css']],
        'empty-state-page' => ['kit/pages/empty-state-page', ['index.html']],
        'url-filters' => ['kit/utilities/url-filters', ['filters.ts', 'filters.test.mjs']],
        'catalogue-search' => ['kit/modules/catalogue-search', ['routes.php', 'entries.php', 'CatalogueSearchTest.php']],
        'accessible-ui-review' => ['kit/ai-tools/accessible-ui-review', ['SKILL.md', 'gem-instructions.md']],
        'search-dialog' => ['kit/components/search-dialog', [
            'SearchDialog.tsx', 'search-dialog.css', 'Example.tsx', 'index.html', 'main.tsx', 'package.json', 'package-lock.json',
        ]],
    ];

    $entries = app(EntryCatalogue::class)->all();
    expect(array_column($entries, 'slug'))->toEqualCanonicalizing(array_keys($packages));

    foreach ($entries as $entry) {
        $slug = $entry['slug'];
        [$directory, $members] = $packages[$slug];

        $response = $this->get($entry['downloadHref'].'?file=README.md')
            ->assertOk()->assertHeader('Content-Type', 'application/zip')->assertDownload($slug.'.zip');

        $path = sys_get_temp_dir().'/kit-test-'.bin2hex(random_bytes(16)).'.zip';
        file_put_contents($path, $response->getContent());
        try {
            $archive = new PharData($path);
            expect($archive->count())->toBe(count($members) + 2)
                ->and($archive['LICENSE']->getContent())->toBe(file_get_contents(base_path('LICENSE')))
                ->and($archive['README.md']->getContent())->toBe(file_get_contents(base_path($directory.'/README.md')));
            foreach ($members as $name) {
                $source = str_starts_with($name, 'resources/') ? $name : $directory.'/'.$name;
                expect($archive[$name]->getContent())->toBe(file_get_contents(base_path($source)));
            }
        } finally {
            unset($archive);
            Phar::unlinkArchive($path);
        }
    }
});

it('returns 404 for an unpublished download even when a source file is named', function () {
    $this->get('/entries/unpublished/download?file=LICENSE')->assertNotFound();
});

it('reuses the public bundle and revalidates it without sending a session cookie', function () {
    Event::fake([CacheHit::class]);
    $path = '/entries/search-dialog/download';
    $first = $this->get($path)->assertOk();
    $etag = $first->headers->get('ETag');
    expect($etag)->toBe('"'.hash('sha256', $first->getContent()).'"')
        ->and($first->headers->hasCacheControlDirective('public'))->toBeTrue()
        ->and($first->headers->getCookies())->toBeEmpty();
    $this->get($path, ['If-None-Match' => $etag])->assertStatus(304)->assertContent('');
    Event::assertDispatched(CacheHit::class, fn (CacheHit $hit): bool => str_starts_with($hit->key, 'catalogue.zip.'));
});

it('changes the archive when published file contents change at the same path', function () {
    $original = base_path();
    $fixture = sys_get_temp_dir().'/catalogue-bundle-'.bin2hex(random_bytes(12));
    $kit = $fixture.'/kit/components/keyboard-shortcut-label';
    File::ensureDirectoryExists($kit);
    try {
        foreach (['LICENSE', 'kit/components/keyboard-shortcut-label/README.md', 'kit/components/keyboard-shortcut-label/index.html', 'kit/components/keyboard-shortcut-label/shortcut.css'] as $path) {
            File::put($fixture.'/'.$path, 'first');
        }
        $this->app->setBasePath($fixture);
        $bundles = new EntryBundles;
        $first = $bundles->zip('keyboard-shortcut-label');
        File::put($kit.'/index.html', 'other');
        expect($bundles->zip('keyboard-shortcut-label'))->not->toBe($first);
    } finally {
        $this->app->setBasePath($original);
        File::deleteDirectory($fixture);
    }
});
