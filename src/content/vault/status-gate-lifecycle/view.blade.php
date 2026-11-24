<section class="kit-panel" x-data>
<ol class="flex gap-2 overflow-auto" aria-label="Proposal lifecycle" x-effect="$wire.current; $nextTick(() => {const step=$el.querySelector('[aria-current=step]'); if(step) $el.scrollBy({left:step.getBoundingClientRect().x+step.clientWidth/2-$el.getBoundingClientRect().x-$el.clientWidth/2})})">
@foreach($steps as $step)
<li data-step-state="{{ $step['state'] }}" @if($step['active']) aria-current="step" @endif>
    <span>{{ $step['glyph'] }} {{ $step['label'] }}</span>
    @if($held && $step['active'])<span class="status-badge dashed">◐ On hold</span>@endif
    @if($step['date'])<small><time datetime="{{ $step['date'] }}"><bdi>{{ $step['date'] }}</bdi></time></small>@endif
</li>
@endforeach
</ol>
<label><input type="checkbox" wire:model.live="held">On hold</label><button wire:click="begin" @disabled(!$legal)>Change status</button>
@if($editing)<dialog aria-label="Transition requirements" x-init="$el.showModal()" @cancel="$wire.editing=false"><label>Next status<select wire:model.live="target">@foreach($legal as $s)<option>{{ $s }}</option>@endforeach</select></label>
@if($target==='Approved')<label><input type="checkbox" wire:model.live="signed">Signed funding agreement</label><label><input type="checkbox" wire:model.live="budget">Budget and dates confirmed</label>@endif
<label>Reason<textarea wire:model.live.debounce.150ms="reason"></textarea></label><button wire:click="concurrentEdit">Simulate concurrent edit</button>@if($version!==$expected)<button wire:click="reloadVersion">Reload latest version</button>@endif
<ul>@foreach($requirements as $message)<li>{{ $message }}</li>@endforeach</ul><button wire:click="$set('editing',false)" autofocus>Cancel</button><button wire:click="changeStatus" @disabled($requirements)>Apply transition</button></dialog>@endif<p role="status">{{ $notice }}</p></section>
