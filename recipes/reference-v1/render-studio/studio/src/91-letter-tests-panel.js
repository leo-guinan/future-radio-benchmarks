/* ================= letter tests ================= */
const normT=s=>String(s).replace(/\s+/g,' ').trim();
let RENDER_COUNT=0;
function hashCanvas(){const d=ctx.getImageData(0,0,Math.min(cv.width,480),Math.min(cv.height,320)).data;let x=0;for(let i=0;i<d.length;i+=7)x=(x*31+d[i])%1000000007;return x}
const dumpLog=()=>LOG.map(e=>({id:e.id,t:+e.t.toFixed(4),dur:+e.dur.toFixed(4),op:e.op,actor:e.actor,target:e.target,frame:e.frame,result:e.result,args:e.args&&e.args.tpl&&typeof e.args.tpl==='object'?{...e.args,tpl:e.args.tpl.strokes.map(s=>s.length).join(',')}:e.args}));
function specFlat(sig){const fft=(re)=>{const n=re.length,im=new Float64Array(n);for(let i=0,j=0;i<n;i++){if(i<j){[re[i],re[j]]=[re[j],re[i]]}let m=n>>1;while(m>=1&&j&m){j^=m;m>>=1}j|=m}
    for(let s=2;s<=n;s<<=1){const h=s>>1,a=-2*Math.PI/s;for(let i=0;i<n;i+=s)for(let k=0;k<h;k++){const c=Math.cos(a*k),d=Math.sin(a*k),tr=c*re[i+k+h]-d*im[i+k+h],ti=d*re[i+k+h]+c*im[i+k+h];re[i+k+h]=re[i+k]-tr;im[i+k+h]=im[i+k]-ti;re[i+k]+=tr;im[i+k]+=ti}}
    const p=[];for(let i=1;i<n/2;i++)p.push(re[i]*re[i]+im[i]*im[i]);return p};
  const N=1024;let acc=null,cnt=0;for(let i=0;i+N<=sig.length;i+=N/2){const seg=new Float64Array(N);for(let k=0;k<N;k++)seg[k]=sig[i+k]*(.5-.5*Math.cos(2*Math.PI*k/N));const p=fft(seg);if(!acc)acc=p.map(()=>0);p.forEach((v,k)=>acc[k]+=v);cnt++}
  const P=acc.slice(8).map(v=>v/cnt+1e-20);return Math.exp(P.reduce((a,v)=>a+Math.log(v),0)/P.length)/(P.reduce((a,v)=>a+v,0)/P.length)}
function lifecycleTrace(){const q='quill-1';const out=[];const e0=LOG.find(e=>e.target===q&&e.op==='INSCRIBE');for(let t=e0.t+e0.dur+.01;t<LETTER_END_CARD;t+=.1){FR=frameDefs(t);const S=stateAt(t);const s=lifecycleOf(S,S.objects[q],t);if(out[out.length-1]!==s)out.push(s)}return out}
function letterTests(prior){const out=[];const T_=(name,fn)=>{let pass=false,detail='';try{const r=fn();pass=!!r.pass;detail=r.detail||''}catch(e){detail='error: '+e.message}out.push({name,pass,detail})};
  const q='quill-1';const bodyEvs=()=>LOG.filter(e=>e.actor===q&&e.result==='ok'&&e.args&&e.args.write&&e.args.write.field==='body'&&e.args.write.version===1);
  T_('Leonardo constructs the quill with his pencil',()=>{const e=LOG.find(e=>e.op==='INSCRIBE'&&e.target===q);const p=planOf(e);let contact=0;
    for(let i=1;i<20;i++){const t=e.t+e.dur*i/20;FR=frameDefs(t);if(pencilState(stateAt(t).chars.leonardo,t).contact)contact++}const o=stateAt(e.t+e.dur+.01).objects[q];
    return{pass:e.actor==='leonardo'&&e.result==='ok'&&p.strokes.length>=8&&contact>=9&&o.kind==='instrument'&&o.activated==null,detail:`INSCRIBE by ${e.actor}: ${p.strokes.length} pencil strokes, pencil on the wall in ${contact} of 19 samples; the result is an instrument (“${o.name}”), dormant until awakened`}});
  T_('The quill becomes an independently animated instrument',()=>{const aw=LOG.find(e=>e.op==='ANIMATE'&&e.target===q&&e.args.behavior==='awaken');const own=LOG.filter(e=>e.actor===q);const den=own.filter(e=>e.result==='denied');
    let both=0,n=0;for(const w of bodyEvs().slice(1,3))for(let i=1;i<20;i++){const t=w.t+w.dur*i/20;FR=frameDefs(t);const S=stateAt(t);const ps=pencilState(S.chars.leonardo,t);const P=quillPose(S.objects[q],t);n++;if(ps.phase==='rest'&&(P.phase==='write'||P.phase==='travel'))both++}
    const S=stateAt(1e9);const lc=[...new Set(lifecycleTrace())];const want=['constructed','activated','commanded','executing','completed'];
    return{pass:!!aw&&own.length>=12&&!den.length&&!S.chars[q]&&both===n&&want.every((s,i)=>lc[i]===s),detail:`awakened at ${fmt1(aw.t)}; the quill issues ${own.length} events of its own (${den.length} denied); it writes while Leonardo’s pencil rests in ${both} of ${n} samples; lifecycle ${lc.join(' → ')}`}});
  T_('Leonardo gives the quill a semantic instruction',()=>{const c=LOG.find(e=>e.op==='COMMAND');const miss=CMD_FIELDS.filter(k=>c.args[k]==null);
    const s=snapshot();const bad=emitChecked({t:SCRIPT_END+1,dur:.5,actor:'leonardo',op:'COMMAND',target:q,frame:'studio',args:{...c.args,recipient:undefined,artifact:'letter-x'},prov:'test',cost:'—'});const r=bad.result,why=bad.reason;restore(s);
    return{pass:c.result==='ok'&&!miss.length&&c.args.approval_required===true&&r==='denied',detail:`COMMAND ${c.actor} → ${c.target}: to ${c.args.recipient}, intent “${c.args.intent}”, ${c.args.context.length} facts, constraints [${c.args.constraints.join(', ')}], output in ${c.args.output_frame}, approval required. Without a recipient it is denied: ${why}`}});
  T_('The exact sponsorship letter appears in readable calligraphy',()=>{const A=stateAt(1e9).artifacts['letter-1'];const v=A.versions[1];const written=v.lines.join('\n');
    const L=layoutLetter(LETTER_TEXT);const inPage=L.lines.every(l=>l.strokes.every(s=>s.every(p=>p[0]>=PAGE.x0-8&&p[0]<=PAGE.x0+PAGE.width+30&&p[1]>=8&&p[1]<=PAGE.maxY)));
    const xh=9*PAGE.size*(PAPER_L.h/PAPER_L.lh)*WRITE_ZOOM;const evs=bodyEvs();const sameText=evs.every(e=>e.args.tpl&&e.args.write.text===L.lines[e.args.write.line-1].text);
    return{pass:normT(written)===normT(LETTER_TEXT)&&!L.missing.length&&inPage&&sameText&&xh>=10,detail:`${v.lines.length} written lines; joined, they equal the commanded text character for character (line breaks aside). Every character has a glyph, every stroke is inside the page, x-height ${xh.toFixed(1)} px in a 1280×720 close-up`}});
  T_('Quill movement stays aligned with the forming letters',()=>{let worst=0,n=0;for(const e of LOG.filter(e=>e.actor===q&&e.op==='INSCRIBE'&&e.result==='ok')){const p=planOf(e);
      for(let i=1;i<40;i++){const t=e.t+e.dur*i/40;FR=frameDefs(t);const P=quillPose(stateAt(t).objects[q],t);if(P.phase!=='write')continue;const r=evalPlan(p,i/40);const pl=revealFracs(p.strokes,r.fracs);const end=pl[pl.length-1];
        worst=Math.max(worst,dist(toWorld(e.frame,end[end.length-1]),P.tip));n++}}
    const aw=LOG.find(e=>e.op==='ANIMATE'&&e.target===q&&e.args.behavior==='awaken');let step=0,where=0,prev=null;for(let t=aw.t;t<LETTER_END_CARD;t+=1/240){FR=frameDefs(t);const P=quillPose(stateAt(t).objects[q],t);if(prev){const d=dist(prev,P.tip);if(d>step){step=d;where=t}}prev=P.tip}
    return{pass:n>200&&worst<1e-6&&step<9,detail:`${n} writing samples, max nib-to-ink gap ${worst.toExponential(1)} px; quill tip never jumps (max ${step.toFixed(2)} px per 1/240 s, at ${fmt1(where)})`}});
  T_('The text survives independently of the rendering',()=>{const rc=RENDER_COUNT;const json=JSON.stringify(exportArtifact('letter-1'));const back=JSON.parse(json);const v=back.versions[0];
    const n1=v.lines.reduce((a,l)=>a+l.strokes.length,0),n2=bodyEvs().reduce((a,e)=>a+planOf(e).strokes.length,0);
    return{pass:RENDER_COUNT===rc&&normT(v.text_written)===normT(LETTER_TEXT)&&n1===n2&&back.recipient==='DHH'&&back.authorized_by==='leonardo'&&back.history.length>=5,detail:`exported ${(json.length/1024).toFixed(0)} KB of JSON without drawing a frame: exact text, ${n1} vector strokes, recipient, purpose, authorizing character, ${back.history.length} history entries tied to scene-log events`}});
  T_('The quill writes another recipient without behavior changes',()=>{const s=snapshot();const sig=r=>r.events.map(e=>e.actor+':'+e.op+':'+(e.args.write?e.args.write.field:e.args.behavior||'')).join(' ');
    const a=reviseLetter(LETTER_TEXT,'DHH');const sa=sig(a);restore(s);const b=reviseLetter(LETTER_TEXT.replace('Dear DHH,','Dear Ada,'),'Ada');const sb=sig(b);const A=stateAt(1e9).artifacts['letter-1'];restore(s);
    return{pass:sa===sb&&A.address==='Ada'&&A.recipient==='Ada'&&b.events.every(e=>e.result==='ok'),detail:`the same ${b.events.length}-event sequence as a rewrite to DHH; the envelope now reads “${A.address}”`}});
  T_('A finished letter can be reviewed, revised and saved',()=>{const A0=stateAt(1e9).artifacts['letter-1'];const s=snapshot();const txt=LETTER_TEXT.replace('one experiment at a time.','one small experiment at a time.');
    const r=reviseLetter(txt,'DHH');const A=stateAt(1e9).artifacts['letter-1'];const ex=exportArtifact('letter-1');restore(s);
    return{pass:A0.reviewed!=null&&A.version===2&&A.versions[1].written&&A.versions[2].written&&normT(A.versions[2].lines.join(' '))===normT(txt)&&A.status==='prepared'&&ex.versions.length===2,detail:`reviewed by ${A0.reviewedBy} at ${fmt1(A0.reviewed)}; a revision is written as v2 on a fresh sheet in ${r.events.length} events, v1 kept; the saved draft carries both versions`}});
  T_('The animation replays deterministically',()=>{const fp=S=>structural(S)+JSON.stringify(Object.values(S.artifacts).map(a=>[a.id,a.version,a.status,a.correspondence,a.address,Object.values(a.versions).map(v=>v.lines)]));
    const a=stateAt(1e9,ORDERED.filter(e=>LOG.includes(e))),b=stateAt(1e9);const same=fp(a)===fp(b);const d1=JSON.stringify(dumpLog());const s=snapshot();seedLetter();const d2=JSON.stringify(dumpLog());restore(s);
    const wt=bodyEvs()[2].t+1.37;render(wt);const p1=hashCanvas();render(wt+6.2);render(wt);const p2=hashCanvas();
    return{pass:same&&b.mismatch.length===0&&d1===d2&&p1===p2,detail:`${LOG.length} events; reseeding gives an identical log; schedule-order and time-order replays ${same?'match':'differ'}, ${b.mismatch.length} capability mismatches; frame hash ${p1}/${p2}`}});
  T_('Nothing is sent without separate, explicit authorization',()=>{const S=stateAt(1e9);const A=S.artifacts['letter-1'];const disp=LOG.filter(e=>e.op==='DISPATCH');const rec=LOG.find(e=>e.op==='RECEIVE');const cmd=LOG.find(e=>e.op==='COMMAND');
    const s=snapshot();const t=SCRIPT_END+1;const d1=emitChecked({t,dur:.5,actor:'leonardo',op:'DISPATCH',target:'correspondence-1',frame:'desk',args:{channel:'email',to:'DHH'},prov:'test',cost:'—'});
    const d2=emitChecked({t:t+1,dur:.5,actor:q,op:'DISPATCH',target:'correspondence-1',frame:'desk',args:{channel:'email'},prov:'test',cost:'—'});
    const r2=emitChecked({t:t+2,dur:1,actor:'radio',op:'RECEIVE',target:'radio',frame:'desk',args:{signal:'voice',reply:true,in_reply_to:'letter-1'},prov:'test',cost:'—'});const A2=stateAt(1e9).artifacts['letter-1'];restore(s);
    return{pass:!disp.length&&A.external==='not sent'&&A.correspondence==='DRAFTED'&&S.correspondence['correspondence-1'].status==='prepared'&&rec.args.reply===false&&!('authorize_delivery' in cmd.args)&&d1.result==='denied'&&d2.result==='denied'&&r2.result==='denied'&&A2.correspondence==='DRAFTED',
      detail:`no DISPATCH in the log; the letter is ${A.correspondence} and prepared, external delivery: ${A.external}. A DISPATCH by Leonardo or by the quill is denied (${d1.reason}). The radio signal is logged as an observation with reply:false; a signal claiming to be a reply is denied (${r2.reason}).`}});
  T_('Runs 75 to 90 seconds',()=>{const w=bodyEvs();return{pass:SCRIPT_END>=75&&SCRIPT_END<=90,detail:`${SCRIPT_END} s including the end card; the letter is written from ${fmt1(w[0].t)} to ${fmt1(w[w.length-1].t+w[w.length-1].dur)}`}});
  T_('Existing nested-frame and costume demos still work',()=>({pass:prior.every(r=>r.pass),detail:`${prior.filter(r=>r.pass).length} of ${prior.length} earlier acceptance and renderer tests pass`}));
  return out}
async function letterAudioTests(){const snap=snapshot();SCENE='letter';seedLetter();const ws=LOG.filter(e=>e.actor==='quill-1'&&e.args&&e.args.write&&e.args.write.field==='body');const t0=ws[1].t-.2,t1=ws[3].t+ws[3].dur+.2;
  const sr=24000,dur=t1-t0;const oac=new OfflineAudioContext(1,Math.ceil(sr*dur),sr);await loadFoley(oac);await loadInk(oac);const eng=makeEngine(oac,oac.destination);eng.noVO=true;eng.schedule(t0,t1,s=>s-t0,1);
  const buf=await oac.startRendering();const x=buf.getChannelData(0);const win=Math.round(sr*.02);const rms=[];for(let i=0;i+win<=x.length;i+=win){let s=0;for(let k=0;k<win;k++)s+=x[i+k]*x[i+k];rms.push(Math.sqrt(s/win))}
  const db=v=>20*Math.log10(v+1e-9);const at=t=>rms[Math.min(rms.length-1,Math.max(0,Math.floor((t-t0)/.02)))]||0;const mean=a=>a.reduce((p,c)=>p+c,0)/Math.max(1,a.length);
  // contact vs word gaps and line gaps, from the plans themselves
  const on=[],gap=[];for(const e of ws.slice(1,4)){const p=planOf(e);for(const sg of p.segs){const a=e.t+sg.u0*e.dur,b=e.t+sg.u1*e.dur;if(b-a<.08)continue;for(let t=a+.03;t<b-.03;t+=.02)(sg.type==='draw'?on:gap).push(at(t))}}
  for(let i=1;i<4;i++){const a=ws[i].t+ws[i].dur,b=i<3?ws[i+1].t:t1;for(let t=a+.05;t<b-.05;t+=.02)gap.push(at(t))}
  const lineSig=x.slice(Math.floor((ws[2].t-t0)*sr),Math.floor((ws[2].t+ws[2].dur-t0)*sr));const noise=new Float64Array(lineSig.length).map(()=>Math.random()*2-1);const fl=specFlat(lineSig),fn=specFlat(noise);
  const modOf=a=>{const m=mean(a),sd=Math.sqrt(mean(a.map(v=>(v-m)*(v-m))));return sd/(m||1)};const env=[];for(let t=ws[2].t;t<ws[2].t+ws[2].dur;t+=.02)env.push(at(t));const mod=modOf(env);const nenv=[];for(let i=0;i+win<=noise.length;i+=win){let s=0;for(let k=0;k<win;k++)s+=noise[i+k]*noise[i+k];nenv.push(Math.sqrt(s/win))}const nmod=modOf(nenv);
  const strokes=ws.filter(e=>e.t>=t0&&e.t<t1).reduce((a,e)=>a+planOf(e).strokes.length,0);const ticks=eng.log.filter(l=>l.ink&&l.type==='down').length;
  restore(snap);return[{name:'Writing sounds like a nib on paper, not spray',pass:fl<fn*.35&&db(mean(gap))<db(mean(on))-12&&mod>.3&&ticks===strokes,
    detail:`spectral flatness ${fl.toFixed(3)} vs ${fn.toFixed(3)} for noise; nib in contact ${db(mean(on)).toFixed(1)} dBFS, lifted between words and lines ${db(mean(gap)).toFixed(1)} dBFS; loudness follows the strokes (envelope modulation ${mod.toFixed(2)}; steady noise like a spray: ${nmod.toFixed(2)}); ${ticks} nib-contact ticks for ${strokes} strokes · source: ${INKF.source}`}]}

/* ================= letter panel ================= */
const lp_=id=>document.getElementById(id);
const LPANEL={cv:lp_('lcv'),facts:lp_('lfacts'),ladder:lp_('ladder'),ext:lp_('lext'),text:lp_('ltext'),hist:lp_('lhist'),rec:lp_('lrec'),edit:lp_('ledit'),stat:lp_('lstat'),cap:lp_('lcap'),state:lp_('lstate'),vers:lp_('lvers')};
let LVIEW=null;// version shown in the panel; null = current
let DL=null;(async()=>{try{if(window.claude&&window.claude.use)DL=await window.claude.use('downloads')}catch(_){DL=null}})();
const LSTORE='future-radio-letter-draft';
function lstat(msg,err){LPANEL.stat.textContent=msg;LPANEL.stat.classList.toggle('err',!!err)}
function updateLetterPanel(t){if(SCENE!=='letter'||!LPANEL.cv)return;FR=frameDefs(t);const S=stateAt(t);const A=S.artifacts['letter-1'];const End=stateAt(1e9).artifacts['letter-1'];
  const vers=End?Object.keys(End.versions).map(Number):[1];const v=LVIEW&&vers.includes(LVIEW)?LVIEW:(A?A.version:1);
  LPANEL.vers.innerHTML=vers.map(n=>`<button type="button" class="chipbtn" data-v="${n}" aria-pressed="${n===v}">v${n}</button>`).join('');
  const g=LPANEL.cv.getContext('2d');renderPage(g,'letter-1',v,t,LPANEL.cv.width/PAPER_L.lw);FR=frameDefs(t);
  if(!A){LPANEL.state.textContent='not commanded yet';LPANEL.facts.innerHTML=`<dt>Artifact</dt><dd>letter-1, created when Leonardo commands the quill</dd>`;LPANEL.text.textContent='';LPANEL.cap.textContent='The page is blank at this point in the scene.';
    LPANEL.ladder.innerHTML=CORR_STATES.map(s=>`<span>${s}</span>`).join('');LPANEL.hist.innerHTML='';return}
  const V=A.versions[v]||A.versions[A.version];
  LPANEL.state.textContent=`v${A.version} · ${A.status}`;
  LPANEL.facts.innerHTML=[['Artifact',A.id+' · '+A.kind],['To',esc(A.recipient)],['Purpose',esc(A.purpose)],['Authorized by',esc(nameOf(A.authorizedBy))+', who stays responsible for it'],['Written by',esc(nameOf(A.instrument))+', an instrument acting on a command'],['Command',`<button type="button" class="seek" data-t="${LOG.find(e=>e.id===A.command).t}">${A.command}</button> · approval ${A.approval_required?'required':'not required'}`],['Envelope',A.address?'addressed to '+esc(A.address):'not addressed yet']]
    .map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('');
  LPANEL.ladder.innerHTML=CORR_STATES.map(s=>`<span class="${A.correspondence===s?'on':''}" title="${s==='DRAFTED'?'reached inside the scene':'needs a person, outside the scene'}">${s}</span>`).join('<i>→</i>');
  LPANEL.ext.innerHTML=`<b>Not sent.</b> Nothing on this page can send it. ${A.correspondence==='DRAFTED'?'It is a draft ready for human approval;':'Once written it will be a draft;'} sending needs your separate, explicit decision, outside the scene.`;
  const written=V.lines.filter(Boolean);LPANEL.text.textContent=written.length?V.lines.join('\n')+(V.written?'':'\n…'):'(nothing written yet)';
  LPANEL.cap.textContent=V.written?`Version ${V.version}, as written by the quill. Text and strokes come from the scene log.`:`Version ${V.version}, as written so far.`;
  LPANEL.hist.innerHTML=A.history.filter(h=>h.t<=t+.01).map(h=>`<li><button type="button" class="seek" data-t="${h.t}">${fmt1(h.t)}</button> ${esc(h.what)} <span>${h.ev}</span></li>`).join('')}
function lpanelClick(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.t!=null){seek(+b.dataset.t-.3);return}if(b.dataset.v!=null){LVIEW=+b.dataset.v;lastKey='';dirty=true}}
LPANEL.facts&&LPANEL.facts.addEventListener('click',lpanelClick);LPANEL.hist&&LPANEL.hist.addEventListener('click',lpanelClick);LPANEL.vers&&LPANEL.vers.addEventListener('click',lpanelClick);
function fillEditor(){const A=stateAt(1e9).artifacts['letter-1'];let d=null;try{d=JSON.parse(localStorage.getItem(LSTORE)||'null')}catch(_){d=null}
  if(d&&d.text){LPANEL.edit.value=d.text;LPANEL.rec.value=d.recipient||'DHH'}else if(A){LPANEL.edit.value=A.versions[A.version].text;LPANEL.rec.value=A.recipient}}
function keepDraft(){try{localStorage.setItem(LSTORE,JSON.stringify({text:LPANEL.edit.value,recipient:LPANEL.rec.value}))}catch(_){}}
if(LPANEL.edit){LPANEL.edit.addEventListener('input',keepDraft);
  LPANEL.rec.addEventListener('input',()=>{const prev=LPANEL.rec.dataset.prev||'DHH';const now=LPANEL.rec.value.trim();const m=LPANEL.edit.value.match(/^Dear ([^,\n]*),/);if(m&&m[1]===prev&&now)LPANEL.edit.value=LPANEL.edit.value.replace(/^Dear [^,\n]*,/,'Dear '+now+',');LPANEL.rec.dataset.prev=now||prev;keepDraft()});
  lp_('lrewrite').addEventListener('click',()=>{if(SCENE!=='letter')return;try{const r=reviseLetter(LPANEL.edit.value,LPANEL.rec.value);LVIEW=null;recomputeEnd();buildLog();lastKey='';T=r.t0-.2;syncClock();setPlaying(true);
      lstat(`The quill is writing version ${r.version} (${r.events.length} events added to the log, from ${fmt1(r.t0)}). It will be prepared, not sent.`)}catch(err){lstat(err.message||String(err),true)}});
  lp_('lsave').addEventListener('click',async()=>{const ex=exportArtifact('letter-1');if(!ex){lstat('There is no letter yet.',true);return}const json=JSON.stringify(ex,null,2);
    if(!DL){lstat('Saving files isn’t available in this view. Use Copy text, or Copy as JSON on the scene log.',true);return}
    try{const r=await DL.save({filename:`letter-1-v${ex.current_version}-draft.json`,data:new Blob([json],{type:'application/json'})});lstat(r&&r.status?'Draft saved ('+r.status+').':'Draft saved.')}catch(err){lstat('Not saved: '+(err&&err.message||err),true)}});
  lp_('lpng').addEventListener('click',async()=>{const A=stateAt(1e9).artifacts['letter-1'];if(!A){lstat('There is no letter yet.',true);return}const v=LVIEW||A.version;
    const c=document.createElement('canvas');c.width=PAPER_L.lw*3;c.height=PAPER_L.lh*3;renderPage(c.getContext('2d'),'letter-1',v,1e9,3);FR=frameDefs(T);
    if(!DL){lstat('Saving files isn’t available in this view.',true);return}
    const blob=await new Promise(r=>c.toBlob(r,'image/png'));try{const r=await DL.save({filename:`letter-1-v${v}.png`,data:blob});lstat(r&&r.status?'Image saved ('+r.status+').':'Image saved.')}catch(err){lstat('Not saved: '+(err&&err.message||err),true)}});
  lp_('lcopy').addEventListener('click',async e=>{const A=stateAt(1e9).artifacts['letter-1'];if(!A)return;const v=A.versions[LVIEW||A.version];const txt=v.lines.join('\n');
    try{await navigator.clipboard.writeText(txt);lstat('Text copied.')}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');lstat('Text copied.')}catch(__){lstat('Copy failed. Select the text above instead.',true)}ta.remove()}})}

