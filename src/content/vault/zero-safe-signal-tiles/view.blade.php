<section class="kit-panel">
    <div class="kit-grid" role="group" aria-label="Status filters">
        @foreach($this::GROUPS as $id => [$label,$tone,$glyph])
            @php($n=$this->counts[$id])
            <button wire:key="tile-{{ $id }}" wire:click="toggleSlice('{{ $id }}')" aria-label="{{ $label }}, {{ $n }}" aria-pressed="{{ $slice === $id ? 'true' : 'false' }}">
                <span class="status-badge {{ $n ? 'surface' : 'outline' }}" data-tone="{{ $n ? $tone : 'neutral' }}">
                    <span aria-hidden="true">{{ $n ? $glyph : '○' }}</span> {{ $label }}
                </span>
                <bdi aria-hidden="true" data-count="{{ $n }}" x-data="{
                    frame:0, observer:null, target:null,
                    paint(){
                        const end=Number(this.$el.dataset.count), start=this.target??0, from=performance.now();this.target=end;
                        cancelAnimationFrame(this.frame);
                        if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.$el.textContent=end;return}
                        const tick=now=>{const t=Math.min(1,(now-from)/220);this.$el.textContent=Math.round(start+(end-start)*(1-(1-t)**3));if(t<1)this.frame=requestAnimationFrame(tick)};
                        this.frame=requestAnimationFrame(tick)
                    },
                    init(){this.observer=new MutationObserver(()=>this.paint());this.observer.observe(this.$el,{attributes:true,attributeFilter:['data-count']});this.paint()},
                    destroy(){this.observer.disconnect();cancelAnimationFrame(this.frame)}
                }">{{ $n }}</bdi>
                @if($slice===$id)<span class="ms-auto" aria-hidden="true" title="Show everything">×</span>@endif
            </button>
        @endforeach
    </div>
    <div class="signal-strip" role="group" aria-label="Filter by segment">@if(!count($rows))<span>No records</span>@endif
        @foreach($this->counts as $id=>$n)
            @if($n)
                <button class="signal-segment" style="--segment:{{ max(2,100*$n/count($rows)) }}" wire:click="toggleSlice('{{ $id }}')" aria-label="Filter {{ $this::GROUPS[$id][0] }}" aria-pressed="{{ $slice === $id ? 'true' : 'false' }}">
                    <span aria-hidden="true" data-tone="{{ $this::GROUPS[$id][1] }}"></span>
                </button>
            @endif
        @endforeach
    </div>
    <div class="kit-row"><button wire:click="clearBreaches">Zero out breaches</button><button class="underline" wire:click="$set('slice','')">Show all</button></div>
    <output aria-live="polite">Showing {{ $slice ? ($this->counts[$slice] ?? 0) : count($rows) }} of {{ count($rows) }}</output>
    <ul>@foreach($rows as $i=>$state) @if(!$slice || $slice===$state)<li><bdi>REQ-{{ 101+$i }}</bdi> · {{ $this::GROUPS[$state][0] }}</li>@endif @endforeach</ul>
</section>
