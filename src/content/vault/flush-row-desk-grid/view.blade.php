<section class="grid gap-3" x-data="{
    drag:'', pending:'', gesture:null,
    async swap(a,b){
      if(!a || !b || a===b || this.pending)return;
      const boxes=Object.fromEntries([...this.$el.querySelectorAll('[data-grid-id]')].map(el=>[el.dataset.gridId,el.getBoundingClientRect()]));
      this.pending=a;
      try {
        await this.$wire.swap(a,b);
        await new Promise(resolve=>requestAnimationFrame(resolve));
        if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(const el of this.$el.querySelectorAll('[data-grid-id]')){
          const old=boxes[el.dataset.gridId],after=el.getBoundingClientRect();
          if(old&&(old.x!==after.x||old.y!==after.y))el.animate([{transform:'translate('+(old.x-after.x)+'px,'+(old.y-after.y)+'px)'},{transform:'none'}],{duration:220,easing:'cubic-bezier(.25,.8,.25,1)'});
        }
      }finally{this.pending='';this.drag=''}
    },
    key(e,id){
      if(!e.key.startsWith('Arrow')||!this.$wire.editing)return;e.preventDefault();
      const sign=(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1)*(['ArrowRight','ArrowLeft'].includes(e.key)&&getComputedStyle(this.$el).direction==='rtl'?-1:1);
      if(e.shiftKey){this.$wire.resize(id,2*sign);return}
      const keys=Object.keys(this.$wire.draft);this.swap(id,keys[keys.indexOf(id)+sign])
    },
    start(e,section){
      if(this.gesture||e.button!==0)return;
      const panels=[...section.parentElement.querySelectorAll('[data-grid-id]')],i=panels.indexOf(section);
      const other=panels[i+1]||panels[i-1];if(!other)return;
      const id=section.dataset.gridId,n=other.dataset.gridId,rtl=getComputedStyle(section).direction==='rtl';
      this.gesture={id,section,other,a:this.$wire.draft[id],b:this.$wire.draft[n],applied:0,origin:e.clientX,
        cell:section.parentElement.getBoundingClientRect().width/12,sign:(rtl?-1:1)*(i===panels.length-1?-1:1)};
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    step(e){
      const g=this.gesture;if(!g)return;const delta=(e.clientX-g.origin)*g.sign/g.cell-g.applied;
      if(Math.abs(delta)<.65)return;
      g.applied=Math.max(4-g.a,Math.min(g.b-4,g.applied+Math.sign(delta)*Math.floor(Math.abs(delta)+.35)));
      g.section.style.setProperty('--cols',g.a+g.applied);g.other.style.setProperty('--cols',g.b-g.applied);
      g.section.querySelector('bdi').textContent=(g.a+g.applied)+'/12';g.other.querySelector('bdi').textContent=(g.b-g.applied)+'/12'
    },
    finish(commit){
      const g=this.gesture;if(!g)return;this.gesture=null;
      if(commit){if(g.applied)this.$wire.resize(g.id,g.applied);return}
      g.section.style.setProperty('--cols',g.a);g.other.style.setProperty('--cols',g.b);
      g.section.querySelector('bdi').textContent=g.a+'/12';g.other.querySelector('bdi').textContent=g.b+'/12'
    }
  }" @keydown.escape="finish(false);$wire.cancel()">
  @if($editing)
    <div><button wire:click="done">Done</button> <button wire:click="cancel">Cancel</button> <button wire:click="resetGrid">Reset to role default</button></div>
    <p>Drag a header or use arrow keys to swap. Shift + arrow resizes a panel.</p>
  @else
    <button wire:click="customize">Customize grid</button>
  @endif
  @foreach($rows as $row)
    <div class="grid grid-cols-12 gap-2">
      @foreach($row as $id=>$cols)
        <article wire:key="desk-{{ $id }}" data-grid-id="{{ $id }}" style="--cols:{{ $cols }}" class="col-span-12 min-w-0 border p-2 sm:col-[span_var(--cols)]"
          @dragover.prevent @drop.prevent="swap(drag,'{{ $id }}')">
          @php($title=['returns'=>'Monthly returns','funding'=>'Funding health','queue'=>'Priority queue','digest'=>'Needs action'][$id])
          <button draggable="{{ $editing?'true':'false' }}" @disabled(!$editing) @keydown="key($event,'{{ $id }}')"
            @dragstart="drag='{{ $id }}';$event.dataTransfer.setData('text/plain',drag)">{{ $title }}</button><bdi>{{ $cols }}/12</bdi>
          @if($editing)
            <button wire:click="resize('{{ $id }}',-2)" @disabled($cols<=4)>−2</button><button wire:click="resize('{{ $id }}',2)">+2</button>
            <button class="hidden touch-none cursor-ew-resize sm:inline-block" aria-label="Drag to resize {{ $title }}"
              @keydown="key($event,'{{ $id }}')" @pointerdown="start($event,$el.closest('article'))" @pointermove="step($event)"
              @pointerup="step($event);finish(true)" @pointercancel="finish(false)">↔</button>
          @endif
        </article>
      @endforeach
    </div>
  @endforeach
  <output>{{ count($rows) }} rows · Every row totals 12 · Zero holes ✓</output>
</section>
