<section>
  <button wire:click="refreshInventory('fast')">Fast fetch (80ms)</button><button wire:click="refreshInventory('slow')">Slow fetch (900ms)</button><button wire:click="refreshInventory('fail')">Simulate failure</button>
  <div wire:loading.attr="data-loading" wire:target="refreshInventory" style="transition:opacity 220ms cubic-bezier(.25,.8,.25,1) 150ms" class="inventory-results">
    <p>Inventory revision {{ $revision }}</p><ul>@foreach($rows as $row)<li>{{ $row }}</li>@endforeach</ul>
  </div><style>.inventory-results[data-loading]{cursor:progress;opacity:.72}</style>
  <span role="status" wire:loading.delay.short wire:target="refreshInventory">Refreshing inventory…</span>
  @if($error)<div role="alert">{{ $error }} <button wire:click="refreshInventory('fast')">Retry</button></div>@endif
  <label>CSV notes cell <input wire:model.live.debounce.150ms="cell"></label><code>{{ $this->escapedCell($cell) }}</code><button wire:click="download">Download CSV</button>
</section>
