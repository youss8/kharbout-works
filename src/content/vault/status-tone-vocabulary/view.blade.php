<section class="kit-panel">
  <div class="kit-grid">
    @foreach($states as $state)
      <div class="kit-cell"><x-ui.status-chip :state="$state" :urgency="$urgencies[$state->value]" />
        @if($state->value === 'work' && $this->isOnHold())<span class="status-badge outline" data-tone="warn">Ⅱ On hold</span>@endif
      </div>
    @endforeach
  </div>
  <label><input type="checkbox" wire:model.live="held"> Place in-progress work on hold</label>
  <label>Risk rating <select wire:model.live="rating"><option value="">Not set</option><option>1</option><option>2</option><option>3</option></select></label>
  <p>Likelihood: {{ ['1'=>'Low','2'=>'Medium','3'=>'High'][$rating] ?? 'Not rated' }}</p><label>Priority input<input wire:model.live="raw"></label>
  <p>Reader <strong>{{ $this->readPriority() }}</strong></p>
  <button wire:click="save">Write priority</button><output>Stored {{ $saved }}</output>
  @error('raw') <p role="alert">{{ $message }}</p> @enderror
</section>
