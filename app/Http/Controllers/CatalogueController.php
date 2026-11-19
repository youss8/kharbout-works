<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryCatalogue;
use App\Catalogue\WorkflowVault;
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

    public function show(EntryCatalogue $catalogue, string $slug): Response
    {
        return Inertia::render('Entry', [
            'entry' => $catalogue->entry($slug),
            'entries' => $catalogue->all(),
        ]);
    }
}
