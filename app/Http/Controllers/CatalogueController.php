<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryCatalogue;
use App\Catalogue\WorkflowVault;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class CatalogueController
{
    public function index(EntryCatalogue $catalogue, WorkflowVault $vault, Request $request): Response
    {
        $entries = $catalogue->all();

        return Inertia::render('Browse', [
            'entries' => $entries,
            'workflows' => $vault->all(),
        ])->withViewData('fallbackEntries', $catalogue->filtered($entries, $this->filters($request)));
    }

    public function show(EntryCatalogue $catalogue, Request $request, string $slug): Response
    {
        $filters = $this->filters($request);

        return Inertia::render('Entry', [
            'entry' => $catalogue->entry($slug),
            'entries' => $catalogue->all(),
            'backHref' => route('catalogue.index', $filters, false).($filters ? '#catalogue' : ''),
        ]);
    }

    /** @return array<string, string> */
    private function filters(Request $request): array
    {
        // URLSearchParams.get() uses the first value when a shared URL repeats a key.
        $query = HeaderUtils::parseQuery($request->server->getString('QUERY_STRING'), ignoreBrackets: true);
        $filters = [];
        foreach (['q', 'category'] as $key) {
            $value = $query[$key][0] ?? null;
            if (is_string($value) && trim($value) !== '') {
                $filters[$key] = trim($value);
            }
        }

        return $filters;
    }
}
