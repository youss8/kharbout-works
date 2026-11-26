<main id="catalogue-fallback" class="shell main-content">
    @isset($page['props']['entry'])
        @php($entry = $page['props']['entry'])
        <a class="back-link" href="{{ $page['props']['backHref'] }}">← Back to catalogue</a>
        <header class="entry-intro">
            <p class="metadata">{{ $entry['category'] }}</p>
            <h1>{{ $entry['title'] }}</h1>
            <p>{{ $entry['summary'] }}</p>
            <a class="entry-download" href="{{ $entry['downloadHref'] }}" download>Download source (.zip)</a>
        </header>
        <h2>Requirements</h2>
        <ul>
            @foreach ($entry['requirements'] as $requirement)
                <li>{{ $requirement }}</li>
            @endforeach
        </ul>
    @elseif (isset($page['props']['entries']))
        <h1>Kharbout Works catalogue</h1>
        <ul>
            @foreach ($page['props']['entries'] as $entry)
                <li>
                    <h2><a href="{{ $entry['href'] }}">{{ $entry['title'] }}</a></h2>
                    <p>{{ $entry['summary'] }}</p>
                </li>
            @endforeach
        </ul>
    @endisset
</main>
