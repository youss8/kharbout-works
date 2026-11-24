import{j as o}from"./jsx-runtime.D_zvdyIk.js";import{r as l}from"./index.DLkBFFtG.js";/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=t=>(t.match(/\d+[xX]\d+|[A-Z]?[a-z]+|[A-Z]|\d+/g)??[]).join("-").toLowerCase();/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function q(t,e,i=[]){if(e==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:I(t),size:24,node:e,...i.length>0?{aliases:i}:{}}}/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=t=>{let e="",i=!1;for(const s of t){if(s==="-"||s==="_"||s<=" "){i=e.length>0;continue}e.length===0?e+=s.toLowerCase():e+=i?s.toUpperCase():s,i=!1}return e};/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=t=>{const e=E(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=(...t)=>{const e=new Set;for(const i of t)if(typeof i=="string")for(const s of i.split(/\s+/))s&&e.add(s);return[...e].join(" ")};/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function k(t){return t!=null}function B(t,e={}){const i=e.attributeNames??{},s=n=>i[n]??n,h=t.size??t.width??b.width,u=t.size??t.height??b.height,m=t.aliases?.filter(n=>typeof n=="string"&&n.trim()!=="").map(n=>`lucide-${n}`)??[],f=[...t.name?[`lucide-${t.name}`]:[],...m],c=e.className?.split(" ").filter(Boolean)??[],x=e.includeDefaultClasses===!1?y(...c):y("lucide",...f,...c);let a=e.strokeWidth??b["stroke-width"];if(e.absoluteStrokeWidth){const n=Number(a)*Number(t.size??t.width??b.width)/Number(e.size??e.width??b.width);Number.isFinite(n)&&(a=n)}return["svg",{...Object.entries(b).reduce((n,[r,d])=>(n[s(r)]=d,n),{}),..."color"in e&&e.color&&{[s("stroke")]:e.color},..."size"in e&&k(e.size)&&{[s("width")]:e.size,[s("height")]:e.size},..."width"in e&&k(e.width)&&{[s("width")]:e.width},..."height"in e&&k(e.height)&&{[s("height")]:e.height},[s("stroke-width")]:a,...x&&{[s("class")]:x},[s("viewBox")]:`0 0 ${h} ${u}`,...e.hasA11yProp===!1?{[s("aria-hidden")]:"true"}:{},..."attributes"in e&&e.attributes},t.node.map(n=>{const[r,d,g]=n,w=e.nonScalingStroke?{[s("vector-effect")]:"non-scaling-stroke",...d}:d;return g?[r,w,g]:[r,w]})]}/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function $(t,e={}){return B(t,{...e,attributeNames:{...e.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O=t=>{if(t==null||typeof t!="object")return!1;for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e)&&(e.startsWith("aria-")||e==="role"||e==="title")&&t[e]!=null)return!0;return!1},T=l.createContext({}),V=()=>l.useContext(T),H=l.forwardRef(({color:t,size:e,width:i,height:s,strokeWidth:h,absoluteStrokeWidth:u,nonScalingStroke:m,className:f="",children:c,iconNode:x=[],icon:a={node:x,aliases:[],size:24},...p},n)=>{const{size:r=24,strokeWidth:d=2,absoluteStrokeWidth:g=!1,nonScalingStroke:w=!1,color:M="currentColor",className:A=""}=V()??{},W=!!c||O(p),[L,_,P=[]]=$(a,{color:t??M,width:i??e??r,height:s??e??r,strokeWidth:h??d,absoluteStrokeWidth:u??g,nonScalingStroke:m??w,className:y(A,f),hasA11yProp:W,attributes:p});return l.createElement(L,{ref:n,..._},[...P.map(([D,F])=>l.createElement(D,F)),...Array.isArray(c)?c:[c]])});/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function j(t,e=[],i=[]){const s=typeof t=="string"?q(t,e,i):t,h=l.forwardRef(({className:u,...m},f)=>l.createElement(H,{ref:f,icon:s,className:u,...m}));return s.name&&(h.displayName=R(s.name)),h}/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C={name:"arrow-right",size:24,node:[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]};C.node;const K=j(C);/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S={name:"calendar-days",size:24,node:[["path",{d:"M8 2v3",key:"1ioesn"}],["path",{d:"M16 2v3",key:"otl347"}],["rect",{x:"3",y:"3",width:"18",height:"18",rx:"2",key:"h1oib"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M8 13h.01",key:"1sbv64"}],["path",{d:"M12 13h.01",key:"y0uutt"}],["path",{d:"M16 13h.01",key:"wip0gl"}],["path",{d:"M8 17h.01",key:"p3bg7i"}],["path",{d:"M12 17h.01",key:"p32p05"}],["path",{d:"M16 17h.01",key:"ql8jdd"}]]};S.node;const U=j(S);/**
 * @license lucide-react v1.78.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z={name:"chart-no-axes-combined",size:24,node:[["path",{d:"M12 16v5",key:"zza2cw"}],["path",{d:"M16 14.639V21",key:"1s85h0"}],["path",{d:"M20 10.656V21",key:"q45596"}],["path",{d:"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15",key:"1fw8x9"}],["path",{d:"M4 18.463V21",key:"1otddq"}],["path",{d:"M8 14.656V21",key:"1t2idw"}]]};z.node;const Z=j(z),Q=[["pooled","Pooled ratio"],["average","Site average"]],X=[["full","Full day"],["am","Morning only"]],G=new Intl.DateTimeFormat("en",{day:"numeric",month:"short",timeZone:"UTC"}),v="flex min-h-11 items-center justify-center gap-2 rounded-md px-2 text-sm! font-bold! text-[#deeee6] hover:bg-white/10 aria-pressed:bg-[#f0f9f4] aria-pressed:text-[#103c31] focus-visible:outline-[#c1f4df]",N="min-h-11 rounded-md border border-strong px-2.5 text-[0.8rem]! font-bold! text-ink-secondary hover:bg-accent-tint aria-pressed:border-accent aria-pressed:bg-accent-tint aria-pressed:text-accent";function ee({tracking:t,hr:e}){const[i,s]=l.useState(!1),[h,u]=l.useState("tracking"),[m,f]=l.useState("pooled"),[c,x]=l.useState("full");l.useEffect(()=>{s(!0)},[]);const a=h==="tracking",p=t[m],n=e[c];return o.jsxs("section",{id:"featured-workflows","aria-labelledby":"featured-workflow-title",className:"min-w-0 overflow-hidden rounded-2xl border border-hairline bg-surface shadow-[0_18px_45px_-28px_#09291f55]",children:[o.jsxs("div",{role:"group","aria-label":"Choose a workflow","data-workflow-controls":!0,className:"grid grid-cols-2 gap-1.5 bg-[#103c31] p-2 dark:bg-[#15372e]",children:[o.jsxs("button",{type:"button",disabled:!i,"aria-pressed":a,onClick:()=>u("tracking"),className:v,children:[o.jsx(Z,{size:17,"aria-hidden":"true"})," Portfolio tracking"]}),o.jsxs("button",{type:"button",disabled:!i,"aria-pressed":!a,onClick:()=>u("hr"),className:v,children:[o.jsx(U,{size:17,"aria-hidden":"true"})," HR workflows"]})]}),o.jsxs("div",{className:"grid gap-3 px-[clamp(0.85rem,2.4vw,1.5rem)] py-[clamp(0.9rem,2.3vw,1.4rem)]",children:[o.jsxs("div",{children:[o.jsx("p",{className:"font-mono text-[0.71rem] font-semibold text-accent",children:a?o.jsxs(o.Fragment,{children:[o.jsx("bdi",{children:t.indicator})," · Sample KPI"]}):"Sample leave request · Before approval"}),o.jsx("h2",{id:"featured-workflow-title",className:"mt-1.5 text-[clamp(1.2rem,2.4vw,1.65rem)] leading-tight font-bold [text-wrap:pretty]",children:a?t.title:"How much leave will be charged?"})]}),a?o.jsxs(o.Fragment,{children:[o.jsx("div",{role:"group","aria-label":"Rollup method","data-workflow-controls":!0,className:"flex flex-wrap gap-1.5",children:Q.map(([r,d])=>o.jsx("button",{type:"button",className:N,disabled:!i,"aria-pressed":m===r,onClick:()=>f(r),children:d},r))}),o.jsxs("div",{className:"grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-hairline bg-accent-tint p-3 text-accent motion-safe:transition-colors",role:"status","aria-live":"polite","aria-atomic":"true",children:[o.jsx("bdi",{className:"font-mono text-[clamp(1.35rem,3vw,2rem)] font-semibold leading-tight",children:p.value}),o.jsx("p",{className:"text-xs font-semibold",children:p.detail})]}),t.exclusions.map(r=>o.jsx("p",{className:"text-xs text-ink-secondary",children:r},r))]}):o.jsxs(o.Fragment,{children:[o.jsx("div",{role:"group","aria-label":"Part of day","data-workflow-controls":!0,className:"flex flex-wrap gap-1.5",children:X.map(([r,d])=>o.jsx("button",{type:"button",className:N,disabled:!i,"aria-pressed":c===r,onClick:()=>x(r),children:d},r))}),o.jsxs("div",{className:"grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-lg border border-hairline bg-accent-tint p-3 text-accent motion-safe:transition-colors",role:"status","aria-live":"polite","aria-atomic":"true",children:[o.jsx("bdi",{className:"font-mono text-[clamp(1.35rem,3vw,2rem)] font-semibold leading-tight",children:n.value}),o.jsx("p",{className:"text-xs font-semibold",children:"Quoted leave · holidays and weekends excluded"})]}),o.jsx("ul",{"aria-label":"Day-by-day quote",className:"grid grid-cols-2 gap-1.5 min-[410px]:grid-cols-4",children:n.days.map(r=>o.jsxs("li",{className:"min-w-0 rounded-md border border-hairline bg-subtle px-2 py-1.5 text-xs",children:[o.jsx("time",{className:"block text-ink-secondary",dateTime:r.date,children:G.format(new Date(r.date))}),o.jsx("strong",{children:r.hours?o.jsxs("bdi",{children:[r.hours,"h"]}):r.label.replace(" excluded","")})]},r.date))})]}),o.jsxs("a",{href:a?t.href:e.href,className:"inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-bold text-accent underline-offset-4 hover:underline",children:[a?"Open KPI cockpit":"Open leave approval desk"," ",o.jsx(K,{size:15,className:"directional-icon","aria-hidden":"true"})]})]})]})}export{ee as default};
