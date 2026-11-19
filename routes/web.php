<?php

use App\Http\Controllers\CatalogueController;
use App\Http\Controllers\EntryDownloadController;
use Illuminate\Support\Facades\Route;

Route::get('/', [CatalogueController::class, 'index'])->name('catalogue.index');
Route::get('/entries/{slug}', [CatalogueController::class, 'show'])
    ->where('slug', '[a-z0-9-]+')
    ->name('catalogue.entry');
Route::get('/entries/{slug}/download', EntryDownloadController::class)
    ->where('slug', '[a-z0-9-]+')
    ->name('catalogue.download');

require base_path('kit/modules/catalogue-search/routes.php');
