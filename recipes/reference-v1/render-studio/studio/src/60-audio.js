/* ================= stroke-audio engine ================= */
// Two classes of sound:
//  construction Foley, produced by visible pencil contact, driven by the choreography (tip speed, curvature, pressure, contact);
//  world observations, scheduled from the log by their own times (PROPAGATE arrivals), not tied to any visual.
const FOLEY={buf:null,taps:[[0,.09],[.11,.09],[.22,.09],[.33,.09],[.44,.09],[.55,.09],[.66,.09],[.77,.09]],source:'none'};
async function loadFoley(ac){if(FOLEY.buf)return FOLEY.buf;const out={};
  try{for(const n of['line','heavy','taps']){const r=await fetch('foley/'+n+'.wav');if(!r.ok)throw new Error(n);out[n]=await ac.decodeAudioData(await r.arrayBuffer())}FOLEY.source='recorded'}
  catch(e){// fallback: textured friction made of sparse stick-slip impulses, not broadband hiss
    const sr=ac.sampleRate,mk=(sec,dens,decay)=>{const b=ac.createBuffer(1,sr*sec,sr),d=b.getChannelData(0);let s=9;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};
      for(let i=0;i<d.length;i++){if(r()<dens){const a=(r()<.1?1:.25)*(r()*2-1);for(let k=0;k<decay&&i+k<d.length;k++)d[i+k]+=a*Math.exp(-k/(decay/4))*Math.sin(k*1.7)}}return b};
    out.line=mk(1,.02,40);out.heavy=mk(1.5,.05,70);out.taps=mk(1,0,1);const d=out.taps.getChannelData(0);for(const [o] of FOLEY.taps){const i0=Math.round(o*sr);for(let k=0;k<sr*.05;k++)d[i0+k]=Math.exp(-k/(sr*.004))*Math.sin(k*.9)*(.6+.4*Math.sin(k*.13))}
    FOLEY.source='synthesized fallback'}
  FOLEY.buf=out;return out}
// quill material: recorded nib friction loop, nib-contact ticks, ink dip, feather lift, paper fold (ElevenLabs sound effects)
const INKF={buf:null,ticks:[[0,.063]],source:'none'};
async function loadInk(ac){if(INKF.buf)return INKF.buf;const out={};
  try{for(const n of['nib','ticks','dip','lift','fold']){const r=await fetch('letter/'+n+'.wav');if(!r.ok)throw new Error(n);out[n]=await ac.decodeAudioData(await r.arrayBuffer())}
    try{const j=await (await fetch('letter/ticks.json')).json();if(Array.isArray(j)&&j.length)INKF.ticks=j}catch(_){}INKF.source='recorded'}
  catch(e){const sr=ac.sampleRate;let s=11;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};const mk=(sec,fn)=>{const b=ac.createBuffer(1,Math.round(sr*sec),sr),d=b.getChannelData(0);fn(d);return b};
    out.nib=mk(1.2,d=>{for(let i=0;i<d.length;i++)if(r()<.03){const a=(r()*2-1)*.5;for(let k=0;k<24&&i+k<d.length;k++)d[i+k]+=a*Math.exp(-k/5)*Math.sin(k*2.1)}});
    out.ticks=mk(.8,d=>{INKF.ticks=[];for(let j=0;j<10;j++){const i0=Math.round(j*.08*sr);INKF.ticks.push([j*.08,.06]);for(let k=0;k<sr*.03;k++)d[i0+k]=Math.exp(-k/(sr*.002))*Math.sin(k*1.3)*.5}});
    for(const n of['dip','lift','fold'])out[n]=mk(.6,d=>{for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*.15*Math.exp(-i/(sr*.12))});INKF.source='synthesized fallback'}
  INKF.buf=out;return out}
const VOB={};
async function loadVO(ac){for(const s of SUBS){const f=s[4];if(!f||f in VOB)continue;VOB[f]=null;try{const r=await fetch(f);if(r.ok)VOB[f]=await ac.decodeAudioData(await r.arrayBuffer())}catch(_){}}}
// pressure per event comes from what is drawn; frames are pressed hardest, marks are short and firm
const pressureOf=e=>{const p=planOf(e);return p?p.pressure:.5};
// Contact edges for every drawing event: exact scene times of pencil-down and pencil-up, plus corner ticks
const EDGES=new Map();
function edgesAll(){const key=VER;let r=EDGES.get(key);if(r)return r;r=[];
  for(const e of LOG){const p=planOf(e);if(!p||!e.dur||e.result==='denied'||!p.strokes.length)continue;const actor=e.actor;
    p.segs.forEach((s,j)=>{if(s.type!=='draw')return;const t0=e.t+s.u0*e.dur,t1=e.t+s.u1*e.dur;const pv=p.segs[j-1],nx=p.segs[j+1];r.push({t:t0,type:'down',e,si:s.si,actor,len:s.len,dur:t1-t0,jd:pv?pv.d:99});r.push({t:t1,type:'up',e,si:s.si,actor,len:s.len,dur:t1-t0,jd:nx?nx.d:99});
      // corners: invert the eased arc-length map to place ticks where the tip passes a sharp turn
      for(const cd of p.corners[s.si]){const f=cd/Math.max(1e-6,s.len);const k=Math.acos(1-2*clamp(f))/Math.PI;r.push({t:t0+k*(t1-t0),type:'corner',e,si:s.si,actor})}})}
  r.sort((a,b)=>a.t-b.t);EDGES.clear();EDGES.set(key,r);return r}
// world observations: what reaches the studio, when it reaches it
function observations(){const r=[];for(const e of LOG){if(e.result==='denied'){r.push({t:e.t,kind:'deny',e});continue}
    if(e.op==='PROPAGATE'&&e.args.kind==='sound')r.push({t:e.t+(e.args.arrive||0),kind:'bell',e,depth:FR&&FR[e.frame]?FR[e.frame].depth:1});
    if(e.op==='ANIMATE'&&e.args.behavior==='ring'&&FR&&FR[e.frame]&&FR[e.frame].depth===0)r.push({t:e.t,kind:'bell',e,depth:0});
    if(e.op==='ANIMATE'&&e.args.behavior==='ink-dip')r.push({t:e.t+e.dur*.4,kind:'dip',e});
    if(e.op==='ANIMATE'&&e.args.behavior==='awaken'&&e.dur>0)r.push({t:e.t+.2,kind:'lift',e});
    if(e.op==='ALTER'&&e.args.tuck)r.push({t:e.t,kind:'fold',e});
    if(e.op==='RECEIVE')r.push({t:e.t,kind:'carrier',e,dur:e.dur})}
  return r.sort((a,b)=>a.t-b.t)}
function makeEngine(ac,dest){const B=FOLEY.buf;const eng={ac,voices:{},log:[]};
  const bus=ac.createGain();bus.gain.value=.9;const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;bus.connect(comp);comp.connect(dest);eng.bus=bus;
  eng.voice=(cid)=>{if(eng.voices[cid])return eng.voices[cid];const v={};
    const loop=(buf,off)=>{const s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start(ac.currentTime,off%buf.duration);return s};
    v.s1=loop(B.line,hash(hashStr(cid),1)*B.line.duration);v.s2=loop(B.heavy,hash(hashStr(cid),2)*B.heavy.duration);
    v.g1=ac.createGain();v.g2=ac.createGain();v.g1.gain.value=0;v.g2.gain.value=0;
    v.f=ac.createBiquadFilter();v.f.type='lowpass';v.f.frequency.value=5000;v.f.Q.value=.6;
    v.body=ac.createBiquadFilter();v.body.type='peaking';v.body.frequency.value=900;v.body.gain.value=3;v.body.Q.value=.8;
    v.pan=ac.createStereoPanner?ac.createStereoPanner():ac.createGain();
    v.s1.connect(v.g1);v.s2.connect(v.g2);v.g1.connect(v.f);v.g2.connect(v.f);v.f.connect(v.body);v.body.connect(v.pan);v.pan.connect(bus);eng.voices[cid]=v;return v};
  eng.grain=(when,idx,gain,rate,pan)=>{const s=ac.createBufferSource();s.buffer=B.taps;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain;
    const p=ac.createStereoPanner?ac.createStereoPanner():null;if(p){p.pan.value=clamp(pan,-1,1);s.connect(g);g.connect(p);p.connect(bus)}else{s.connect(g);g.connect(bus)}
    const [o,d]=FOLEY.taps[idx%FOLEY.taps.length];s.start(Math.max(when,ac.currentTime),o,d)};
  eng.bell=(when,depth,gain)=>{const out=ac.createGain();out.gain.value=gain;const lpf=ac.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=7000/Math.max(1,depth*.7);out.connect(lpf);lpf.connect(bus);
    const base=880*Math.pow(1.5,Math.max(0,depth-1));for(const [r,a,d] of[[1,1,1.8],[2.76,.5,.9],[5.4,.25,.5],[.5,.3,2.2]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=base*r;g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(a,when+.004);g.gain.exponentialRampToValueAtTime(.001,when+d);o.connect(g);g.connect(out);o.start(when);o.stop(when+d+.05)}};
  const IB=INKF.buf;eng.srcs=[];eng.fresh=true;const track=s=>{eng.srcs.push(s);s.onended=()=>{const i=eng.srcs.indexOf(s);if(i>=0)eng.srcs.splice(i,1)}};
  eng.inkVoice=(id)=>{const k='ink:'+id;if(eng.voices[k])return eng.voices[k];const v={ink:true};v.s1=ac.createBufferSource();v.s1.buffer=IB.nib;v.s1.loop=true;v.s1.start(ac.currentTime,hash(hashStr(id),5)*IB.nib.duration);
    v.g1=ac.createGain();v.g1.gain.value=0;v.hp=ac.createBiquadFilter();v.hp.type='highpass';v.hp.frequency.value=420;v.f=ac.createBiquadFilter();v.f.type='lowpass';v.f.frequency.value=3000;v.f.Q.value=.5;
    v.pan=ac.createStereoPanner?ac.createStereoPanner():ac.createGain();v.s1.connect(v.g1);v.g1.connect(v.hp);v.hp.connect(v.f);v.f.connect(v.pan);v.pan.connect(bus);eng.voices[k]=v;return v};
  // soft nib contacts: the recorded ticks, darkened so they read as a nib touching paper, not a click
  const tickBus=ac.createBiquadFilter();tickBus.type='lowpass';tickBus.frequency.value=2800;tickBus.Q.value=.4;const tickHp=ac.createBiquadFilter();tickHp.type='highpass';tickHp.frequency.value=260;tickBus.connect(tickHp);tickHp.connect(bus);
  eng.tick=(when,idx,gain,rate,pan)=>{const s=ac.createBufferSource();s.buffer=IB.ticks;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain;const p=ac.createStereoPanner?ac.createStereoPanner():null;s.connect(g);
    if(p){p.pan.value=clamp(pan,-1,1);g.connect(p);p.connect(tickBus)}else g.connect(tickBus);const [o,d]=INKF.ticks[idx%INKF.ticks.length];s.start(Math.max(when,ac.currentTime),o,d);track(s)};
  eng.shot=(when,buf,gain)=>{if(!buf)return;const s=ac.createBufferSource();s.buffer=buf;const g=ac.createGain();g.gain.value=gain;s.connect(g);g.connect(bus);s.start(Math.max(when,ac.currentTime));track(s)};
  // a quiet carrier: filtered static and a faint tone. No voice, no melody: it cannot be heard as an answer.
  eng.carrier=(when,dur)=>{when=Math.max(when,ac.currentTime);const sr=ac.sampleRate;const nb=ac.createBuffer(1,Math.round(sr*dur),sr),d=nb.getChannelData(0);let z=5;for(let i=0;i<d.length;i++){z=(z*16807)%2147483647;d[i]=z/2147483647*2-1}
    const n=ac.createBufferSource();n.buffer=nb;const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1300;bp.Q.value=3;const g=ac.createGain();g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.05,when+.5);g.gain.setValueAtTime(.05,when+dur-.8);g.gain.linearRampToValueAtTime(0,when+dur);
    const o=ac.createOscillator();o.frequency.value=640;const og=ac.createGain();og.gain.setValueAtTime(0,when);og.gain.linearRampToValueAtTime(.012,when+.6);og.gain.linearRampToValueAtTime(0,when+dur);
    n.connect(bp);bp.connect(g);g.connect(bus);o.connect(og);og.connect(bus);n.start(when);o.start(when);o.stop(when+dur+.05);track(n);track(o)};
  eng.vo=(when,buf,off,radio)=>{const s=ac.createBufferSource();s.buffer=buf;const g=ac.createGain();g.gain.value=radio?1.1:1;let n=s;
    if(radio){const hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=320;const lpf=ac.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=3600;const pk=ac.createBiquadFilter();pk.type='peaking';pk.frequency.value=1600;pk.gain.value=4;s.connect(hp);hp.connect(lpf);lpf.connect(pk);n=pk}
    n.connect(g);g.connect(dest);s.start(Math.max(when,ac.currentTime),off);track(s)};
  eng.thunk=(when)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(180,when);o.frequency.exponentialRampToValueAtTime(70,when+.25);g.gain.setValueAtTime(0,when);g.gain.linearRampToValueAtTime(.1,when+.01);g.gain.exponentialRampToValueAtTime(.001,when+.3);o.connect(g);g.connect(bus);o.start(when);o.stop(when+.32)};
  // schedule scene interval [s0,s1) to context time via map(scene)->ctxTime; rate = scene seconds per context second
  eng.schedule=(s0,s1,map,rate=1)=>{const keep=FR;const step=1/100;
    for(const ed of edgesAll()){if(ed.t<s0||ed.t>=s1)continue;FR=frameDefs(ed.t);const S_=stateAt(ed.t);const c=S_.chars[ed.actor];
      if(!c){const q=S_.objects[ed.actor];if(q&&q.instrument==='quill'&&IB){const P=quillPose(q,ed.t);const pan=(P.tip[0]-640)/900;const idx=Math.floor(hash(hashStr(ed.e.id),ed.si+(ed.type==='up'?50:0))*10);const joined=ed.jd<2;
        if(ed.type==='down'){eng.tick(map(ed.t),idx,joined?.07:.26,.95+hash(ed.si,7)*.1,pan);eng.log.push({t:ed.t,type:'down',ink:true})}else{if(!joined)eng.tick(map(ed.t),idx,.09,1.18,pan);eng.log.push({t:ed.t,type:'up',ink:true})}}continue}const ps=pencilState(c,ed.t);const w=toWorld(c.frame,ps.p);const dg=clamp(Math.sqrt(frameScale(ed.e.frame))*1.25,.3,1);const pr=pressureOf(ed.e);
      const idx=Math.floor(hash(hashStr(ed.e.id),ed.si+(ed.type==='up'?50:0))*8);const pan=(w[0]-640)/900;
      if(ed.type==='down'){const short=ed.dur<.3;eng.grain(map(ed.t),idx,(.55+.35*pr)*dg*(short?1.15:1),.9+hash(ed.si,3)*.12,pan);eng.log.push({t:ed.t,type:'down'})}
      else if(ed.type==='up'){eng.grain(map(ed.t),idx,.28*dg,1.12,pan);eng.log.push({t:ed.t,type:'up'})}
      else{eng.grain(map(ed.t),idx,.16*dg,1.25,pan);eng.log.push({t:ed.t,type:'corner'})}}
    for(const ob of observations()){if(ob.t<s0||ob.t>=s1)continue;if(ob.kind==='bell')eng.bell(map(ob.t),ob.depth,.16/Math.max(1,ob.depth*.7));else if(ob.kind==='dip')eng.shot(map(ob.t),IB&&IB.dip,.5);else if(ob.kind==='lift')eng.shot(map(ob.t),IB&&IB.lift,.45);
      else if(ob.kind==='fold')eng.shot(map(ob.t),IB&&IB.fold,.55);else if(ob.kind==='carrier'){if(IB)eng.carrier(map(ob.t),ob.dur)}else eng.thunk(map(ob.t));eng.log.push({t:ob.t,type:ob.kind})}
    if(!eng.noVO)for(const sb of SUBS){const b=sb[4]&&VOB[sb[4]];if(!b)continue;const radio=/^AGNOLO/.test(sb[2]);if(sb[0]>=s0&&sb[0]<s1)eng.vo(map(sb[0]),b,0,radio);else if(eng.fresh&&sb[0]<s0&&s0<sb[0]+b.duration-.1)eng.vo(map(s0),b,s0-sb[0],radio)}
    eng.fresh=false;
    // continuous texture: sample the choreography on the scene clock, ramp parameters smoothly
    const actors=new Set(LOG.filter(e=>planOf(e)).map(e=>e.actor));
    for(let s=Math.ceil(s0/step)*step;s<s1;s+=step){FR=frameDefs(s);const S=stateAt(s);
      for(const cid of actors){const c=S.chars[cid];if(!c){const q=S.objects[cid];if(q&&q.instrument==='quill'&&IB&&q.activated!=null&&s>=q.activated){const v=eng.inkVoice(q.id);const P=quillPose(q,s);let g=0,cut=2000,rt=1,pan=0;
          if(P.phase==='write'){const a=quillPose(q,s-step/2).tip,b=quillPose(q,s+step/2).tip;const vx=(b[0]-a[0])/step,vy=(b[1]-a[1])/step,vel=Math.hypot(vx,vy);const sc=frameAffine(P.drawing.frame)[0];const sp=clamp(vel/(300*sc));const down=clamp(.5+.5*vy/(vel+1e-6));
            g=.8*Math.pow(sp,.6)*(.5+.5*down);cut=1100+2400*sp+900*down;rt=.85+.35*sp;pan=(P.tip[0]-640)/900}
          else if(P.phase==='travel'&&P.ev&&P.ev.seg&&P.ev.seg.d<2)g=.12;
          const at=map(s);v.g1.gain.linearRampToValueAtTime(g,at);v.f.frequency.linearRampToValueAtTime(cut,at);v.s1.playbackRate.linearRampToValueAtTime(rt*rate,at);if(v.pan.pan)v.pan.pan.linearRampToValueAtTime(clamp(pan,-1,1),at)}continue}
        if(c.prog<1)continue;const v=eng.voice(cid);const ps=pencilState(c,s);
        let g1=0,g2=0,cut=2200,rt=1,pan=0;
        if(ps.contact&&ps.drawing){const a=toWorld(c.frame,pencilState(c,s-step/2).p),b=toWorld(c.frame,pencilState(c,s+step/2).p);const vel=dist(a,b)/step;// world px per second
          const pr=pressureOf(ps.drawing);const dg=clamp(Math.sqrt(frameScale(ps.drawing.frame))*1.25,.3,1);const sp=clamp(vel/260);
          const curv=(()=>{const p0=toWorld(c.frame,pencilState(c,s-step).p),p2=toWorld(c.frame,pencilState(c,s+step).p),p1=toWorld(c.frame,ps.p);const a1=Math.atan2(p1[1]-p0[1],p1[0]-p0[0]),a2=Math.atan2(p2[1]-p1[1],p2[0]-p1[0]);let d=Math.abs(a2-a1);if(d>Math.PI)d=2*Math.PI-d;return clamp(d/.6)})();
          const sl=ps.ev.seg&&ps.ev.seg.len!=null?clamp(ps.ev.seg.len/45,.25,1):1;g1=Math.pow(sp,.6)*(.35+.65*pr)*dg*.9*sl;g2=Math.pow(sp,.7)*clamp((pr-.5)*2.5)*dg*.8*sl;cut=1800+5200*sp+1200*curv;rt=.82+.42*sp+.08*curv;pan=(toWorld(c.frame,ps.p)[0]-640)/900}
        const at=map(s);v.g1.gain.linearRampToValueAtTime(g1,at);v.g2.gain.linearRampToValueAtTime(g2,at);v.f.frequency.linearRampToValueAtTime(cut,at);
        v.s1.playbackRate.linearRampToValueAtTime(rt*rate,at);v.s2.playbackRate.linearRampToValueAtTime(rt*.9*rate,at);if(v.pan.pan)v.pan.pan.linearRampToValueAtTime(clamp(pan,-1,1),at)}}
    FR=keep};
  eng.silence=()=>{const now=ac.currentTime;for(const v of Object.values(eng.voices)){for(const p of[v.g1&&v.g1.gain,v.g2&&v.g2.gain].filter(Boolean)){p.cancelScheduledValues(now);p.setTargetAtTime(0,now,.02)}}for(const s of eng.srcs.splice(0)){try{s.stop()}catch(_){}}eng.fresh=true};
  return eng}

/* realtime: the audio clock drives the scene clock while playing; a lookahead scheduler runs on a timer, not on animation frames */
let AC=null,ENG=null,soundOn=true,acBase=0,tBase=0,schedTo=0;
async function initAudio(){if(AC)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();await loadFoley(AC);await loadInk(AC);await loadVO(AC);ENG=makeEngine(AC,AC.destination)}catch(e){AC=null}}
function sceneNow(){if(playing&&AC&&AC.state==='running')return tBase+(AC.currentTime-acBase)*speed;return T}
function syncClock(){if(AC){acBase=AC.currentTime;tBase=T;schedTo=T;if(ENG)ENG.silence()}lastNow=performance.now();tBase=T}
setInterval(()=>{if(!playing||!AC||!ENG||!soundOn||AC.state!=='running')return;const horizon=sceneNow()+.15*speed;if(horizon<=schedTo)return;
  const from=Math.max(schedTo,sceneNow());ENG.schedule(from,horizon,s=>acBase+(s-tBase)/speed,speed);schedTo=horizon},25);

