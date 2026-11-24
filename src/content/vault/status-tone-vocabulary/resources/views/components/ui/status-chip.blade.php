@props(['state', 'urgency' => null])
@php($tone = $state->tone())
<span class="status-badge {{ $tone['shape'] }}" data-tone="{{ $tone['tone'] }}">
    <span aria-hidden="true">{{ $tone['glyph'] }}</span> {{ $tone['label'] }}
</span>
@if($urgency)<small data-urgency="{{ $urgency['variant'] }}">{{ $urgency['label'] }}</small>@endif
