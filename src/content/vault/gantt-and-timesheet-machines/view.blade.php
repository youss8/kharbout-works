<section class="grid gap-3" x-data="{tab:new URLSearchParams(location.search).get('panel')==='timesheet'?'Timesheet':'Gantt',cell:18,viewport:0,critical:true,start:null,route:'selected',offset:0,visible:1,hdrag:null,
      sync(){const p=this.$refs.plot;if(!p||!p.clientWidth)return;this.viewport=p.clientWidth;this.visible=Math.min(1,p.clientWidth/p.scrollWidth);this.offset=Math.abs(p.scrollLeft)/p.scrollWidth},
      pan(x){const p=this.$refs.plot;p.scrollLeft=(getComputedStyle(p).direction==='rtl'?-1:1)*Math.max(0,Math.min(1-this.visible,x))*p.scrollWidth;this.sync()},
      point(e,el){const r=el.getBoundingClientRect();return (getComputedStyle(el).direction==='rtl'?r.right-e.clientX:e.clientX-r.left)/r.width},
      begin(e){const el=e.currentTarget,x=this.point(e,el);this.hdrag=x>=this.offset&&x<=this.offset+this.visible?x-this.offset:this.visible/2;el.setPointerCapture(e.pointerId);this.pan(x-this.hdrag)},
      keys(e){if(!['Home','End','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const sign=(e.key==='ArrowRight'?1:-1)*(getComputedStyle(e.currentTarget).direction==='rtl'?-1:1);this.pan(e.key==='Home'?0:e.key==='End'?1:this.offset+sign*this.cell/this.$refs.plot.scrollWidth)},
      observer:null,init(){this.$nextTick(()=>{this.observer=new ResizeObserver(()=>this.sync());this.observer.observe(this.$refs.plot);this.sync()});this.$watch('cell',() => this.$nextTick(()=>this.sync()))},destroy(){this.observer?.disconnect()}
  }" @keydown.ctrl.z.prevent="if(tab==='Gantt') $event.shiftKey?$wire.redo():$wire.undo()">
  <div><button @click="tab='Gantt'">Gantt</button> <button @click="tab='Timesheet'">Timesheet</button></div>
  <div x-show="tab==='Gantt'">
    <label>Zoom <select x-model.number="cell">@foreach([8,12,18,25,34] as $size)<option value="{{ $size }}">{{ $size }} px/day</option>@endforeach</select></label>
    <label><input type="checkbox" x-model="critical"> Critical path</label>
    <label>Trace task <select wire:change="selectTask($event.target.value)"><option value="-1" @selected($selected===-1)>Delivery plan · parent</option>@foreach($names as $id=>$name)<option value="{{ $id }}" @selected($selected===$id)>{{ $name }}</option>@endforeach</select></label>
    <label>Route emphasis <select x-model="route"><option value="selected">Selected route</option><option value="all">All routes</option><option value="none">None</option></select></label>
    <p>Delivery plan · {{ $selected===-1?'Selected':'Context' }}</p>
    <div role="slider" tabindex="0" aria-label="Schedule horizon" aria-valuemin="0" :aria-valuenow="Math.round(offset*{{ $days }})" :aria-valuemax="Math.ceil((1-visible)*{{ $days }})"
      class="relative h-14 touch-pan-y border" @pointerdown="begin($event)" @pointermove="if(hdrag!==null)pan(point($event,$el)-hdrag)" @pointerup="hdrag=null" @pointercancel="hdrag=null" @keydown="keys($event)">
      @for($month=0;;$month++)
        @php($monthStart=(new DateTimeImmutable('2026-03-01T00:00:00Z'))->modify('+'.$month.' months'))
        @php($offset=(int)(($monthStart->getTimestamp()-strtotime('2026-03-01T00:00:00Z'))/86400))
        @break($offset >= $days)
        <small class="absolute top-0 text-xs" style="inset-inline-start:{{ $offset/$days*100 }}%" x-show="{{ $month }}===0||((30*viewport/{{ $days }}>=34||{{ $month%3 }}===0) && ({{ $days-$offset }}*viewport/{{ $days }}>=44))">{{ $monthStart->format('Y-m') }}</small>
      @endfor
      @foreach($rows as $i=>[$begin,$finish])<i class="absolute h-1 bg-current" :class="route==='all'||(route==='selected'&&{{ isset($trace[$i])?'true':'false' }})?'opacity-100':'opacity-30'" style="inset-inline-start:{{ ($begin-1)/$days*100 }}%;inline-size:{{ ($finish-$begin+1)/$days*100 }}%;inset-block-start:{{ 1+$lanes[$i]*.3 }}rem"></i>@endforeach
      <span class="absolute inset-y-0 border-2 border-current" :style="{insetInlineStart:offset*100+'%',inlineSize:visible*100+'%'}"></span>
    </div>
    <div class="overflow-x-auto" x-ref="plot" @scroll="sync()" tabindex="0" aria-label="Task schedule">
      @foreach($rows as $id=>[$start,$end])

        <div class="relative h-12" :style="{inlineSize:{{ $days }}*cell+'px'}">
          @for($d=1;$d<=$days;$d++)
            @if(in_array(($d-1)%7,[5,6]))<i class="absolute inset-y-0 bg-gray-100" :style="{insetInlineStart:{{ $d-1 }}*cell+'px',inlineSize:cell+'px'}"></i>@endif
          @endfor
          <i class="absolute bottom-0 border-b-2 border-dashed" :style="{insetInlineStart:{{ max(0,$details[$id]['baselineEnd']-($end-$start+1)) }}*cell+'px',inlineSize:{{ $end-$start+1 }}*cell+'px'}"></i>
          @if($end>$details[$id]['baselineEnd'])<i class="absolute bottom-0 border-b-2 border-amber-700" :style="{insetInlineStart:{{ $details[$id]['baselineEnd'] }}*cell+'px',inlineSize:{{ $end-$details[$id]['baselineEnd'] }}*cell+'px'}" aria-label="Delayed past baseline"></i>@endif
          <button class="absolute top-1 overflow-hidden whitespace-nowrap border text-start" :class="{'border-t-4':critical&&{{ isset($critical[$id])?'true':'false' }},'opacity-50':route==='none'||(route==='selected'&&!{{ isset($trace[$id])?'true':'false' }})}"
            :style="{insetInlineStart:{{ $start-1 }}*cell+'px',inlineSize:{{ $end-$start+1 }}*cell+'px'}" @click="$wire.selectTask({{ $id }})"
            @pointerdown="start=$event.clientX;$el.setPointerCapture($event.pointerId)"
            @pointerup="if(start!==null){const delta=Math.round(($event.clientX-start)*(getComputedStyle($el).direction==='rtl'?-1:1)/cell);if(delta)$wire.move({{ $id }},delta); start=null}">{{ $names[$id] }}</button>
        </div>
      @endforeach
    </div>
    <div><button @disabled($selected===-1) wire:click="move({{ $selected }},-1)">Move −1 day</button> <button @disabled($selected===-1) wire:click="move({{ $selected }},1)">Move +1 day</button>
      <button wire:click="undo" @disabled(!$history)>Undo</button> <button wire:click="redo" @disabled(!$future)>Redo</button></div>
    <ul>@foreach($rows as $id=>[$start,$end])@if(isset($trace[$id]))<li>{{ $roles[$id] }} · {{ $details[$id]['wbs'] }} · {{ $names[$id] }} · {{ $details[$id]['progress'] }}% complete · days {{ $start }}–{{ $end }}</li>@endif @endforeach</ul>
    <ol aria-label="Task funding routes">@foreach($details as $id=>$detail)<li class="border-s-2 ps-2" :class="route==='all'||(route==='selected'&&{{ isset($trace[$id])?'true':'false' }})?'font-bold':'opacity-50'" data-traced="{{ isset($trace[$id])?'true':'false' }}"><bdi>{{ $detail['wbs'] }}</bdi> → <bdi>{{ $detail['proposal'] }}</bdi> → <bdi>{{ $detail['agreement'] }}</bdi> · {{ isset($trace[$id])?'On route':'Off route' }}</li>@endforeach</ol>
  </div>
  <div x-show="tab==='Timesheet'"><strong>{{ $status }}</strong> · Overtime 4h · Leave credit {{ $credit }}h
    <label>Acting role <select wire:model.live="role">@foreach(['Employee','Manager','HR'] as $r)<option>{{ $r }}</option>@endforeach</select></label>
    @foreach(['March 3 · one punch','March 9 · zero punches'] as $i=>$label)
      <label>{{ $label }} <select @disabled($status!=='Open'||$role!=='Employee') wire:change="answer({{ $i }},$event.target.value)">
        <option disabled @selected(!$answers[$i])>Resolve day</option>@foreach(['Worked','Absent','Leave'] as $a)<option @selected($answers[$i]===$a)>{{ $a }}</option>@endforeach</select></label>
    @endforeach
    @if($role==='Manager')<label><input type="checkbox" wire:model="self"> Approving my own month</label>@endif
    @if($status==='Locked' && $role==='HR')<label><input type="checkbox" @checked($consumed) wire:change="consumption($event.target.checked)"> Credit consumed</label>@endif
    @php($responsible=['Open'=>'Employee','Confirmed'=>'Manager','Approved'=>'HR','Locked'=>'HR'][$status])
    <p>Next decision · {{ $responsible }}</p>
    <button wire:click="advance" @disabled($role!==$responsible)>{{ ['Open'=>'Confirm','Confirmed'=>'Approve','Approved'=>'Lock','Locked'=>'Reopen'][$status] }}</button>
    <button wire:click="exportMonth" @disabled(in_array('',$answers,true))>Export timesheet</button>
    <button @click="window.print()" @disabled(in_array('',$answers,true))>Print timesheet</button>
    @if(in_array('',$answers,true))<strong>DRAFT · Unanswered punches</strong>@endif
  </div><output>{{ $notice }}</output>
</section>
