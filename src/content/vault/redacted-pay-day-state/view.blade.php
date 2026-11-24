<section class="kit-panel">
  <label>Active role<select wire:model.live="role"><option>Platform Admin</option><option>HR Manager</option></select></label>
  <form wire:submit="save"><label>Job title<input required wire:model="form.fields.title"></label>
    @if($this->canViewPay())<label>Monthly pay<input required type="number" min="0" step=".01" wire:model="form.fields.pay"></label>
    @else<p class="kit-cell">🔒 Pay is withheld for this role. Saving preserves the stored amount.</p>@endif
    <button>Save contract</button></form>
  @if($receipt)<pre aria-label="Save payload">{{ json_encode($receipt,JSON_PRETTY_PRINT) }}</pre>@endif
  <label>Attendance day<select wire:model.live="day">@foreach($this::DAYS as $id)<option value="{{ $id }}">{{ str_replace('_',' ',$id) }}</option>@endforeach</select></label>
  @if(in_array($day,['one_punch','no_record'],true))
    <span class="status-badge dashed">◐ {{ str_replace('_',' ',$day) }}</span><button wire:click="decide(true)">Mark present</button><button wire:click="decide(false)">Mark absent</button>
  @else<span class="status-badge surface">● {{ str_replace('_',' ',$day) }}</span>@endif
</section>
