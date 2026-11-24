<section x-data="{ role:@js(session('vault.profile.role','Employee')), switching:false, generation:0, requested:null, record:null, pending:false, unavailable:false,
    init(){this.stopIntercept=this.$wire.$intercept('inspectProfile',({onError})=>onError(({response,preventDefault})=>{if([403,404].includes(response.status))preventDefault()}))},
    destroy(){this.stopIntercept?.()},
    async changeRole(value){const id=this.requested;const token=++this.generation;this.record=null;this.unavailable=false;this.pending=id!==null;this.switching=true;try{this.role=await this.$wire.switchRole(value);if(token===this.generation && id!==null)await this.open(id)}catch{if(token===this.generation){this.pending=false;this.unavailable=true}}finally{this.switching=false}},
    async open(id){const token=++this.generation;this.requested=id;this.record=null;this.pending=true;this.unavailable=false;
      try{const result=await this.$wire.inspectProfile(id);if(token!==this.generation)return;if(result?.id===id)this.record=result;else this.unavailable=true}
      catch{if(token===this.generation)this.unavailable=true}finally{if(token===this.generation)this.pending=false}},
    close(){this.generation++;this.requested=this.record=null;this.pending=this.unavailable=false}}">
  <label>Active role <select :value="role" :disabled="switching" @change="changeRole($event.target.value)"><option>Employee</option>@can('vault.regional-hr')<option>Regional HR</option>@endcan @can('vault.manager')<option>Manager</option>@endcan</select></label>
  @foreach([42,88,91] as $id)<button :disabled="switching" @click="open({{ $id }})">Staff {{ sprintf('%03d',$id) }}</button>@endforeach<button :disabled="switching" @click="open(404)">Open missing record</button>
  <aside class="profile-drawer" x-show="requested!==null" aria-label="Profile detail"><button @click="close()">Close detail</button><p x-show="pending" role="status">Checking access…</p>
    <template x-if="record && requested===record.id"><article><h3 x-text="record.label"></h3><p x-text="record.assignment"></p></article></template>
    <p role="alert" x-show="unavailable">Record unavailable <button :disabled="switching" @click="open(requested)">Retry</button></p>
  </aside>
</section>
