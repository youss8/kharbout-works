<section class="kit-panel">
    <label>CSV to import<textarea rows="5" wire:model="csv"></textarea></label>
    <div class="kit-row"><button wire:click="parse">Parse CSV</button><button wire:click="loadSample">Load sample</button></div>
    @if($error)<p role="alert">{{ $error }} <button wire:click="parse">Retry</button></p>@endif
    <ul aria-label="Import warnings">@foreach($warnings as $warning)<li>{{ $warning }}</li>@endforeach</ul>
    @if($preview)
        <pre class="whitespace-pre-wrap">{{ json_encode(array_slice($preview,0,50), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
        <small>{{ count($preview) }} parsed · first 50 shown</small><button wire:click="loadRows">Load rows into register</button>
    @endif
    <label>Search register<input type="search" wire:model.live.debounce.300ms="search"></label>
    <table class="w-full table-fixed break-words">
        <caption>Backup schedule · 5 January 2026, 12:00 UTC</caption>
        <thead><tr>@foreach($columns as $column)<th scope="col">{{ $column['label'] }}</th>@endforeach<th>Action</th></tr></thead>
        <tbody>
            @foreach(array_slice($visible,0,100,true) as $id=>$row)
                <tr wire:key="row-{{ $id }}" data-row-tone="{{ $tones[$id][0] }}">
                    @foreach($columns as $key=>$column)
                        <td>
                            <bdi @if(!isset($row[$key])) aria-label="not set" @endif>{{ $row[$key]??'—' }}</bdi>
                            @if($key==='name')
                                <small class="status-badge surface" data-tone="{{ $tones[$id][0] }}">{{ $tones[$id][1] }} {{ $tones[$id][2] }}</small>
                            @endif
                        </td>
                    @endforeach
                    <td><button wire:click="edit({{ $id }})">Edit</button></td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <small>{{ count($visible) }} matches · up to 100 shown</small><button wire:click="download">Export filtered CSV</button>
    @if($editing)
        <form class="kit-panel" wire:submit="save">
            <label><input type="checkbox" wire:model.live="details">Edit internal notes</label>
            @foreach($editable as $key=>$field)
                <label>{{ $field['label'] }}
                    @if($field['type']==='textarea')
                        <textarea wire:model="form.values.{{ $key }}"></textarea>
                    @else
                        <input type="{{ $field['type'] }}" wire:model="form.values.{{ $key }}" @required(!empty($field['required']))>
                    @endif
                </label>
                @error('form.values.'.$key)<p role="alert">{{ $message }}</p>@enderror
            @endforeach
            <div class="kit-row"><button>Save partial update</button><button type="button" wire:click="cancelEdit">Cancel</button></div>
        </form>
    @endif
    @if($payload)
        <h4>Write payload</h4><pre>{{ json_encode($payload, JSON_PRETTY_PRINT) }}</pre>
        <h4>Field diff [spec]</h4><pre>{{ json_encode((object)$diff, JSON_PRETTY_PRINT) }}</pre>
    @endif
</section>
