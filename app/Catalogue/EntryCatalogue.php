<?php

namespace App\Catalogue;

final class EntryCatalogue
{
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
    ];

    /** @return list<array{slug: string, title: string, summary: string, category: string, requirements: list<string>, href: string}> */
    public function all(): array
    {
        return array_map($this->entry(...), array_keys(self::ENTRIES));
    }

    /** @return array{slug: string, title: string, summary: string, category: string, requirements: list<string>, href: string} */
    public function entry(string $slug): array
    {
        abort_unless(isset(self::ENTRIES[$slug]), 404);

        return [
            'slug' => $slug,
            ...self::ENTRIES[$slug],
            'href' => route('catalogue.entry', ['slug' => $slug], false),
        ];
    }
}
