<section class="kit-panel">
    <div class="kit-row">
        <label>Active role<select wire:model.live="role"><option>Employee</option>@can('vault.regional-hr')<option>Regional HR</option>@endcan</select></label>
        <label>Search register<input type="search" maxlength="100" wire:model.live.debounce.300ms="query"></label>
        <label>Contract order<select wire:model.live="sort"><option>Ascending</option><option>Descending</option></select></label>
    </div>
    <div data-header-chips aria-label="Active filters">
        @if($status)<button wire:click="applyFilters([])">Clear status · {{ implode(', ',$status) }} ×</button>@endif
        @if($region)<button wire:click="applyRegion('')">Clear region · {{ $region }} ×</button>@endif
        @if($query)<button wire:click="$set('query','')">Clear search · {{ $query }} ×</button>@endif
    </div>
    <table>
        <thead style="position:sticky;inset-block-start:0;background:Canvas"><tr><th scope="col">Contract</th>
            <th scope="col" wire:key="region-{{ $role }}"><x-ui.header-select label="Filter region" wire:model="region" action="applyRegion">
                <option value="">All regions</option><option>North</option><option>East</option><option disabled>West (inactive)</option>
            </x-ui.header-select></th>
            <th scope="col" wire:key="status-{{ $role }}"><x-ui.header-select label="Filter status" wire:model="status" action="applyFilters" :multiple="true">
                @foreach($this->allowed() as $state)<option>{{ $state }}</option>@endforeach<option disabled>Archived</option>
            </x-ui.header-select></th>
        </tr></thead>
        <tbody wire:loading.attr="data-loading" wire:target="query,applyFilters,applyRegion">@forelse($rows as [$label,$regionName,$state])<tr><td>{{ $label }}</td><td>{{ $regionName }}</td><td>{{ $state }}</td></tr>
        @empty<tr><td colspan="3">No contracts match.</td></tr>@endforelse</tbody>
    </table>
    <p aria-live="polite">{{ count($rows) }} matching contracts</p>
    <label>View name<input wire:model="name" maxlength="60"></label><button wire:click="saveView">Save view</button>
    @error('name')<p role="alert">{{ $message }}</p>@enderror
    @foreach($views as $id=>$view)<p>{{ $view['name'] }} · {{ $view['role'] }} <button wire:click="applyView('{{ $id }}')">Apply</button><button wire:click="deleteView('{{ $id }}')">Delete view</button></p>@endforeach
    <p role="status">{{ $notice }}</p>
</section>
