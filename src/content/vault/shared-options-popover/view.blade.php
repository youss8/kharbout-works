<section x-data="{
        row:null, query:'', busy:false, assigned:@js($assigned), error:'', count:0, observer:null,
        top:0, lead:0, trigger:null, loading:false, loadError:'',
        init(){
            if(!Alpine.store('directory')) Alpine.store('directory',{people:[],pending:null});
            this.observer=new MutationObserver(()=>this.count=document.querySelectorAll('[data-assignee-option]').length);
            this.observer.observe(document.body,{subtree:true,childList:true})
        },
        destroy(){this.observer.disconnect()},
        async loadDirectory(){
            const store=this.$store.directory;
            if(store.people.length || this.loading)return;
            this.loading=true;this.loadError='';
            try{
                store.pending??=this.$wire.directoryOptions();
                store.people=await store.pending;
            }catch{this.loadError='Could not load the staff directory.'}
            finally{this.loading=false;store.pending=null}
        },
        get directory(){return this.$store.directory.people},
        get options(){return this.directory.filter(p=>p.name.toLowerCase().includes(this.query.trim().toLowerCase())).slice(0,12)},
        openFor(id,button){
            this.trigger=button;this.row=id;this.query='';this.loadDirectory();
            const rect=button.getBoundingClientRect(), width=Math.min(320,innerWidth-16);
            const start=getComputedStyle(button).direction==='rtl'?innerWidth-rect.right:rect.left;
            this.lead=Math.max(8,Math.min(innerWidth-width-8,start));
            this.top=Math.max(8,Math.min(innerHeight-Math.min(340,innerHeight-16)-8,rect.bottom+4));
            this.$nextTick(()=>this.$refs.search.focus())
        },
        close(){this.row=null;this.trigger?.focus()},
        async toggle(person){
            const id=this.row, before=this.assigned[id]||[];
            this.busy=true;this.error='';
            this.assigned[id]=before.includes(person)?before.filter(n=>n!==person):[...before,person];
            try{this.assigned[id]=await this.$wire.toggleAssignee(id,person)}
            catch{this.assigned[id]=before;this.error='Save failed. Select the officer to retry.'}
            finally{this.busy=false}
        }
    }" @keydown.escape.window="if(row!==null)close()">
    <p role="status">Rendered option buttons: <bdi x-text="count"></bdi> of 2,400 possible row options.</p>
    <ol>@foreach(range(1,12) as $task)
        <li>Inspection {{ $task }}
            <span x-text="(assigned[{{ $task }}]||[]).map(id=>directory.find(person=>person.id===id)?.name).join(', ')||'Unassigned'"></span>
            <button @click="openFor({{ $task }},$el)" :aria-expanded="row==={{ $task }}">Assign</button>
        </li>
    @endforeach</ol>
    <template x-teleport="body"><aside x-show="row!==null" role="dialog" aria-label="Assign people"
        :style="{insetInlineStart:lead+'px',insetBlockStart:top+'px'}"
        style="position:fixed;inline-size:min(320px,calc(100% - 16px));max-block-size:min(340px,calc(100dvh - 16px));overflow:auto;padding:1rem;background:Canvas;color:CanvasText">
        <label>Search <input x-ref="search" x-model="query"></label><button @click="close()">Close</button>
        <template x-if="row!==null"><div>
            <template x-for="person in options" :key="person.id"><button data-assignee-option :disabled="busy"
                :aria-pressed="(assigned[row]||[]).includes(person.id)"
                x-text="((assigned[row]||[]).includes(person.id)?'✓ ':'○ ')+person.name" @click="toggle(person.id)"></button></template>
            <p x-show="!loading && !loadError && !options.length">No matching officers.</p>
        </div></template>
        <p x-show="loading" aria-live="polite">Loading staff directory…</p>
        <template x-if="loadError"><p role="alert"><span x-text="loadError"></span> <button @click="loadDirectory()">Retry directory</button></p></template>
        <p role="alert" x-show="error" x-text="error"></p>
    </aside></template>
</section>
