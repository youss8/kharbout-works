<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryBundles;
use App\Catalogue\EntryCatalogue;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class EntryDownloadController
{
    public function __invoke(EntryCatalogue $catalogue, EntryBundles $bundles, string $slug): Response
    {
        $entry = $catalogue->entry($slug);

        return response($bundles->zip($entry['slug']), 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => HeaderUtils::makeDisposition('attachment', $entry['slug'].'.zip'),
        ]);
    }
}
