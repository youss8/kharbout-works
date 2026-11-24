<section class="kit-panel">
    <label>Ask in English or Arabic
        <input type="search" dir="auto" maxlength="200" value="{{ $query }}" wire:input.debounce.150ms="ask($event.target.value)">
    </label>
    <div class="kit-row">
        @foreach(['retrns','العائدات',';hk','late'] as $term)
            <button wire:click="ask('{{ $term }}')"><bdi>{{ $term }}</bdi></button>
        @endforeach
    </div>
    <ul class="kit-list">
        @forelse($rows as $row)
            <li wire:key="{{ $row['key'] }}">
                <button wire:click="pick('{{ $row['key'] }}')">@foreach($row['highlights'] as $part)@if($part['matched'])<mark>{{ $part['text'] }}</mark>@else{{ $part['text'] }}@endif@endforeach</button>
                @if($row['alias'])
                    <bdi>@foreach($row['alias'] as $part)@if($part['matched'])<mark>{{ $part['text'] }}</mark>@else{{ $part['text'] }}@endif@endforeach</bdi>
                @endif
                <small>Match {{ $row['lexical'] }} · intent {{ $row['intent'] }} · layout −{{ $row['penalty'] }} · recent {{ number_format($row['history'],1) }} · total {{ number_format($row['score'],1) }}</small>
            </li>
        @empty
            <li>No matching destination.</li>
        @endforelse
    </ul>
    <p role="status">{{ $selected ? 'Picked '.$selected : '' }}</p>
</section>
