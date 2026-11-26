<?php

namespace App\Http\Controllers;

use App\Catalogue\EntryBundles;
use App\Catalogue\EntryCatalogue;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\HeaderUtils;

final class EntryDownloadController
{
    public function __invoke(EntryCatalogue $catalogue, EntryBundles $bundles, Request $request, string $slug): Response
    {
        $entry = $catalogue->entry($slug);

        $bytes = $bundles->zip($entry['slug']);
        $response = response($bytes, 200, [
            'Content-Type' => 'application/zip',
            'Content-Disposition' => HeaderUtils::makeDisposition('attachment', $entry['slug'].'.zip'),
            'Cache-Control' => 'public, max-age=0, must-revalidate',
        ]);
        $response->setEtag(hash('sha256', $bytes));
        $response->isNotModified($request);

        return $response;
    }
}
