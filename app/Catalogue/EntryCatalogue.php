<?php

namespace App\Catalogue;

use Illuminate\Support\Str;
use Normalizer;

/**
 * @phpstan-type Entry array{slug: string, title: string, summary: string, category: string, requirements: list<string>, href: string, downloadHref: string, searchText: string}
 * @phpstan-type Translations array{entries: array<string, array<string, array<string, string>>>, categories: array<string, array<string, string>>, requirements: array<string, array<string, string>>}
 */
final class EntryCatalogue
{
    /** @var Translations */
    private array $translations;

    /** @var array<string, array{title: string, summary: string, category: string, requirements: list<string>}> */
    private const ENTRIES = [
        'copy-code' => [
            'title' => 'Copy code',
            'summary' => 'Copy a snippet exactly as shown, with keyboard support and feedback for failed clipboard writes.',
            'category' => 'Components',
            'requirements' => ['React', 'TypeScript', 'Clipboard API'],
        ],
        'keyboard-shortcut-label' => [
            'title' => 'Keyboard shortcut label',
            'summary' => 'Put a command and its keyboard shortcut side by side.',
            'category' => 'Components',
            'requirements' => ['HTML', 'CSS'],
        ],
        'empty-state-page' => [
            'title' => 'Empty search results',
            'summary' => 'Give visitors a useful way back when their search finds nothing.',
            'category' => 'Pages',
            'requirements' => ['HTML', 'CSS', 'JavaScript'],
        ],
        'url-filters' => [
            'title' => 'Shareable URL filters',
            'summary' => 'Keep search and collection selections in a link that can be bookmarked or shared.',
            'category' => 'Utilities',
            'requirements' => ['TypeScript', 'URL API'],
        ],
        'catalogue-search' => [
            'title' => 'Catalogue search endpoint',
            'summary' => 'Add a small read-only Laravel endpoint that validates a search and returns matching resources.',
            'category' => 'Modules',
            'requirements' => ['Laravel 13', 'PHP 8.4'],
        ],
        'accessible-ui-review' => [
            'title' => 'Accessible UI review',
            'summary' => 'Review an interface with a Claude skill or Gemini Gem and produce findings that a developer can verify.',
            'category' => 'AI tools',
            'requirements' => ['Claude Code or Gemini Gems'],
        ],
        'search-dialog' => [
            'title' => 'Keyboard search dialog',
            'summary' => 'Search a list, move through matches with the arrow keys and open a result without leaving the keyboard.',
            'category' => 'Components',
            'requirements' => ['React', 'TypeScript', 'HTML dialog'],
        ],
    ];

    public function __construct()
    {
        /** @var Translations $translations */
        $translations = json_decode((string) file_get_contents(resource_path('data/catalogue-translations.json')), true, flags: JSON_THROW_ON_ERROR);
        $this->translations = $translations;
    }

    /** @return list<Entry> */
    public function all(): array
    {
        return array_map($this->entry(...), array_keys(self::ENTRIES));
    }

    /** @return Entry */
    public function entry(string $slug): array
    {
        abort_unless(isset(self::ENTRIES[$slug]), 404);

        $entry = self::ENTRIES[$slug];
        $words = [$entry['title'], $entry['summary'], $entry['category'], ...$entry['requirements']];
        foreach ($this->translations['entries'][$slug] ?? [] as $translation) {
            array_push($words, ...array_values($translation));
        }
        foreach ([$entry['category'], ...$entry['requirements']] as $label) {
            $translations = $this->translations['categories'][$label] ?? $this->translations['requirements'][$label] ?? [];
            array_push($words, ...array_values($translations));
        }

        return [
            'slug' => $slug,
            ...$entry,
            'searchText' => $this->searchable(implode(' ', $words)),
            'href' => route('catalogue.entry', ['slug' => $slug], false),
            'downloadHref' => route('catalogue.download', ['slug' => $slug], false),
        ];
    }

    /**
     * @param  list<Entry>  $entries
     * @param  array<string, string>  $filters
     * @return list<Entry>
     */
    public function filtered(array $entries, array $filters): array
    {
        $terms = preg_split('/\s+/u', $this->searchable($filters['q'] ?? ''), flags: PREG_SPLIT_NO_EMPTY) ?: [];
        $categories = array_map(Str::slug(...), array_column($entries, 'category'));
        $category = $filters['category'] ?? '';
        $filterCategory = in_array($category, $categories, true);
        $matches = [];
        foreach ($entries as $entry) {
            if ($filterCategory && Str::slug($entry['category']) !== $category) {
                continue;
            }
            if (array_all($terms, static fn (string $term): bool => str_contains($entry['searchText'], $term))) {
                $entry['href'] = route('catalogue.entry', ['slug' => $entry['slug'], ...$filters], false);
                $matches[] = $entry;
            }
        }

        return $matches;
    }

    private function searchable(string $value): string
    {
        return mb_strtolower((string) preg_replace('/\p{M}+/u', '', (string) Normalizer::normalize($value, Normalizer::FORM_D)));
    }
}
