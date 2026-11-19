<?php

use App\Catalogue\EntryCatalogue;

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
