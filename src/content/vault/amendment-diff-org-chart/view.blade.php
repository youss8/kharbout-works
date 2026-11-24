<section class="kit-panel" x-data="{
    rtl:false, selected:'P1', observer:null,
    init(){const direction=()=>this.rtl=getComputedStyle(this.$root).direction==='rtl'; direction(); this.observer=new MutationObserver(direction);this.observer.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['dir']})},
    destroy(){this.observer?.disconnect()},
    x(value){return this.rtl?510-value:value},
    exportChart(){
        const original=this.$refs.chart;const out=document.createElementNS('http://www.w3.org/2000/svg','svg');
        out.setAttribute('viewBox',original.getAttribute('viewBox'));out.setAttribute('width','510');out.setAttribute('color','#101412');
        const keep=['d','fill','stroke','stroke-width','stroke-dasharray','transform','x','y','width','height','rx','font-size','text-anchor'];
        for(const child of original.children){const copy=child.cloneNode(true);for(const el of [copy,...copy.querySelectorAll('*')]){for(const attr of [...el.attributes])if(!keep.includes(attr.name))el.removeAttribute(attr.name);if(el.tagName==='rect')el.setAttribute('fill','white')}out.append(copy)}
        const uri=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(out)],{type:'image/svg+xml'}));
        const link=document.createElement('a');link.href=uri;link.download='reporting-lines.svg';link.click();setTimeout(()=>URL.revokeObjectURL(uri),1000)
    }
}">
    <div class="kit-row" aria-label="Explorer view">
        @foreach(['Contract','Org chart'] as $view)
            <button wire:click="$set('tab','{{ $view }}')" aria-pressed="{{ $tab===$view?'true':'false' }}">{{ $view }}</button>
        @endforeach
    </div>
    @if($tab==='Contract')
        <label>Demo viewer<select wire:model.live="viewer"><option>Coordinator</option><option>HR manager</option></select></label>
        <div class="kit-row">
            <button wire:click="switchTerms" @disabled(!$signed)>Live terms</button>
            <button wire:click="switchTerms" @disabled($signed)>asSigned() original</button>
        </div>
        <dl class="kit-grid">@foreach($terms as $key=>$value)<div><dt>{{ $key }}</dt><dd><bdi>{{ $value }}</bdi></dd></div>@endforeach</dl>
        @if($payWithheld)<p>🔒 Pay is withheld for this viewer.</p>@endif
        @foreach($chain as [$id,$date,$reason,$before,$after])
            <details><summary>{{ $id }} · <bdi>{{ $date }}</bdi> · {{ $reason }}</summary>
                <dl>@foreach($before as $key=>$val)<div><dt>{{ $key }}</dt><dd><del>{{ $val }}</del> → <ins>{{ $after[$key] }}</ins></dd></div>@endforeach</dl>
            </details>
        @endforeach
    @else
        <div class="kit-row">
            <button wire:click="$toggle('compact')" aria-pressed="{{ $compact?'true':'false' }}">Compact spacing</button>
            <button data-vacancies @click="if(selected==='P3')selected='P1'" wire:click="$toggle('hide')" aria-pressed="{{ $hide?'true':'false' }}">Hide vacancies</button>
            <button @click="exportChart()">Download SVG</button>
        </div>
        <small>Solid line · direct report. Dashed line · technical report. Dashed box · vacancy.</small>
        <svg role="group" data-org-tree aria-label="Reporting lines" viewBox="0 0 510 {{ $height }}" x-ref="chart">
            @foreach($edges as [$sx,$sy,$tx,$ty,$kind])
                <path :d="'M'+x({{ $sx }})+' {{ $sy }} V{{ ($sy+$ty)/2 }} H'+x({{ $tx }})+' V{{ $ty }}'" fill="none" stroke="currentColor" stroke-dasharray="{{ $kind==='tech'?'5 4':'none' }}"/>
            @endforeach
            @foreach($positions as $p)
                <g role="button" tabindex="0" data-position="{{ $p['id'] }}" aria-label="{{ $p['title'] }}{{ $p['vacant']?' · vacant':'' }}"
                    @click="selected='{{ $p['id'] }}'" @keydown.enter.prevent="selected='{{ $p['id'] }}'" @keydown.space.prevent="selected='{{ $p['id'] }}'"
                    :aria-pressed="selected==='{{ $p['id'] }}'" :transform="'translate('+x({{ $p['x'] }})+',{{ $p['y'] }})'">
                    <rect x="-71" y="-15" width="142" height="30" rx="3" fill="var(--bg-surface,white)" stroke="currentColor" :stroke-width="selected==='{{ $p['id'] }}'?2.5:1" stroke-dasharray="{{ $p['vacant']?'4 3':'none' }}"/>
                    <text y="4" text-anchor="middle" fill="currentColor" font-size="11">{{ $p['vacant']?'○ ':'' }}{{ $p['title'] }}</text>
                </g>
            @endforeach
        </svg>
        <p role="status">@foreach($positions as $p)<span x-cloak x-show="selected==='{{ $p['id'] }}'">{{ $p['title'] }} · {{ $p['vacant']?'Vacant':'Filled' }}</span>@endforeach</p>
    @endif
</section>
