<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Validator;

Route::get('/examples/catalogue-search', function (Request $request): JsonResponse {
    $validator = Validator::make($request->query(), [
        'q' => ['nullable', 'string', 'max:80'],
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $query = trim($validator->validated()['q'] ?? '');
    $entries = require __DIR__.'/entries.php';

    $matches = array_values(array_filter($entries, static function (array $entry) use ($query): bool {
        return $query === '' || mb_stripos($entry['title'].' '.$entry['category'], $query) !== false;
    }));

    return response()->json(['data' => $matches, 'count' => count($matches)]);
})->name('examples.catalogue-search');
