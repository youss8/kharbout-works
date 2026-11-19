<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryCatalogue;
use Inertia\Inertia;
use Inertia\Response;

final class CatalogueController
{
    public function index(EntryCatalogue $catalogue): Response
    {
        return Inertia::render('Browse', ['entries' => $catalogue->all()]);
    }

    public function show(EntryCatalogue $catalogue, string $slug): Response
    {
        return Inertia::render('Entry', ['entry' => $catalogue->entry($slug)]);
    }
}
