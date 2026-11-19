<?php

use Tests\TestCase;

final class CatalogueSearchTest extends TestCase
{
    public function test_lists_the_public_entries_without_a_query(): void
    {
        $this->getJson('/examples/catalogue-search')->assertOk()
            ->assertJsonCount(3, 'data')->assertJsonPath('count', 3);
    }

    public function test_searches_by_title_or_category_case_insensitively(): void
    {
        foreach (['FILTERS', 'utilities'] as $query) {
            $this->getJson('/examples/catalogue-search?q='.$query)->assertExactJson([
                'data' => [['slug' => 'shareable-filters', 'title' => 'Shareable URL filters', 'category' => 'Utilities']],
                'count' => 1,
            ]);
        }
    }

    public function test_returns_an_empty_list_on_no_match(): void
    {
        $this->getJson('/examples/catalogue-search?q=unlisted')->assertOk()
            ->assertExactJson(['data' => [], 'count' => 0]);
    }

    public function test_rejects_invalid_input_as_json_even_for_browser_requests(): void
    {
        foreach (['?q%5B%5D=filters', '?q='.str_repeat('x', 81)] as $query) {
            $this->get('/examples/catalogue-search'.$query)->assertUnprocessable()
                ->assertJsonValidationErrors('q');
        }
    }
}
