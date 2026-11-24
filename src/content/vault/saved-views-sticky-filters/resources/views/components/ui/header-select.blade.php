@props(['label','multiple'=>false,'action'=>null,'default'=>''])
@php
    $model=$attributes->wire('model')->value();
    if(!is_string($model)||$model==='')throw new InvalidArgumentException('A header select requires wire:model.');
@endphp
<div x-data="{
    open:false,query:'',options:[],draft:[],model:@js($model),multiple:@js($multiple),action:@js($action),rest:@js($default),
    get filtered(){return this.options.filter(o=>o.label.toLowerCase().includes(this.query.trim().toLowerCase()))},
    get summary(){const value=this.$wire[this.model];return Array.isArray(value)?(value.length>1?value[0]+' +'+(value.length-1):value[0]||'All'):value||'All'},
    edit(){if(this.open){this.dismiss();return}this.options=Array.from(this.$refs.source.options,o=>({value:o.value,label:o.label,disabled:o.disabled}));
        const value=this.$wire[this.model];this.draft=Array.isArray(value)?[...value]:[value];this.query='';
        this.open=true;this.$nextTick(()=>this.$refs.find.focus())},
    choose(value){const opt=this.options.find(o=>o.value===value);if(!opt||opt.disabled)return;
        this.draft=this.multiple?this.options.filter(o=>o.value===value?!this.draft.includes(value):this.draft.includes(o.value)).map(o=>o.value):[value]},
    move(event){const items=[...this.$refs.list.querySelectorAll('input:not(:disabled)')];if(!items.length)return;
        const i=items.indexOf(document.activeElement),delta=event.key==='ArrowDown'?1:-1;
        items[i<0?(delta===1?0:items.length-1):(i+delta+items.length)%items.length].focus()},
    dismiss(){this.open=false;this.$refs.trigger.focus()},
    done(){const value=this.multiple?this.draft:this.draft[0]??this.rest;
        if(this.action)this.$wire[this.action](value);else this.$wire.$set(this.model,value);this.dismiss()}
}">
    <select hidden x-ref="source" aria-hidden="true" @if($multiple) multiple @endif>{{ $slot }}</select>
    <button type="button" data-header-trigger x-ref="trigger" aria-label="{{ $label }}" aria-haspopup="dialog" :aria-expanded="open" @click="edit()">{{ $label }} <small x-text="summary"></small></button>
    <div x-show="open" x-cloak class="kit-panel" role="dialog" aria-label="{{ $label }}" @keydown.escape.stop.prevent="dismiss()" @click.outside="if (!$refs.trigger.contains($event.target)) open=false" @keydown.arrow-down.prevent="move($event)" @keydown.arrow-up.prevent="move($event)">
            <label>Find option<input type="search" x-ref="find" x-model="query" @keydown="if($event.key.length===1)$event.stopPropagation()"></label>
            <div class="header-results" x-ref="list">
                <template x-for="option in filtered" :key="option.value">
                    <label><input :type="multiple?'checkbox':'radio'" :checked="draft.includes(option.value)" :disabled="option.disabled" @change="choose(option.value)"><span x-text="option.label"></span></label>
                </template>
                <p x-show="!filtered.length">No matching options.</p>
            </div>
            <div class="kit-row"><button type="button" @click="draft=multiple?[]:[rest];$refs.find.focus()">Clear</button>
            <button type="button" @click="dismiss()">Cancel</button><button type="button" @click="done()">Done</button></div>
    </div>
</div>
