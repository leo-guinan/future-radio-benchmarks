/* ================= UI ================= */
const OPC=op=>`var(--op-${op})`;
const fmt=t=>{t=Math.max(0,t);return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')};
const fmt1=t=>Math.floor(Math.max(0,t)/60)+':'+(Math.max(0,t)%60).toFixed(1).padStart(4,'0');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const $=id=>document.getElementById(id);
const logEl=$('log'),treeEl=$('tree'),accEl=$('acc');
let evEls=[];
function nameOf(id){const S=stateAt(1e9);if(S.chars[id])return S.chars[id].name;if(S.objects[id])return S.objects[id].name;if(S.artifacts[id])return'letter to '+S.artifacts[id].recipient;if(S.correspondence[id])return id;if(FR&&FR[id])return FR[id].name||id;return id}
function buildLog(){logEl.innerHTML='';evEls=LOG.filter(e=>!e.hide).map(e=>{const b=document.createElement('button');b.type='button';b.className='ev'+(e.result==='denied'?' denied':'');
  const tag=(e.live?'<span class="tag">unscripted</span>':'')+(e.prov==='consequence'?'<span class="tag cons">consequence</span>':'')+(e.result==='denied'?'<span class="tag den">denied</span>':'');
  b.innerHTML=`<span class="t">${fmt1(e.t)}</span><span class="chip" style="background:${OPC(e.op)}">${e.op}</span><span class="whoT">${esc(nameOf(e.actor))} <em>→</em> ${esc(nameOf(e.target))}${tag}</span><span class="path">${esc(pathOf(e.frame))} · cost ${esc(e.cost||'—')}${e.live?' · '+esc(e.prov):''}</span><span class="path out">${esc(e.out||'')}</span>`;
  b.addEventListener('click',()=>seek(e.t-.4));logEl.appendChild(b);return{b,e}});
  $('ticks').innerHTML=LOG.filter(e=>!e.hide).map(e=>`<b class="${e.live?'live':''}${e.result==='denied'?' den':''}" style="left:${(clamp(e.t/T_END)*100).toFixed(2)}%;background:${e.result==='denied'?'#d9806a':OPC(e.op)}"></b>`).join('')}
function showTests(list,label){accEl.innerHTML='';const n=list.filter(r=>r.pass).length;$('accsum').textContent=n+' of '+list.length+' pass';
  for(const r of list){if(r.section){const h=document.createElement('div');h.className='tsec';h.textContent=r.section;accEl.appendChild(h);continue}const d=document.createElement('div');d.className='test '+(r.pass?'ok':'fail');d.innerHTML=`<span class="nm">${esc(r.name)}</span><span class="st">${r.pass?'pass':'fail'}</span><p>${esc(r.detail)}</p>`;accEl.appendChild(d)}}
let TESTS_OUT=[];
async function buildAcc(){window.__TESTS_DONE=false;const keepScene=SCENE,keepT=T;let acc,pol;
  if(SCENE!=='main'){const s=snapshot();SCENE='main';seedMain();acc=acceptanceTests();restore(s)}else acc=acceptanceTests();
  pol=polishTests();let let_;{const s=snapshot();SCENE='letter';seedLetter();let_=letterTests([...acc,...pol]);restore(s)}VER++;
  TESTS_OUT=[{section:'The Letter to DHH'},...let_,{section:'Nested actors and outfits'},...acc,{section:'Renderer and stroke audio'},...pol];
  showTests(TESTS_OUT);window.__TEST_RESULTS=TESTS_OUT.filter(r=>!r.section);
  try{const la=await letterAudioTests();TESTS_OUT.splice(1+let_.length,0,...la);window.__TEST_RESULTS=TESTS_OUT.filter(r=>!r.section);showTests(TESTS_OUT)}catch(e){TESTS_OUT.splice(1+let_.length,0,{name:'Offline ink audio analysis',pass:false,detail:'could not run: '+(e.message||e)});showTests(TESTS_OUT)}
  try{const au=await audioTests();TESTS_OUT.push(...au);window.__TEST_RESULTS=TESTS_OUT.filter(r=>!r.section);showTests(TESTS_OUT)}catch(e){TESTS_OUT.push({name:'Offline audio analysis',pass:false,detail:'could not run: '+(e.message||e)});showTests(TESTS_OUT)}
  window.__TESTS_DONE=true;
  T=keepT;recomputeEnd();buildLog();dirty=true}
let lastKey='';
function updateUI(t){const key=Math.floor(t*10)+':'+VER;if(key===lastKey)return;lastKey=key;
  let first=null;for(const {b,e} of evEls){const on=t>=e.t-.05&&t<=Math.max(e.t+e.dur,e.t+1.2);b.classList.toggle('on',on);b.classList.toggle('past',t>e.t+e.dur&&!on);if(on&&!first)first=b}
  if(first&&playing){const top=first.offsetTop-logEl.offsetTop;if(top<logEl.scrollTop||top>logEl.scrollTop+logEl.clientHeight-140)logEl.scrollTop=Math.max(0,top-80)}
  const S=stateAt(t);const lines=[];const pad=n=>'&nbsp;'.repeat(n*2);const walk=(fid,ind)=>{const f=FR[fid];if(fid!=='studio'&&!S.frames[fid])return;
    lines.push(`<div>${pad(ind)}▣ <b>${esc(fid)}</b> <span>${f.surface?'surface':'frame'} · depth ${f.depth}${f.parent?' · scale '+frameScale(fid).toFixed(3):''}</span></div>`);
    for(const c of Object.values(S.chars))if(c.frame===fid){const caps=capsOf(S,c.id);const role=roleOf(S,c.id);
      lines.push(`<div>${pad(ind+1)}☺ <b>${esc(c.name)}</b> <span class="st">${c.prog<1?'being drawn':c.awake!=null&&t>=c.awake?'awake':'dormant'}${role?' · '+esc(role):''}</span></div><div class="caps">${pad(ind+2)}can ${caps.length?caps.join(' '):'nothing yet'}</div>`)}
    for(const o of Object.values(S.objects))if(o.frame===fid&&!o.held&&o.id!=='radio'){if(o.tpl.kind==='ink')continue;if(o.kind==='instrument'){const I=INSTRUMENTS[o.instrument];lines.push(`<div>${pad(ind+1)}✒ <b>${esc(o.name)}</b> <span class="st">${I.agency} · ${lifecycleOf(S,o,t)}</span></div><div class="caps">${pad(ind+2)}can ${I.caps.join(' ')}${I.withheld?' · cannot '+I.withheld.join(' '):''}</div>`);continue}const bs=o.behaviors.filter(b=>t>=b.t0&&t<=b.t1).map(b=>b.b);lines.push(`<div>${pad(ind+1)}${o.kind==='outfit'?'◈':'◦'} ${esc(o.name)} <span class="st">${o.prog<1?'being drawn':o.equippedBy?'worn by '+esc(S.chars[o.equippedBy].name):o.kind==='outfit'?'grants '+ROLES[o.role].name+' when worn':bs.length?bs.join(', '):'still'}</span></div>`)}
    {const inks=Object.values(S.objects).filter(o=>o.frame===fid&&o.tpl.kind==='ink');if(inks.length)lines.push(`<div>${pad(ind+1)}✎ ${inks.length} ink mark${inks.length>1?'s':''} <span class="st">${esc(inks[inks.length-1].name)}${inks[inks.length-1].prog<1?' (being written)':''}</span></div>`)}
    for(const cf of Object.values(FR))if(cf.parent===fid)walk(cf.id,ind+1)};
  walk('studio',0);for(const A of Object.values(S.artifacts))lines.push(`<div>✉ <b>${esc(A.id)}</b> → ${esc(A.recipient)} <span class="st">v${A.version} · ${A.status} · ${A.correspondence==='none'?'not drafted':A.correspondence} · ${A.external}</span></div>`);
  for(const g of S.signals)lines.push(`<div>📻 radio signal <span class="st">${esc(g.signal)} · observation · reply: ${g.reply}</span></div>`);treeEl.innerHTML=lines.join('');
  const s=subAt(t);$('sub').innerHTML=s?(s[2]?`<i>${esc(s[2])}</i>`:'')+esc(s[3]):'';updateLetterPanel(t);
  $('time').textContent=fmt(t)+' / '+fmt(T_END);scrub.max=T_END;scrub.value=t;
  if(Math.floor(t)!==updateUI.lastWho){updateUI.lastWho=Math.floor(t);buildWho(t)}}
const liveSubs=[];const subAt=t=>SCENE==='diag'?null:[...SUBS,...liveSubs].find(s=>t>=s[0]&&t<s[1]);

/* ================= transport ================= */
let T=0,playing=false,dirty=true,lastNow=0,T_END=60,speed=1;
const scrub=$('scrub'),playBtn=$('play'),poster=$('poster');
function recomputeEnd(){T_END=Math.max(SCRIPT_END,...LOG.map(e=>e.t+e.dur+(e.args&&e.args.until?e.args.until:0)+2))}
async function setPlaying(p){playing=p;playBtn.textContent=p?'Pause':'Play';if(p){poster.hidden=true;if(T>=T_END-.05)T=0;await initAudio();if(AC&&AC.state==='suspended')await AC.resume();syncClock()}else{if(ENG)ENG.silence()}dirty=true}
function seek(t){T=clamp(t,0,T_END);poster.hidden=true;syncClock();dirty=true}
playBtn.addEventListener('click',()=>setPlaying(!playing));
poster.addEventListener('click',()=>{T=0;setPlaying(true)});
scrub.addEventListener('input',()=>seek(parseFloat(scrub.value)));
$('view').addEventListener('click',e=>{WIDE=!WIDE;e.target.setAttribute('aria-pressed',WIDE);dirty=true});
$('debug').addEventListener('click',e=>{DEBUG=!DEBUG;e.target.setAttribute('aria-pressed',DEBUG);dirty=true});
const SCENE_COPY={letter:{h:'The Letter to DHH',eyebrow:'Future Radio · Object Grammar v0.1 · correspondence',p:'Leonardo draws an enchanted quill with his pencil. The quill wakes, takes a <b>command</b> rather than being steered, and writes a sponsorship letter in ink, stroke by stroke, then addresses the envelope. The letter is a real artifact: exact text, vector strokes and provenance, kept in the scene log. <b>It is prepared, never sent.</b> Sending needs a separate human decision outside the scene.'},
episode:{h:'The Pilot Program · Opening Scene',eyebrow:'Future Radio · scene-log animation · approved script',p:'The approved scene script drives the animation log: characters act, the incoming message appears, and Leonardo takes the phrase “flying show” literally. Dialogue, acting beats, captions and drawing strokes remain tied to the original script events.'},
  main:{h:'Leonardo Draws Leonardo',eyebrow:'Future Radio · Visual Grammar v0.1 · recursion experiment',p:'Leonardo frames a corner of his wall and draws a smaller Leonardo who rings a bell the studio can hear. Then he puts a picture frame on his desk and draws Little Leonardo 2 inside it, who can do nothing until he puts on the Animator outfit. <b>Identity, role and capability are separate</b>: the outfit is a drawing that grants a role only while it is worn. Every action, scripted or yours, goes through the same engine call and the same capability check.'},
  diag:{h:'Diagnostic scene',eyebrow:'Future Radio · renderer check',p:'A line, a curve, a circle, four short marks and a bell, for checking the stroke renderer and the geometry-driven pencil audio. Turn on Debug to see the pencil tip, stroke boundaries and the audio clock.'}};
function applySceneCopy(){const c=SCENE_COPY[SCENE];$('h1').textContent=c.h;$('eyebrow').textContent=c.eyebrow;$('lede').innerHTML=c.p;$('scene').value=SCENE;
  $('letterPanel').hidden=SCENE!=='letter';$('deskSec').hidden=SCENE!=='main';cv.setAttribute('aria-label',SCENE==='episode'?'Animated scene: the Future Radio writers’ room prepares a flying show':SCENE==='letter'?'Animated scene: an enchanted quill writes a letter in Leonardo’s studio':'Animated scene: Leonardo draws in his studio')}
$('scene').addEventListener('change',async e=>{SCENE=e.target.value;if(ENG)ENG.silence();seed();recomputeEnd();buildLog();buildWho.k='';LVIEW=null;applySceneCopy();if(SCENE==='letter')fillEditor();if(AC)await loadVO(AC);T=0;poster.hidden=true;lastKey='';setPlaying(true)});
$('sound').addEventListener('click',e=>{soundOn=!soundOn;e.target.setAttribute('aria-pressed',soundOn);e.target.textContent=soundOn?'Sound on':'Sound off';if(!soundOn&&ENG)ENG.silence();else syncClock()});
$('runtests').addEventListener('click',()=>buildAcc());
$('copy').addEventListener('click',async e=>{const json=JSON.stringify({scene:'Future Radio — '+SCENE_COPY[SCENE].h,events:LOG.map(x=>({id:x.id,start:+x.t.toFixed(2),duration:+x.dur.toFixed(2),actor:x.actor,operation:x.op,target:x.target,frame:pathOf(x.frame),args:x.args&&typeof x.args.tpl==='object'?{...x.args,tpl:'inline'}:x.args,result:x.result,reason:x.reason||null,provenance:x.prov,cost:x.cost,unscripted:!!x.live}))},null,2);
  try{await navigator.clipboard.writeText(json);e.target.textContent='Copied'}catch(_){const ta=document.createElement('textarea');ta.value=json;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');e.target.textContent='Copied'}catch(__){e.target.textContent='Copy failed'}ta.remove()}
  setTimeout(()=>e.target.textContent='Copy as JSON',1600)});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!/INPUT|BUTTON|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();setPlaying(!playing)}});

/* ================= instruction desk ================= */
const whoEl=$('who'),statusEl=$('status'),instr=$('instr'),goBtn=$('go');
let ACTOR='leonardo';
function buildWho(t){const S=stateAt(Math.max(t,0));const key=Object.values(S.chars).map(c=>c.id+capsOf(S,c.id).join('')+(c.awake!=null&&T>=c.awake)).join('|')+ACTOR;if(key===buildWho.k)return;buildWho.k=key;
  whoEl.querySelectorAll('.chipbtn').forEach(b=>b.remove());
  for(const c of Object.values(S.chars)){if(c.prog<1)continue;const b=document.createElement('button');b.type='button';b.className='chipbtn';const caps=capsOf(S,c.id);
    b.innerHTML=`${esc(c.name)} <small>${esc(pathOf(c.frame).replace('studio › ',''))} · ${caps.length?caps.join(' '):'no capabilities'}</small>`;b.setAttribute('aria-pressed',c.id===ACTOR);
    b.addEventListener('click',()=>{ACTOR=c.id;buildWho.k='';buildWho(T)});whoEl.appendChild(b)}}
const SUGG=['Draw a frame on your desk with a Leonardo inside of it','Draw an animator outfit and a hook','Put on the outfit','Draw a star','Ring the bell','Take off the outfit and hang it up','Slide the desk to the right'];
for(const s of SUGG){const b=document.createElement('button');b.type='button';b.className='chipbtn';b.textContent=s;b.addEventListener('click',()=>run(s,true));$('sugg').appendChild(b)}
let sample=null,busy=false;
(async()=>{try{if(window.claude&&window.claude.use)sample=await window.claude.use('sample')}catch(_){sample=null}})();
function status(msg,err){statusEl.textContent=msg;statusEl.classList.toggle('err',!!err)}
async function planWithClaude(text,S,actor){FR=frameDefs();
  const reach=Object.values(FR).filter(x=>isAncestor(actor.frame,x.id)).map(x=>({id:x.id,name:x.name,parent:x.parent,surface:x.surface||false,size:[x.lw,x.lh]}));
  const chars=Object.values(S.chars).map(c=>({id:c.id,name:c.name,frame:c.frame,can:capsOf(S,c.id)}));
  const objs=Object.values(S.objects).filter(o=>isAncestor(actor.frame,o.frame)&&!o.held).map(o=>({id:o.id,name:o.name,kind:o.kind,frame:o.frame,worn_by:o.equippedBy}));
  const prompt=`You turn a viewer's instruction into construction steps for a character in a hand-drawn animated world made of nested frames.
The acting character: ${JSON.stringify({id:actor.id,name:actor.name,frame:actor.frame,can:capsOf(S,actor.id)})}
Frames it can reach (its own and those inside it): ${JSON.stringify(reach)}
Characters: ${JSON.stringify(chars)}
Objects it can reach: ${JSON.stringify(objs)}
Library templates: ${Object.keys(TPL).filter(k=>!['pencil','quill','inkwell','radio'].includes(k)).join(', ')}. "leonardo" makes a character; "outfit:animator" is a wearable outfit granting the Animator role (INSCRIBE, ALTER, ANIMATE, FRAME); "hook" is somewhere to hang an outfit.
Behaviors: ring, glow, sway, drift, swim, twinkle, spin, wake (characters).

Instruction: ${JSON.stringify(text)}

Reply with only JSON: {"say": string up to 8 words or "", "ops": [up to 6 ops]}. Op shapes:
{"op":"FRAME","on":"desk"|"wall"|"here"|"<frame id>","size":"small"|"medium"|"large","name":"<short>"}  creates a real nested frame (a world with its own coordinates). Use this whenever something should be inside a frame, picture, or canvas.
{"op":"INSCRIBE","template":"<library name>","in":"new"|"here"|"<frame id>"|"<character name>","as":"actor"|"drawing","on":"hook" (outfits only, optional),"name":"<short>","scale":0.5-1.5,"animate":"<behavior, optional>"}  "in":"new" means the frame created by the previous FRAME op. For "leonardo", "as":"actor" makes an independent character; use "drawing" only for an explicitly decorative portrait.
{"op":"INSCRIBE","template":null,"name":"<short>","in":...,"strokes":[[[x,y],...],...],"pivot":[x,y],"light":[x,y] or null,"behaviors":[...],"scale":0.5-1.5}  only for simple objects not in the library: 3-10 strokes of 3-24 points in a -50..50 box. Never use this for characters, frames, or outfits.
{"op":"ANIMATE","target":"<id or name, or $new for the character just drawn>","behavior":"<behavior>"}
{"op":"EQUIP","outfit":"<name or id, optional>","wearer":"<character name or id, optional; default the acting character>"}
{"op":"UNEQUIP","outfit":"<optional>","to":"hook"}
{"op":"ALTER","target":"<frame id, e.g. desk>","move":[dx,dy]}
Use only what the instruction asks for. Do not check capabilities yourself; the engine records any denial.`;
  return await sample.json(prompt,{modelTier:'default'})}
async function run(text,local){if(busy)return;text=String(text||'').trim();if(!text)return;if(SCENE!=='main'){status('Switch back to the main scene to give instructions.',true);return}FR=frameDefs();
  const S=stateAt(1e9);const actor=S.chars[ACTOR];if(!actor){status('Pick a character first.',true);return}
  let ops=[],say='',note='';busy=true;goBtn.disabled=true;
  try{if(!local&&sample){status('Asking Claude for a construction plan…');
      try{const plan=await planWithClaude(text,S,actor);ops=sanitize(plan);say=typeof plan.say==='string'?plan.say.slice(0,60):'';
        if(!structuralOK(text,ops)){ops=planLocal(text,S,ACTOR);note=' Claude’s plan drew pictures instead of a nested world, so the structural plan was used.'}}
      catch(e){const c=e&&e.code;if(c==='not_granted'||c==='sampling_disabled'||c==='not_declared'){sample=null;note=' Claude isn’t available here, so the built-in planner handled it.'}
        else if(c==='rate_limited'){status('Too many requests right now. Try again in a moment, or use a suggestion.',true);return}
        ops=planLocal(text,S,ACTOR)}}
    else ops=planLocal(text,S,ACTOR);
    if(!ops.length){status('Nothing in that instruction maps to an operation. Try naming an object, a frame, or the outfit.',true);return}
    LIVE_N++;const prov='viewer instruction #'+LIVE_N+' to '+actor.name+': “'+text.slice(0,80)+'”';
    const t0=Math.max(T,SCRIPT_END,...LOG.map(e=>e.t+e.dur))+.4;
    if(say)liveSubs.push([t0,t0+2.2,actor.name.toUpperCase(),say]);
    const r=invoke(ACTOR,ops,t0+(say?1.6:0),prov,{live:true});
    recomputeEnd();buildLog();buildWho.k='';if(T<t0-1){T=t0-.6;syncClock()}setPlaying(true);
    const den=r.emitted.filter(e=>e.result==='denied');
    status(`Added ${r.emitted.length} invocation${r.emitted.length===1?'':'s'} for ${actor.name}.`+(den.length?` ${den.length} denied: ${[...new Set(den.map(e=>e.reason))].join('; ')}.`:'')+note,den.length>0);instr.value='';
    window.__LAST_EMITTED=r.emitted.map(e=>({id:e.id,t:+e.t.toFixed(2),op:e.op,actor:e.actor,target:e.target,frame:pathOf(e.frame),result:e.result,reason:e.reason,args:e.args}))}
  catch(err){status('Couldn’t carry that out: '+(err.message||err),true)}
  finally{busy=false;goBtn.disabled=false}}
$('ask').addEventListener('submit',e=>{e.preventDefault();run(instr.value,false)});
