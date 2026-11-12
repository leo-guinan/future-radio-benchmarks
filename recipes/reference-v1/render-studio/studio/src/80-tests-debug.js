/* ================= tests ================= */
function snapshot(){return{LOG:LOG.slice(),ORDERED:ORDERED.slice(),NEXT,uid,SUBS:SUBS.slice(),SCRIPT_END,SCENE,LCAM:LCAM.slice(),LEC:LETTER_END_CARD,LPT:LETTER_POSTER_T}}
function restore(s){LOG=s.LOG.slice();ORDERED=s.ORDERED.slice();NEXT=s.NEXT;uid=s.uid;SUBS.length=0;SUBS.push(...s.SUBS);SCRIPT_END=s.SCRIPT_END;SCENE=s.SCENE;LCAM=s.LCAM.slice();LETTER_END_CARD=s.LEC;LETTER_POSTER_T=s.LPT;VER++;FR=frameDefs()}
const structural=S=>JSON.stringify({c:Object.values(S.chars).map(c=>[c.id,c.frame,c.at,c.caps,c.equipped,c.awake]).sort(),o:Object.values(S.objects).map(o=>[o.id,o.frame,o.at.map(v=>+v.toFixed(3)),o.equippedBy,o.held,o.behaviors.map(b=>b.b)]).sort(),f:Object.keys(S.frames).sort()});
function acceptanceTests(){const out=[];const T=(name,fn)=>{let pass=false,detail='';try{const r=fn();pass=!!r.pass;detail=r.detail||''}catch(e){detail='error: '+e.message}out.push({name,pass,detail})};
  const snap=snapshot();const END=1e6;const findE=(pred)=>LOG.find(pred);const L2=findE(e=>e.prov==='scripted'&&e.op==='INSCRIBE'&&e.args.tpl==='leonardo'&&e.frame!=='F1');
  const L2id=L2&&L2.target,F2=L2&&L2.frame;
  T('Viewer instruction creates a real nested desk frame, not decorative strokes',()=>{const instr='Draw a frame on your desk with a Leonardo inside of it.';FR=frameDefs();const S=stateAt(SCRIPT_END);
    const ops=planLocal(instr,S,'leonardo');const r=invoke('leonardo',ops,SCRIPT_END+1,'test');const fe=r.emitted.find(e=>e.op==='FRAME');const ce=r.emitted.find(e=>e.op==='INSCRIBE'&&e.args.tpl==='leonardo');
    const inlineInStudio=r.emitted.some(e=>e.op==='INSCRIBE'&&e.frame==='studio');restore(snap);
    return{pass:fe&&fe.frame==='desk'&&fe.result==='ok'&&ce&&ce.frame===fe.args.id&&!inlineInStudio,detail:r.emitted.map(e=>e.op+' '+e.target+' in '+e.frame+(e.result==='denied'?' (denied)':'')).join('; ')}});
  T('A new Leonardo is registered as a separate controllable actor',()=>{const S=stateAt(END);const c=S.chars[L2id];return{pass:!!c&&c.id!=='leonardo'&&c.id!=='mini'&&c.creator==='leonardo',detail:c?c.name+' ('+c.id+') in '+c.frame:'missing'}});
  T('The actor renders within the correct nested coordinate system',()=>{FR=frameDefs(END);const S=stateAt(END);const c=S.chars[L2id];const feet=charWorld(c,[0,0]);const f=FR[c.frame];const a=toWorld(f.id,[0,0]),b=toWorld(f.id,[f.lw,f.lh]);
    const d=FR.desk;const da=toWorld('desk',[0,0]),db=toWorld('desk',[d.lw,d.lh]);const inF=feet[0]>=a[0]&&feet[0]<=b[0]&&feet[1]>=a[1]&&feet[1]<=b[1]+.01;const inD=a[0]>=da[0]&&b[0]<=db[0]&&a[1]>=da[1]&&b[1]<=db[1];
    return{pass:inF&&inD&&f.parent==='desk',detail:'path '+pathOf(c.frame)+', feet at '+feet.map(v=>v.toFixed(1)).join(',')}});
  T('Moving the desk moves its child frame and contents consistently',()=>{FR=frameDefs(END);let S=stateAt(END);const before=charWorld(S.chars[L2id],[0,-139]);const fb=toWorld(F2,[0,0]);
    add({t:SCRIPT_END+1,dur:1,actor:'leonardo',op:'ALTER',target:'desk',frame:'studio',args:{move:[60,0]},prov:'test',cost:'—'});FR=frameDefs(END);S=stateAt(END);
    const after=charWorld(S.chars[L2id],[0,-139]);const fa=toWorld(F2,[0,0]);restore(snap);const dx=after[0]-before[0],dfx=fa[0]-fb[0];
    return{pass:Math.abs(dx-60)<1e-6&&Math.abs(dfx-60)<1e-6&&Math.abs(after[1]-before[1])<1e-6,detail:'frame moved '+dfx.toFixed(2)+', character moved '+dx.toFixed(2)}});
  T('The nested actor can execute an independent instruction',()=>{const eq=LOG.find(e=>e.op==='EQUIP'&&e.args.wearer===L2id&&e.result==='ok');const tq=eq.t+eq.dur+.05;
    LOG=LOG.filter(e=>e.t<=tq);ORDERED=ORDERED.filter(e=>e.t<=tq);VER++;FR=frameDefs();const r=invoke(L2id,planLocal('draw a star',stateAt(tq),L2id),tq+.1,'test');const e=r.emitted.find(e=>e.op==='INSCRIBE');restore(snap);
    return{pass:!!e&&e.result==='ok'&&e.actor===L2id&&e.frame===F2,detail:e?e.op+' '+e.target+' by '+e.actor+' in '+e.frame+': '+e.result:'no event'}});
  T('Character templates are reused without sharing mutable state',()=>{const S=stateAt(END);const a=S.chars.mini,b=S.chars[L2id],c=S.chars.leonardo;
    return{pass:a.tpl===b.tpl&&b.tpl===c.tpl&&a.caps!==b.caps&&a.equipped!==b.equipped&&a.at!==b.at&&JSON.stringify(a.caps)!==JSON.stringify(b.caps),detail:'shared template, separate caps: mini '+a.caps.length+' / '+b.name+' '+b.caps.length}});
  const outfitE=findE(e=>e.op==='INSCRIBE'&&e.args.tpl==='outfit:animator');const oid=outfitE&&outfitE.target;
  const eqE=findE(e=>e.op==='EQUIP'&&e.args.wearer===L2id),unE=findE(e=>e.op==='UNEQUIP'&&e.args.wearer===L2id);
  T('An outfit can be drawn as a persistent object',()=>{const S=stateAt(END);const o=S.objects[oid];return{pass:!!o&&o.kind==='outfit'&&o.design==='animator',detail:o?o.name+' by '+o.creator:'missing'}});
  T('EQUIP changes both appearance and capability bindings',()=>{const a=stateAt(eqE.t-.01),b=stateAt(eqE.t+eqE.dur+.01);const ca=capsOf(a,L2id),cb=capsOf(b,L2id);
    return{pass:b.objects[oid].equippedBy===L2id&&b.chars[L2id].equipped.includes(oid)&&cb.length>ca.length&&cb.includes('INSCRIBE'),detail:'['+ca.join(' ')+'] → ['+cb.join(' ')+'], role '+roleOf(b,L2id)}});
  T('UNEQUIP reverses outfit effects without deleting the outfit',()=>{const b=stateAt(unE.t+unE.dur+.01);const o=b.objects[oid];
    return{pass:!!o&&!o.equippedBy&&JSON.stringify(capsOf(b,L2id))===JSON.stringify(BASELINE_NEW)&&o.frame===F2,detail:'caps back to ['+capsOf(b,L2id).join(' ')+'], outfit on '+(unE.args.to||'?')}});
  T('A restricted action fails cleanly before equipping and succeeds after',()=>{const d=LOG.find(e=>e.actor===L2id&&e.op==='ANIMATE'&&e.args.behavior==='drift'&&e.result==='denied'&&e.t<eqE.t);const ok=LOG.find(e=>e.actor===L2id&&e.op==='ANIMATE'&&e.args.behavior==='drift'&&e.result==='ok'&&e.t>eqE.t);
    const S=stateAt(d.t+.5);const cloudBefore=Object.values(S.objects).find(o=>o.frame===F2&&o.tpl===TPL.cloud);return{pass:!!d&&!!ok&&cloudBefore.behaviors.length===0,detail:d?'denied: '+d.reason+'; then ok at '+ok.t.toFixed(1)+'s':''}});
  T('The bell’s sound crosses the frame boundary without promoting the bell',()=>{const p=LOG.find(e=>e.op==='PROPAGATE'&&e.frame===F2);const S=stateAt(p.t+.5);const bell=S.objects[p.target];
    return{pass:!!p&&bell.frame===F2&&!!S.looks.leonardo,detail:'source in '+pathOf(bell.frame)+'; Leonardo turns: '+!!S.looks.leonardo}});
  T('The scene replays from its log to an identical final state',()=>{const a=stateAt(END,ORDERED.filter(e=>LOG.includes(e))),b=stateAt(END);const same=structural(a)===structural(b);
    return{pass:same&&b.mismatch.length===0,detail:LOG.length+' events; schedule-order and time-order replays '+(same?'match':'differ')+'; '+b.mismatch.length+' result mismatches'}});
  T('The original F1 log remains compatible',()=>{const S=stateAt(31);const m=S.chars.mini;const v1=LOG.filter(e=>e.t>=0&&e.t<31);
    return{pass:!!m&&m.awake!=null&&!!S.objects.bell&&v1.every(e=>e.result==='ok')&&S.mismatch.length===0,detail:v1.length+' v1 events, all applied'}});
  restore(snap);return out}
// sample every character's pencil tip in world space on a fixed clock
function tipTrack(t0,t1,hz){const out=[];for(let i=0;;i++){const t=t0+i/hz;if(t>t1)break;FR=frameDefs(t);const S=stateAt(t);const row={t};for(const c of Object.values(S.chars)){if(c.prog<1)continue;const ps=pencilState(c,t);row[c.id]={w:toWorld(c.frame,ps.p),contact:ps.contact,ps}}out.push(row)}return out}
function polishTests(){const out=[];const T=(name,fn)=>{let pass=false,detail='';try{const r=fn();pass=!!r.pass;detail=r.detail||''}catch(e){detail='error: '+e.message}out.push({name,pass,detail})};
  const snap=snapshot();
  const scenes={main:()=>{SCENE='main';seedMain()},diag:()=>{SCENE='diag';seedDiag()}};
  for(const [nm,seedFn] of Object.entries(scenes)){seedFn();const end=SCRIPT_END;
    T(`Pencil tip moves continuously (${nm})`,()=>{const tr=tipTrack(0,end,240);let worst=0,where=null,ids=new Set();for(let i=1;i<tr.length;i++)for(const k of Object.keys(tr[i])){if(k==='t'||!tr[i-1][k])continue;const d=dist(tr[i-1][k].w,tr[i][k].w);if(d>worst){worst=d;where=[k,tr[i].t]}}
      const vmax=worst*240;return{pass:worst<9,detail:`max step ${worst.toFixed(2)} px at 240 Hz (${Math.round(vmax)} px/s) ${where?'· '+where[0]+' @ '+where[1].toFixed(2)+'s':''}`}});
    T(`Line emerges directly beneath the tip (${nm})`,()=>{let worst=0,n=0;for(const e of LOG){const p=planOf(e);if(!p||!e.dur||!p.strokes.length)continue;for(let i=1;i<40;i++){const t=e.t+e.dur*i/40;FR=frameDefs(t);const S=stateAt(t);const c=S.chars[e.actor];if(!c)continue;const ps=pencilState(c,t);if(!ps.contact)continue;
        const r=evalPlan(p,i/40);const pl=revealFracs(p.strokes,r.fracs);const end=pl[pl.length-1];const last=end[end.length-1];const sh=frameShift(e);const wEnd=toWorld(e.frame,[last[0]+sh[0],last[1]+sh[1]]);const wTip=toWorld(c.frame,ps.p);worst=Math.max(worst,dist(wEnd,wTip));n++}}
      return{pass:n>20&&worst<1e-6,detail:`${n} contact samples, max tip-to-line gap ${worst.toExponential(1)} px`}})}
  seedDiag();
  T('No jump at stroke boundaries (diagnostic)',()=>{let worst=0;for(const ed of edgesAll()){for(const dt of[-1/240,1/240]){const t=ed.t,t2=ed.t+dt;FR=frameDefs(t);const c=stateAt(t).chars[ed.actor];const a=toWorld(c.frame,pencilState(c,t).p),b=toWorld(c.frame,pencilState(c,t2).p);worst=Math.max(worst,dist(a,b))}}
    return{pass:worst<3,detail:`max movement across a contact edge in 1/240 s: ${worst.toFixed(2)} px over ${edgesAll().length} edges`}});
  T('Identical result at 30, 60 and 144 fps',()=>{const runAt=fps=>{VER++;let t=0;const samples=[];while(t<SCRIPT_END){const dt=1/fps*(fps===60?(.7+.6*hash(t*100,1)):1);t=Math.min(SCRIPT_END,t+dt);FR=frameDefs(t);const S=stateAt(t);for(const c of Object.values(S.chars))if(c.prog>=1)pencilState(c,t)}
      FR=frameDefs(SCRIPT_END);const S=stateAt(SCRIPT_END);for(const q of[1.5,2.25,3.1,4.4]){FR=frameDefs(q);const c=stateAt(q).chars.leonardo;samples.push(toWorld('studio',pencilState(c,q).p).map(v=>v.toFixed(9)).join())}return structural(S)+samples.join('|')};
    const a=runAt(30),b=runAt(60),c=runAt(144);return{pass:a===b&&b===c,detail:'final state and tip samples '+(a===b&&b===c?'identical':'differ')+' (60 fps run uses irregular frame times)'}});
  T('Rendering is deterministic for a given time',()=>{const h=()=>{const d=ctx.getImageData(0,0,Math.min(cv.width,400),Math.min(cv.height,300)).data;let x=0;for(let i=0;i<d.length;i+=7)x=(x*31+d[i])%1000000007;return x};render(2.37);const a=h();render(5.11);render(2.37);const b=h();return{pass:a===b,detail:'pixel hash '+a+' / '+b}});
  T('Every stroke gets a pencil-down and a pencil-up',()=>{const ed=edgesAll();const downs=ed.filter(e=>e.type==='down').length,ups=ed.filter(e=>e.type==='up').length;let strokes=0;for(const e of LOG){const p=planOf(e);if(p&&e.dur)strokes+=p.strokes.length}
    return{pass:downs===strokes&&ups===strokes,detail:`${strokes} strokes, ${downs} downs, ${ups} ups, ${ed.filter(e=>e.type==='corner').length} corner ticks`}});
  T('World observations keep their own timing',()=>{seedMain();const ring=LOG.find(e=>e.op==='ANIMATE'&&e.args.behavior==='ring'&&e.frame==='F1');
    add({t:ring.t+.1,dur:2.6,actor:'bell',op:'PROPAGATE',target:'bell',frame:'F1',args:{kind:'sound',arrive:.8},prov:'test',cost:'—'});FR=frameDefs();const ob=observations().find(o=>o.e.prov==='test');
    return{pass:!!ob&&Math.abs(ob.t-(ring.t+.9))<1e-9,detail:ob?`ring visible at ${ring.t.toFixed(2)}s, heard in the studio at ${ob.t.toFixed(2)}s`:'none'}});
  restore(snap);return out}

/* ================= offline audio check ================= */
// Render the diagnostic scene's audio with the same engine into an offline context and measure it.
async function audioTests(){const snap=snapshot();SCENE='diag';seedDiag();const sr=24000,dur=SCRIPT_END;const oac=new OfflineAudioContext(1,Math.ceil(sr*dur),sr);await loadFoley(oac);
  const eng=makeEngine(oac,oac.destination);eng.schedule(0,dur,s=>s,1);const buf=await oac.startRendering();const x=buf.getChannelData(0);
  const win=Math.round(sr*.02);const rms=[];for(let i=0;i+win<=x.length;i+=win){let s=0;for(let k=0;k<win;k++)s+=x[i+k]*x[i+k];rms.push(Math.sqrt(s/win))}
  const at=t=>rms[Math.min(rms.length-1,Math.floor(t/.02))]||0;const db=v=>20*Math.log10(v+1e-9);
  // contact vs no contact
  const edges=edgesAll();const inContact=t=>edges.some((e,i)=>e.type==='down'&&t>=e.t&&t<=e.t+e.dur);
  let on=[],off=[];for(let i=0;i<rms.length;i++){const t=i*.02+.01;const near=edges.some(e=>Math.abs(e.t-t)<.12);if(near)continue;(inContact(t)?on:off).push(rms[i])}
  const mean=a=>a.reduce((p,c)=>p+c,0)/Math.max(1,a.length);
  // spectral flatness during the long line vs white noise
  const fft=(re)=>{const n=re.length,im=new Float64Array(n);for(let i=0,j=0;i<n;i++){if(i<j){[re[i],re[j]]=[re[j],re[i]]}let m=n>>1;while(m>=1&&j&m){j^=m;m>>=1}j|=m}
    for(let s=2;s<=n;s<<=1){const h=s>>1,a=-2*Math.PI/s;for(let i=0;i<n;i+=s)for(let k=0;k<h;k++){const c=Math.cos(a*k),d=Math.sin(a*k),tr=c*re[i+k+h]-d*im[i+k+h],ti=d*re[i+k+h]+c*im[i+k+h];re[i+k+h]=re[i+k]-tr;im[i+k+h]=im[i+k]-ti;re[i+k]+=tr;im[i+k]+=ti}}
    const p=[];for(let i=1;i<n/2;i++)p.push(re[i]*re[i]+im[i]*im[i]);return p};
  const flat=sig=>{const N=1024;let acc=null,cnt=0;for(let i=0;i+N<=sig.length;i+=N/2){const seg=new Float64Array(N);for(let k=0;k<N;k++)seg[k]=sig[i+k]*(.5-.5*Math.cos(2*Math.PI*k/N));const p=fft(seg);if(!acc)acc=p.map(()=>0);p.forEach((v,k)=>acc[k]+=v);cnt++}
    const P=acc.slice(8).map(v=>v/cnt+1e-20);return Math.exp(P.reduce((a,v)=>a+Math.log(v),0)/P.length)/(P.reduce((a,v)=>a+v,0)/P.length)};
  const lineE=LOG.find(e=>e.args&&e.args.tpl==='line'),marksE=LOG.find(e=>e.args&&e.args.tpl==='marks');
  const seg=(t0,t1)=>x.slice(Math.floor(t0*sr),Math.floor(t1*sr));const lineSig=seg(lineE.t+lineE.dur*.25,lineE.t+lineE.dur*.75);const noise=new Float64Array(lineSig.length).map(()=>Math.random()*2-1);
  const fl=flat(lineSig),fn=flat(noise);
  const sustained=(t0,t1)=>{let a=0,n=0;for(let t=t0;t<t1;t+=.02){n++;if(db(at(t))>-46)a++}return a/n};
  const lineSus=sustained(lineE.t+lineE.dur*.15,lineE.t+lineE.dur*.85),marksSus=sustained(marksE.t,marksE.t+marksE.dur);
  const peaks=(t0,t1)=>{let c=0;for(let t=t0+.02;t<t1;t+=.02)if(at(t)>at(t-.02)*2.2&&db(at(t))>-40)c++;return c};
  const res=[
   {name:'Pencil texture, not broadband hiss',pass:fl<fn*.35,detail:`spectral flatness ${fl.toFixed(3)} during the long line vs ${fn.toFixed(3)} for white noise · source: ${FOLEY.source}`},
   {name:'Silent when the pencil is off the paper',pass:db(mean(off))<db(mean(on))-18,detail:`in contact ${db(mean(on)).toFixed(1)} dBFS, lifted ${db(mean(off)).toFixed(1)} dBFS`},
   {name:'Short marks sound different from long strokes',pass:lineSus>.7&&marksSus<lineSus*.7&&peaks(marksE.t,marksE.t+marksE.dur)>=3,detail:`long line sustained ${Math.round(lineSus*100)}% of the time, marks ${Math.round(marksSus*100)}% with ${peaks(marksE.t,marksE.t+marksE.dur)} transients`},
   {name:'Contact sounds at stroke starts and ends',pass:eng.log.filter(l=>l.type==='down').length===edges.filter(e=>e.type==='down').length&&eng.log.filter(l=>l.type==='up').length===edges.filter(e=>e.type==='up').length,detail:`${eng.log.filter(l=>l.type==='down').length} pencil-down and ${eng.log.filter(l=>l.type==='up').length} pencil-up grains scheduled`}];
  restore(snap);window.__AUDIO=x;return res}

/* ================= debug overlay ================= */
const PERF={times:[],fps:0,ms:0};
function drawDebug(t){ctx.save();ctx.setTransform(SC,0,0,SC,0,0);ctx.fillStyle='rgba(10,12,12,.78)';ctx.fillRect(10,10,420,250);ctx.font='12px "IBM Plex Mono", monospace';ctx.fillStyle='#d8f5f1';
  const lines=[];lines.push(`fps ${PERF.fps.toFixed(0)} · frame ${PERF.ms.toFixed(1)} ms · scene ${t.toFixed(3)} s`);
  const audioT=AC&&playing?sceneNow():null;const lat=AC?((AC.baseLatency||0)+(AC.outputLatency||0))*1000:0;
  lines.push(`audio playhead ${audioT!=null?audioT.toFixed(3)+' s':'—'} · A/V offset ${audioT!=null?((audioT-t)*1000).toFixed(1):'—'} ms · output latency ${lat.toFixed(0)} ms`);
  lines.push(`foley: ${FOLEY.source}`);
  const act=LOG.filter(e=>t>=e.t&&t<=e.t+e.dur&&!e.hide).slice(0,4);lines.push('active events:');for(const e of act)lines.push(`  ${e.id} ${e.op} ${e.actor}→${e.target} ${Math.round(clamp((t-e.t)/e.dur)*100)}%${e.result==='denied'?' denied':''}`);
  for(const c of Object.values(S_NOW.chars)){if(c.prog<1)continue;const ps=pencilState(c,t);if(ps.phase==='rest'&&!ps.drawing)continue;const w=toWorld(c.frame,ps.p);const f=FR[c.frame];
    lines.push(`${c.name}: ${ps.phase}${ps.drawing?' · stroke '+(ps.ev.si+1)+'/'+ps.plan.strokes.length:''} · tip ${w[0].toFixed(1)},${w[1].toFixed(1)}`);
    lines.push(`  clock ${f.id} ${(t-(f.t>0?f.t:0)).toFixed(2)} s · parent ${f.parent||'—'} ${(t-(f.parent&&FR[f.parent].t>0?FR[f.parent].t:0)).toFixed(2)} s`)}
  lines.slice(0,15).forEach((l,i)=>ctx.fillText(l,20,30+i*15));
  // event boundaries on a 12-second strip around now
  const x0=10,y0=H-46,w0=W-20;ctx.fillStyle='rgba(10,12,12,.78)';ctx.fillRect(x0,y0,w0,36);const span=12,ts=t-span/2;
  for(const e of LOG){if(e.hide||e.t+e.dur<ts||e.t>ts+span)continue;const a=x0+(e.t-ts)/span*w0,b=x0+(e.t+e.dur-ts)/span*w0;ctx.fillStyle=e.result==='denied'?'#d9806a':'#7cc6c1';ctx.globalAlpha=.6;ctx.fillRect(a,y0+6,Math.max(2,b-a),10);ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.fillRect(a,y0+4,1,14)}
  for(const ed of edgesAll()){if(ed.t<ts||ed.t>ts+span||ed.type==='corner')continue;const a=x0+(ed.t-ts)/span*w0;ctx.fillStyle=ed.type==='down'?'#4fd1c5':'#e7a23c';ctx.fillRect(a,y0+20,1.5,10)}
  ctx.fillStyle='#ff6';ctx.fillRect(x0+w0/2,y0,2,36);ctx.restore()}

