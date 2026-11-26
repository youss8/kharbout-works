<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryCatalogue;
use App\Catalogue\WorkflowVault;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CatalogueController
{
    public function index(EntryCatalogue $catalogue, WorkflowVault $vault): Response
    {
        return Inertia::render('Browse', [
            'entries' => $catalogue->all(),
            'workflows' => $vault->all(),
        ]);
    }

    public function show(EntryCatalogue $catalogue, Request $request, string $slug): Response
    {
        $filters = [];
        foreach (['q', 'category'] as $key) {
            $value = $request->query($key);
            if (is_string($value) && trim($value) !== '') {
                $filters[$key] = trim($value);
            }
        }

        return Inertia::render('Entry', [
            'entry' => $catalogue->entry($slug),
            'entries' => $catalogue->all(),
            'backHref' => route('catalogue.index', $filters, false).($filters ? '#catalogue' : ''),
        ]);
    }
}
