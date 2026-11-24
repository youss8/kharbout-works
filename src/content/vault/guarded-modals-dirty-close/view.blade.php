<section x-data="{
    mode:'edit', hours:'', days:[], startTime:'', word:'', note:'', discard:false, pending:false,
    baseline:null, pendingFile:false, rejectNext:false, localError:'', loadError:'', navigation:null, normalize:null,
    async guard() {
        if (this.navigation) return true;
        try {
            const helpers = await import(@js(asset('vault/schedule-guard.js')));
            this.normalize = helpers.normalizeSchedule;
            this.navigation = helpers.scheduleGuard({
                dirty: () => this.dirty, pending: () => this.pending,
                requestDiscard: () => this.discard = true, close: proceed => this.finish(proceed),
            });
            this.loadError = '';
            return true;
        } catch {
            this.loadError = 'The schedule guard could not be loaded.';
            return false;
        }
    },
    get dirty() {
        return this.pendingFile || (this.baseline && this.normalize &&
            JSON.stringify(this.baseline) !== JSON.stringify(this.normalize(this.hours,this.days,this.startTime)));
    },
    restore() {
        const saved = this.$wire.saved;
        this.baseline = this.normalize ? this.normalize(saved.hours,saved.days,saved.startTime) : null;
        this.hours=saved.hours; this.days=[...saved.days]; this.startTime=saved.startTime;
        this.pendingFile=false; this.$refs.file.value=''; this.localError='';
        this.discard=false; this.rejectNext=false;
    },
    async open(mode) {
        if (mode==='edit' && !await this.guard()) return;
        this.mode=mode; this.word=''; this.note=''; this.restore();
        if (mode==='note') {
            const popup=document.getElementById('guard-note');
            popup.showPopover(); popup.querySelector('textarea').focus();
            return;
        }
        this.$refs.dialog.showModal();
        if (mode==='edit') this.navigation.begin();
        this.$nextTick(()=>this.$refs.cancel.focus());
    },
    finish(proceed=false) {
        if (this.mode==='edit') this.navigation.end(proceed);
        this.$refs.dialog.close();
        this.restore();
    },
    stay() {
        this.navigation.stay(); this.discard=false; this.$nextTick(()=>this.$refs.hours.focus());
    },
    cancel() {
        if (this.pending) return;
        if (this.discard) this.stay();
        else if (this.mode==='edit' && this.dirty) this.discard=true;
        else this.finish();
    },
    async save() {
        if (this.pending) return;
        this.pending=true;
        const reject=this.rejectNext;
        this.rejectNext=false; this.localError='';
        try {
            const confirmed=this.mode==='edit'
                ? await this.$wire.saveSchedule(this.hours,this.days,this.startTime,reject)
                : await this.$wire.resetCredentials(this.word);
            if (confirmed) this.finish();
            else this.localError=this.$wire.saveError || 'The service did not confirm this save.';
        } catch {
            this.localError='The service could not confirm this save. Your edits are retained.';
        } finally { this.pending=false; }
    },
    destroy() { this.navigation?.destroy(); },
}">
  <div class="kit-row">
    <button @click="open('edit')">Edit schedule</button>
    <button @click="open('reset')">Reset credentials</button>
    <button data-note-trigger aria-controls="guard-note" @click="open('note')">Record decision</button>
  </div>
  <div x-show="loadError" role="alert"><span x-text="loadError"></span> <button @click="open('edit')">Retry</button></div>
  <details id="schedule-policy"><summary>Scheduling rules</summary>Daily hours must be between 0 and 24.</details>
  <dialog id="guard-modal" class="kit-panel m-auto max-sm:mb-0 max-sm:w-full" x-ref="dialog" wire:ignore @cancel.prevent="cancel()" @click.self="if(mode!=='edit')cancel()" aria-labelledby="guard-title">
    <div><h3 id="guard-title" x-text="mode==='edit' ? 'Edit schedule' : 'Reset credentials'"></h3>
    <fieldset x-show="mode==='edit'" :disabled="pending">
      <label>Hours <input x-ref="hours" x-model="hours"></label>
      @foreach(['1','2','3'] as $day)<label><input type="checkbox" value="{{ $day }}" x-model="days">Day {{ $day }}</label>@endforeach
      <label>Start time <input x-model="startTime"></label>
      <label>Schedule attachment <input x-ref="file" type="file" @change="pendingFile=$event.target.files.length > 0"></label>
      <small>Attachments stay in this browser.</small>
      <label><input type="checkbox" x-model="rejectNext">Reject next save</label>
      <a href="#schedule-policy">Schedule policy</a>
      <p x-text="dirty ? 'Unsaved changes' : 'No changes'"></p>
    </fieldset>
    <div x-show="mode==='reset'">
      <p>Operator A · North Hub<br>Resetting replaces this account’s demo credentials.</p>
      <label>Type RESET to confirm <input x-model="word" autocomplete="off"></label>
    </div>
    <div x-show="localError" role="alert"><span x-text="localError"></span> <button :disabled="pending" @click="save()">Retry</button></div>
    <div x-show="!discard" class="kit-row">
      <button x-ref="cancel" :disabled="pending" @click="cancel()">Cancel</button>
      <button :disabled="pending || (mode==='reset'?word!=='RESET':!hours.trim())" :data-loading="pending || undefined" @click="save()" x-text="mode==='edit' ? 'Save schedule' : 'Confirm reset'"></button>
    </div>
    <div x-show="discard" role="group" aria-label="Unsaved changes">
      <p>Discard your schedule edits?</p><button @click="stay()">Keep editing</button><button @click="finish(true)">Discard changes</button>
    </div></div>
  </dialog>
  <template x-teleport="body">
    <section popover="auto" id="guard-note" role="dialog" aria-label="Decision note">
      <label>Required note <textarea rows="3" x-model="note" maxlength="240"></textarea></label><bdi x-text="note.length+'/240'"></bdi>
      <button :disabled="pending" @click="$el.closest('[popover]').hidePopover()">Cancel</button>
      <button :disabled="pending || !note.trim()" @click="pending=true;try{if(await $wire.recordDecision(note))$el.closest('[popover]').hidePopover()}finally{pending=false}">Save decision</button>
    </section>
  </template>
  <p role="status">{{ $message }}</p>
</section>
