<section class="grid gap-3" x-data="{hover:'',focus:'',trace(id,edges){
  if(!id)return [];
  const result=new Set([id]);
  for(const reverse of [false,true]){
    const queue=[id],seen=new Set(queue);
    for(let i=0;i<queue.length;i++)for(const [from,targets] of Object.entries(edges))for(const to of Object.keys(targets)){
      const a=reverse?to:from,b=reverse?from:to;if(queue[i]===a&&!seen.has(b)){queue.push(b);seen.add(b);result.add(b)}
    }
  }
  return [...result];
},hot(id){const picked=this.hover||this.focus||this.$wire.picked;return !picked||this.trace(picked,this.$refs.flowEdges?JSON.parse(this.$refs.flowEdges.textContent):{}).includes(id)}}"
  @keydown.escape="hover='';focus='';if($wire.picked)$wire.selectNode($wire.picked)">
  <script x-ref="flowEdges" type="application/json">@json($edges)</script>
  <div>@foreach(['USD','EUR'] as $c)<button wire:click="chooseCurrency('{{ $c }}')" aria-pressed="{{ $currency===$c?'true':'false' }}">{{ $c }}</button> @endforeach</div>
  <div wire:key="flow-{{ $currency }}" class="relative grid grid-cols-3 gap-3"
    x-data="{ edges:@js($edges), observer:null, changes:null,
      draw(){
        const box=this.$el.getBoundingClientRect(), svg=this.$refs.svg, rtl=getComputedStyle(this.$el).direction==='rtl';
        if(!box.width)return;
        const totals={},incoming={},rects={};
        for(const el of this.$el.querySelectorAll('[data-node]'))rects[el.dataset.node]=el.getBoundingClientRect();
        for(const [from,targets] of Object.entries(this.edges))for(const [to,value] of Object.entries(targets)){
          totals[from]=(totals[from]||0)+value;incoming[to]=(incoming[to]||0)+value;
        }
        const scale=Math.min(...[totals,incoming].flatMap(m=>Object.entries(m).map(([id,n])=>rects[id].height*.72/n)));
        const slots=m=>Object.fromEntries(Object.entries(m).map(([id,total])=>[id,rects[id].top-box.top+(rects[id].height-total*scale)/2]));
        const starts=slots(totals),ends=slots(incoming);
        svg.replaceChildren();
        for(const [from,targets] of Object.entries(this.edges)) for(const [to,value] of Object.entries(targets)){
          const a=this.$el.querySelector('[data-node='+CSS.escape(from)+']').getBoundingClientRect();
          const b=this.$el.querySelector('[data-node='+CSS.escape(to)+']').getBoundingClientRect();
          const x=(rtl?a.left:a.right)-box.left, end=(rtl?b.right:b.left)-box.left, mid=(x+end)/2;
          const w=value*scale/2,y=starts[from]+w,z=ends[to]+w;starts[from]=y+w;ends[to]=z+w;
          const path=document.createElementNS('http://www.w3.org/2000/svg','path');
          path.setAttribute('d','M '+x+' '+(y-w)+' C '+mid+' '+(y-w)+' '+mid+' '+(z-w)+' '+end+' '+(z-w)+' L '+end+' '+(z+w)+' C '+mid+' '+(z+w)+' '+mid+' '+(y+w)+' '+x+' '+(y+w)+' Z');
          path.dataset.from=from;path.dataset.to=to;svg.append(path);
        }
      },
      init(){this.observer=new ResizeObserver(()=>this.draw());this.observer.observe(this.$el);this.changes=new MutationObserver(()=>this.draw());this.changes.observe(document.documentElement,{attributes:true,attributeFilter:['dir']})},
      destroy(){this.observer.disconnect();this.changes.disconnect()} }">
    <svg wire:ignore x-ref="svg" aria-hidden="true" class="pointer-events-none absolute inset-0 size-full fill-current opacity-40"
      x-effect="hover;focus;$wire.picked;Array.from($el.children).forEach(p=>p.style.opacity=hot(p.dataset.from)&&hot(p.dataset.to)?1:.2)"></svg>
    @foreach($columns as $index=>$nodes)
      <section class="relative grid min-w-0 gap-3"><strong>{{ ['Sponsors','Proposals','Projects'][$index] }}</strong>
        @foreach($nodes as $node)
          <button data-node="{{ $node }}" wire:click="selectNode('{{ $node }}')" aria-pressed="{{ $picked===$node?'true':'false' }}"
            @focus="focus='{{ $node }}'" @blur="focus=''" @mouseenter="hover='{{ $node }}'" @mouseleave="hover=''"
            class="border p-2 break-all" :class="hot('{{ $node }}')?'':'opacity-40'">{{ $node }}</button>
        @endforeach
      </section>
    @endforeach
  </div>
  <table><caption>Agreement register · {{ $currency }}</caption>
    <thead><tr><th scope="col">Agreement</th><th scope="col">Sponsor → proposal</th><th scope="col">Budget</th></tr></thead>
    <tbody>@foreach($agreements as [$id,$s,$p,$c,$amount])
      <tr :class="hot('{{ $s }}')&&hot('{{ $p }}')?'font-bold':'opacity-50'"><th scope="row"><bdi>{{ $id }}</bdi></th><td><bdi>{{ $s }} → {{ $p }}</bdi></td><td><bdi>{{ $c }} {{ number_format($amount) }}</bdi></td></tr>
    @endforeach</tbody></table>
</section>
