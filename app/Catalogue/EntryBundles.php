<?php

namespace App\Catalogue;

use LogicException;
use Phar;
use PharData;
use RuntimeException;

final class EntryBundles
{
    /** @var array<string, array<string, string>> Archive member names mapped to repository files. */
    private const FILES = [
        'copy-code' => [
            'README.md' => 'kit/components/copy-code/README.md',
            'resources/js/components/CopyCodeButton.tsx' => 'resources/js/components/CopyCodeButton.tsx',
            'resources/css/copy-code.css' => 'resources/css/copy-code.css',
        ],
        'keyboard-shortcut-label' => [
            'README.md' => 'kit/components/keyboard-shortcut-label/README.md',
            'index.html' => 'kit/components/keyboard-shortcut-label/index.html',
            'shortcut.css' => 'kit/components/keyboard-shortcut-label/shortcut.css',
        ],
        'empty-state-page' => [
            'README.md' => 'kit/pages/empty-state-page/README.md',
            'index.html' => 'kit/pages/empty-state-page/index.html',
        ],
        'url-filters' => [
            'README.md' => 'kit/utilities/url-filters/README.md',
            'filters.ts' => 'kit/utilities/url-filters/filters.ts',
            'filters.test.mjs' => 'kit/utilities/url-filters/filters.test.mjs',
        ],
        'catalogue-search' => [
            'README.md' => 'kit/modules/catalogue-search/README.md',
            'routes.php' => 'kit/modules/catalogue-search/routes.php',
            'entries.php' => 'kit/modules/catalogue-search/entries.php',
            'CatalogueSearchTest.php' => 'kit/modules/catalogue-search/CatalogueSearchTest.php',
        ],
        'accessible-ui-review' => [
            'README.md' => 'kit/ai-tools/accessible-ui-review/README.md',
            'SKILL.md' => 'kit/ai-tools/accessible-ui-review/SKILL.md',
            'gem-instructions.md' => 'kit/ai-tools/accessible-ui-review/gem-instructions.md',
        ],
        'search-dialog' => [
            'README.md' => 'kit/components/search-dialog/README.md',
            'SearchDialog.tsx' => 'kit/components/search-dialog/SearchDialog.tsx',
            'search-dialog.css' => 'kit/components/search-dialog/search-dialog.css',
            'Example.tsx' => 'kit/components/search-dialog/Example.tsx',
            'main.tsx' => 'kit/components/search-dialog/main.tsx',
            'index.html' => 'kit/components/search-dialog/index.html',
            'package.json' => 'kit/components/search-dialog/package.json',
            'package-lock.json' => 'kit/components/search-dialog/package-lock.json',
        ],
    ];

    public function zip(string $publishedSlug): string
    {
        $files = self::FILES[$publishedSlug] ?? throw new LogicException('Published entry is missing its bundle.');
        $path = sys_get_temp_dir().'/operations-kit-'.bin2hex(random_bytes(16)).'.zip';
        $archive = new PharData($path);

        try {
            $archive->startBuffering();
            foreach (['LICENSE' => 'LICENSE', ...$files] as $name => $source) {
                $archive->addFile(base_path($source), $name);
            }
            $archive->stopBuffering();

            $bytes = file_get_contents($path);
            if ($bytes === false) {
                throw new RuntimeException('Could not read the generated bundle.');
            }

            return $bytes;
        } finally {
            unset($archive);
            if (is_file($path)) {
                Phar::unlinkArchive($path);
            }
        }
    }
}
