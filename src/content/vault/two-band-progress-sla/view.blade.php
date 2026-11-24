<section class="kit-panel delivery-preview" wire:poll.30s="tick">
  <label>Approved (%)<input type="range" min="0" max="140" wire:model.live.number="approved"></label>
  <label>Pending (%)<input type="range" min="0" max="100" wire:model.live.number="pending"></label>
  <label><input type="checkbox" wire:model.live="missing"> No approved reading</label>
  <output><bdi @if($missing) aria-label="not set" @endif>{{ $missing ? '—' : ($approved > 100 ? '◐ Over by '.($approved-100).'%' : $approved.'% approved') }}</bdi> · {{ $pending }}% pending</output>
  <x-ui.progress-bands label="Approved delivery" :value="$missing ? null : $approved" :pending="$pending" />
  <label>SLA elapsed minutes<input type="range" min="0" max="2910" wire:model.live.number="elapsed"></label>
  <label>Ticket state<select wire:model.live="mode"><option>Open</option><option>Closed</option><option>Missing SLA</option></select></label>
  <label>Time language<select wire:model.live="locale"><option value="en">English</option><option value="ar">العربية</option></select></label>
  <bdi lang="{{ $locale }}" @if($mode === 'Missing SLA') aria-label="not set" @endif>{{ $this->remaining }}</bdi><div class="kit-track" role="progressbar" aria-label="Elapsed SLA" aria-valuemin="0" aria-valuemax="100" @if($mode !== 'Missing SLA') aria-valuenow="{{min(100,max(0,$elapsed/28.8))}}" @endif aria-valuetext="{{$this->remaining}}"><i style="width:{{ $mode === 'Missing SLA' ? 0 : min(100,max(2,$elapsed/28.8)) }}%"></i></div>
  <fieldset class="kit-panel"><legend>Funding capacity</legend>
    <div class="kit-grid">
      <label>Received amount<input type="number" min="0" step="0.01" wire:model.live.number="received"></label>
      <label>Committed amount<input type="number" min="0" step="0.01" wire:model.live.number="committed"></label>
      <label>Funding currency<select aria-label="Funding currency" wire:model.live="currency"><option value="">Not set</option><option>USD</option><option>EUR</option></select></label>
    </div>
    @if($funding = $this->funding['value'])
      <dl class="kit-row items-baseline tabular-nums"><div><dt>Received</dt><dd>{{ $funding['received'] }}</dd></div><div><dt>Committed</dt><dd>{{ $funding['committed'] }}</dd></div></dl>
      <div class="kit-track" role="progressbar" aria-label="Funding received" aria-valuemin="0" aria-valuemax="{{ max(0,$committed) }}" aria-valuenow="{{ max(0,min($received,$committed)) }}" aria-valuetext="{{ $funding['received'].' of '.$funding['committed'].' · '.$funding['label'] }}"><i style="width:{{ $funding['width'] }}%;background:{{ $funding['over'] ? 'var(--status-warn)' : 'var(--accent-primary)' }}"></i></div>
      <p aria-live="polite" data-tone="{{ $funding['over'] ? 'warn' : 'neutral' }}">{{ ($funding['over'] ? '◐ ' : '').$funding['label'] }}</p>
    @else
      <p role="alert">{{ $this->funding['error'] }} <button type="button" wire:click="$set('currency','USD')">Retry with USD</button></p>
    @endif
  </fieldset>
</section>
