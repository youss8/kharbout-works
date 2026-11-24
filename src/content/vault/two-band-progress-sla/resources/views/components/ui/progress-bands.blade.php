@props(['label', 'value' => null, 'max' => 100, 'pending' => 0])
@php
    $percent = $value !== null && $max > 0 ? max(0, $value / $max * 100) : 0;
    $width = min(100, $percent);
    $pendingWidth = $value !== null && $max > 0 ? min(100 - $width, max(0, $pending / $max * 100)) : 0;
    $valueLabel = $value === null ? 'not set' : ($percent > 100 ? 'Over by '.round($percent - 100, 2).'%' : round($percent, 2).'% approved');
@endphp
<div class="kit-track" role="progressbar" data-tone="{{ $percent > 100 ? 'warn' : 'neutral' }}"
    aria-label="{{ $label }}" aria-valuemin="0" aria-valuemax="{{ max(0, $max) }}"
    @if($value !== null) aria-valuenow="{{ max(0, min($value, $max)) }}" @endif aria-valuetext="{{ $valueLabel }}">
    <i style="width:{{ $width }}%"></i><i class="pending" style="width:{{ $pendingWidth }}%"></i>
</div>
