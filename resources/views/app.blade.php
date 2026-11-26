<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        @viteReactRefresh
        @vite('resources/js/app.tsx')
        <x-inertia::head>
            <title>{{ isset($page['props']['entry']) ? $page['props']['entry']['title'].' · ' : '' }}Kharbout Works</title>
        </x-inertia::head>
    </head>
    <body>
        <x-inertia::app />
        @include('catalogue-fallback')
    </body>
</html>
