<section wire:poll.15s="refreshTelemetry" class="grid gap-3" x-data="{active:0, selected:1, left:0, top:0,
  open(id,button){this.selected=id;this.active=id;const r=button.getBoundingClientRect();this.left=Math.max(8,Math.min(r.left,innerWidth-232));this.top=r.bottom+140<innerHeight?r.bottom+4:Math.max(8,r.top-130)} }" @keydown.escape="active=0" @resize.window="active=0">
  <div><label>Branch <select wire:model="branch">@foreach($groups->keys() as $b)<option>{{ $b }}</option>@endforeach</select></label>
  <button wire:click="outage">Simulate branch outage</button> <button @click="$wire.checkIn(selected)">Simulate agent check-in</button></div>
  <p>● Online · ◐ Stale · ○ Never seen</p>
  <p>Last refresh <time data-poll-clock>{{ gmdate('H:i:s',$asOf) }} UTC</time> · 15-second interval</p>
  @foreach($groups as $name=>$ports)
    <h3>{{ $name }} · {{ $ports->filter(fn($p)=>$p['seen']!==null && $asOf-$p['seen']<=900)->count() }}/{{ count($ports) }} online</h3>
    <div class="grid grid-flow-col grid-rows-2 auto-cols-[minmax(2.75rem,1fr)] gap-1 overflow-x-auto" @scroll="active=0">
      @foreach($ports as $p)
        @php($label=$p['seen']===null?'○ Never seen':($asOf-$p['seen']>900?'◐ Stale':'● Online'))
        <button wire:key="port-{{ $p['id'] }}" class="border p-1" aria-label="{{ $p['name'] }} · {{ $label }}"
          @focus="open({{ $p['id'] }},$el)" @mouseenter="open({{ $p['id'] }},$el)" @click="open({{ $p['id'] }},$el)" @mouseleave="active=0" @blur="active=0">{{ explode(' ',$label)[0] }} <bdi>{{ $p['id'] }}</bdi></button>
      @endforeach
    </div>
  @endforeach
  <div role="tooltip" x-show="active" class="fixed z-10 w-56 border bg-surface p-2" :style="{insetInlineStart:(getComputedStyle($el).direction==='rtl'?innerWidth-left-224:left)+'px',insetBlockStart:top+'px'}">
    <template x-for="p in Object.values($wire.ports).filter(p=>p.id===active)" :key="p.id"><div><strong x-text="p.name"></strong><p x-text="p.seen===null?'Never seen':Math.floor(($wire.asOf-p.seen)/60)+' minutes since check-in'"></p>
      <template x-for="k in ['cpu','ram','disk']"><p><span x-text="k.toUpperCase()"></span> <meter x-show="p.seen!==null" :aria-label="k" min="0" max="100" :value="p[k]"></meter> <bdi x-text="p.seen===null?'—':p[k]+'%'"></bdi></p></template>
    </div></template>
  </div>
</section>
