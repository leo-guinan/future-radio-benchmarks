/* ================= drawing ================= */
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');let SC=1;
function resize(){const dpr=Math.min(2,window.devicePixelRatio||1);const r=cv.getBoundingClientRect();cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));SC=cv.width/W;dirty=true}
const PAPER='#efe6d3',GRAPH='rgba(46,42,38,.9)';
const grain=document.createElement('canvas');grain.width=grain.height=200;{const g=grain.getContext('2d');for(let i=0;i<2600;i++){g.fillStyle=`rgba(${hash(i,1)<.5?90:255},${hash(i,2)<.5?70:240},50,${hash(i,3)*.07})`;g.fillRect(hash(i,4)*200,hash(i,5)*200,1+hash(i,6)*1.5,1+hash(i,7)*1.5)}}
let grainPat=null;
function polyPath(pts){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]))}
function ink(pls,a=1,w=1.7,halo=true){if(!pls.length||a<=0)return;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
  for(const s of pls){if(!s.length)continue;ctx.moveTo(s[0][0],s[0][1]);for(let i=1;i<s.length;i++)ctx.lineTo(s[i][0],s[i][1])}
  if(halo){ctx.globalAlpha=a*.85;ctx.strokeStyle=PAPER;ctx.lineWidth=w+1.8*Math.min(1,w/1.7);ctx.stroke()}
  ctx.globalAlpha=a;ctx.strokeStyle=GRAPH;ctx.lineWidth=w;ctx.stroke();ctx.globalAlpha=1}
function fillPoly(pts,color,a){if(a<=0)return;ctx.globalAlpha=a;ctx.fillStyle=color;polyPath(pts);ctx.closePath();ctx.fill();ctx.globalAlpha=1}
function glow(x,y,r,col,a){if(a<=0)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
const lw=(fid,s=1)=>Math.max(.55,1.7*Math.sqrt(frameScale(fid)*s));
// static set pieces: wobble applied once, in their own coordinates
const SETW=(()=>{const W1=(pls,seed)=>pls.map((s,i)=>wobbleStroke(s,seed+i*7,.5));
  const gr=[];for(let x=836;x<=866;x+=6)gr.push(Lp(x,390,x,424,4));
  return{window:W1([RR(410,70,112,130,3),Lp(466,70,466,200,8),Lp(410,135,522,135,8),Lp(400,204,532,204,10)],11),
    desk:W1([Lp(420,437,870,437,16),Lp(870,446,420,446,20),Lp(438,419,852,419,10),Lp(420,437,438,419,2),Lp(870,437,852,419,2),Lp(428,446,428,554,6),Lp(862,446,862,554,6),Lp(446,430,446,530,6),Lp(846,430,846,530,6)],23),
    mic:W1([El(725,436,20,4,0,Math.PI*2,20),Lp(725,432,725,374,6),RR(711,330,28,44,13),Lp(715,342,735,342,4),Lp(714,350,736,350,4),Lp(715,358,735,358,4),RR(737,355,8,10,2)],37),
    radio:W1([RR(790,377,86,60,6),Ci(812,406,12,18),Lp(812,406,819,398,2),...gr,Lp(864,377,884,338,6),Ci(885,334,3,8),Qb([745,436],[770,446],[790,430])],41),
    lamp:W1([Lp(600,-40,600,124,10),Poly([[580,124],[620,124],[642,156],[558,156],[580,124]]),El(600,156,9,7,0,Math.PI,10)],53),
    record:LEO.strokes.slice(0,14).map(s=>s.map(p=>[609.4+p[0]*.765,272.5+p[1]*.7255]))}})();
function drawSetBack(t){
  ctx.fillStyle='#2e2821';ctx.fillRect(-900,-700,3100,2200);
  ctx.globalAlpha=.45;ctx.strokeStyle=PAPER;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(380,20);ctx.lineTo(-500,-400);ctx.moveTo(900,20);ctx.lineTo(1780,-400);ctx.stroke();ctx.globalAlpha=1;
  fillPoly([[380,390],[900,390],[1540,760],[-260,760]],'#ddd0b8',.92);
  ctx.globalAlpha=.35;ctx.strokeStyle=GRAPH;ctx.lineWidth=1;ctx.beginPath();for(let k=1;k<8;k++){ctx.moveTo(lerp(380,900,k/8),390);ctx.lineTo(lerp(-260,1540,k/8),760)}
  for(const s of[.2,.45,.7]){const y=lerp(390,760,s);ctx.moveTo(lerp(380,-260,s),y);ctx.lineTo(lerp(900,1540,s),y)}ctx.stroke();ctx.globalAlpha=1;
  ctx.save();ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=24;fillPoly([[380,20],[900,20],[900,390],[380,390]],PAPER,1);ctx.restore();
  ctx.save();polyPath([[380,20],[900,20],[900,390],[380,390]]);ctx.closePath();ctx.clip();ctx.fillStyle=grainPat;ctx.fillRect(380,20,520,370);ctx.restore();
  ink(SETW.record,.28,1.1,false);ink(SETW.window,1,1.6);
  ctx.save();ctx.beginPath();ctx.rect(410,70,112,130);ctx.clip();const cx=410+((t*4.2+20)%150)-20;
  ink([El(cx,100,9,8,Math.PI,Math.PI*2,8),El(cx+15,94,11,11,Math.PI,Math.PI*2,10),El(cx+30,100,8,7,Math.PI,Math.PI*2,8),Lp(cx+38,100,cx-8,100,6)],1,1.4,false);ctx.restore()}
function drawDesk(t){const m=p=>toWorld('desk',[p[0]-420,p[1]-300]);const M=pts=>pts.map(m);const MM=pls=>pls.map(M);
  fillPoly(M([[420,437],[870,437],[852,419],[438,419]]),'#c9ae86',.9);fillPoly(M([[420,437],[870,437],[870,446],[420,446]]),'#8d7252',1);ink(MM(SETW.desk),1,1.6);
  fillPoly(M(RR(711,330,28,44,13)),'#7f8589',.9);ink(MM(SETW.mic),1,1.6);
  fillPoly(M(RR(790,377,86,60,6)),'#9a7550',.9);fillPoly(M(Ci(812,406,12,18)),'#e6c58e',.9);ink(MM(SETW.radio),1,1.6);
  ctx.save();ctx.globalCompositeOperation='lighter';const g=m([812,406]);glow(g[0],g[1],30,'rgba(231,162,60,A)',.3+radioLevel(t||0)*.6);ctx.restore()}
function drawLamp(){fillPoly([[580,124],[620,124],[642,156],[558,156]],'#c47744',.9);ink(SETW.lamp,1,1.6)}
function drawLight(){const g=ctx.createRadialGradient(600,170,40,600,260,820);g.addColorStop(0,'rgba(16,12,9,0)');g.addColorStop(1,'rgba(16,12,9,.55)');ctx.fillStyle=g;ctx.fillRect(-900,-700,3100,2200);
  ctx.save();ctx.globalCompositeOperation='lighter';glow(600,160,70,'rgba(255,214,140,A)',.7);glow(600,260,420,'rgba(255,170,80,A)',.1);ctx.restore()}
// how much of each stroke of an entity is revealed at time t, from its creating event's plan
function fracsFor(ev,t){if(!ev||!ev.dur)return null;const u=(t-ev.t)/ev.dur;if(u>=1)return null;const p=planOf(ev);return p?evalPlan(p,u).fracs:null}
function drawObject(o,t){if(o.held||o.equippedBy)return;if(o.tpl.kind==='ink'){drawInk(o,t);return}if(o.instrument==='quill'&&o.activated!=null&&t>=o.activated)return;const w=lw(o.frame,o.scale);const done=o.prog>=1;
  for(const [pts,col] of (o.tpl.fills||[]))fillPoly(pts.map(p=>objWorld(o,p,t)),col,.88*(done?1:0));
  if(o.tpl.light&&o.behaviors.some(b=>b.b==='glow'&&t>=b.t0)){const k=sstep((t-o.behaviors.find(b=>b.b==='glow').t0)/.4);const L=objWorld(o,o.tpl.light,t);const r=90*frameScale(o.frame)*Math.max(.6,o.scale);ctx.save();ctx.globalCompositeOperation='lighter';glow(L[0],L[1],r*1.2,'rgba(255,200,110,A)',.55*k);glow(L[0],L[1],r*.35,'rgba(255,236,190,A)',.8*k);ctx.restore()}
  ink(revealFracs(drawnOf(o.tpl),fracsFor(o.ev,t)).map(pl=>pl.map(p=>objWorld(o,p,t))),1,w)}
function drawCharBody(c,t){const s=frameScale(c.frame)*c.scale;const w=lw(c.frame,c.scale);const done=c.prog>=1;
  for(const [pts,col] of c.tpl.fills)fillPoly(pts.map(p=>charWorld(c,p)),col,done?.9:0);
  ink(revealFracs(drawnOf(c.tpl),fracsFor(c.ev,t)).map(pl=>pl.map(p=>charWorld(c,p))),1,w);
  if(!done)return;
  for(const oid of c.equipped){const o=S_NOW.objects[oid];if(!o)continue;const d=OUTFITS[o.design];if(!d)continue;
    for(const [pts,col] of d.worn.fills)fillPoly(pts.map(p=>charWorld(c,p)),col,.93);ink(d.worn.strokes.map(pl=>pl.map(p=>charWorld(c,p))),1,w*.9)}
  const awake=c.awake!=null&&t>=c.awake;
  let look=null;const L=S_NOW.looks[c.id];if(L&&t<L.until)look=L.w;
  if(!look&&awake){const ps=pencilState(c,t);const ov=lookOverride(c,t,ps);if(ov)look=ov;else if(ps.look)look=ps.look}
  if(!look&&awake&&t-c.awake<2.2){const d=t-c.awake;const k=[[-1,-.2],[1,-.3],[0,.6],[0,0]];const i=Math.min(3,Math.floor(d/.55)),f=sstep((d-i*.55)/.25);const a=k[Math.max(0,i-1)],b=k[i];const e=charWorld(c,c.tpl.head);look=[e[0]+lerp(a[0],b[0],f)*200,e[1]+lerp(a[1],b[1],f)*200]}
  for(const ep of c.tpl.eyes){const e=charWorld(c,ep);const bp=(t+c.id.length*.7)%4.3;const blink=awake&&bp<.16;const open=awake?sstep((t-c.awake)/.35):0;const lid=blink?Math.sin(Math.PI*bp/.16):1-open;
    if(lid>.6){ctx.strokeStyle=GRAPH;ctx.lineWidth=Math.max(.7,1.6*Math.sqrt(s));ctx.beginPath();ctx.moveTo(e[0]-6*s,e[1]);ctx.lineTo(e[0]+6*s,e[1]);ctx.stroke();continue}
    let dx=0,dy=0;if(look){const vx=look[0]-e[0],vy=look[1]-e[1],d=Math.hypot(vx,vy)||1;dx=vx/d;dy=vy/d}
    ctx.fillStyle='rgba(40,36,32,.95)';ctx.beginPath();ctx.ellipse(e[0]+dx*2.8*s,e[1]+dy*2.8*s,Math.max(.8,2.7*s),Math.max(.3,2.7*s*(1-lid)),0,0,Math.PI*2);ctx.fill()}
  if(SCENE==='episode')drawEpisodeMouth(c,t)}
function drawCharArm(c,t){if(c.prog<1)return;const s=frameScale(c.frame)*c.scale;const has=hasPencilNow(S_NOW,c,t);
  const ps=pencilState(c,t);const tipF=ps.p;const tip=[(tipF[0]-c.at[0])/c.scale,(tipF[1]-c.at[1])/c.scale];
  const hp=has?[tip[0]+.459*40,tip[1]-.888*40]:tip;const S=c.tpl.shoulder;const d=Math.hypot(hp[0]-S[0],hp[1]-S[1]);let pts;
  if(d<88){const base=Math.atan2(hp[1]-S[1],hp[0]-S[0]),k=Math.acos(clamp(d/88,-1,1));const e1=[S[0]+Math.cos(base+k)*44,S[1]+Math.sin(base+k)*44],e2=[S[0]+Math.cos(base-k)*44,S[1]+Math.sin(base-k)*44];pts=[S,e1[1]>e2[1]?e1:e2,hp]}else pts=[S,hp];
  const w=Math.max(.6,2*Math.sqrt(s));ink([Poly(pts,4).map(p=>charWorld(c,p))],1,w);
  if(d>=88){ctx.strokeStyle=GRAPH;ctx.lineWidth=w*.6;for(let k=1;k<4;k++){const m=lp(S,hp,k/4),n=[-(hp[1]-S[1])/d*4,(hp[0]-S[0])/d*4];const a=charWorld(c,[m[0]-n[0],m[1]-n[1]]),b=charWorld(c,[m[0]+n[0],m[1]+n[1]]);ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke()}}
  const Hh=charWorld(c,hp);ctx.fillStyle='#b3babd';ctx.beginPath();ctx.arc(Hh[0],Hh[1],Math.max(1,4.5*Math.sqrt(s)),0,Math.PI*2);ctx.fill();ctx.strokeStyle=GRAPH;ctx.lineWidth=w*.7;ctx.stroke();
  if(has){const T=charWorld(c,tip),M=lp(T,Hh,.16);ctx.lineCap='round';ctx.strokeStyle='#2c2824';ctx.lineWidth=Math.max(1,6.4*Math.sqrt(s));ctx.beginPath();ctx.moveTo(...Hh);ctx.lineTo(...M);ctx.stroke();
    ctx.strokeStyle='#c47744';ctx.lineWidth=Math.max(.7,4.2*Math.sqrt(s));ctx.stroke();ctx.strokeStyle='#2c2824';ctx.lineWidth=Math.max(.5,1.8*Math.sqrt(s));ctx.beginPath();ctx.moveTo(...T);ctx.lineTo(...M);ctx.stroke()}
  if(DEBUG){const T=charWorld(c,tip);ctx.save();ctx.fillStyle=ps.contact?'#4fd1c5':'#e7a23c';ctx.beginPath();ctx.arc(T[0],T[1],3/Math.max(.5,camZ),0,Math.PI*2);ctx.fill();
    if(ps.drawing){const p=ps.plan,e=ps.drawing,sh=frameShift(e);const st=ps.ev.si>=0?p.strokes[ps.ev.si]:null;if(st){ctx.setLineDash([4/camZ,3/camZ]);ctx.strokeStyle='#4fd1c5';ctx.lineWidth=1.2/camZ;polyPath(st.map(q=>toWorld(e.frame,[q[0]+sh[0],q[1]+sh[1]])));ctx.stroke();ctx.setLineDash([])}
      for(const s0 of p.strokes){const a=toWorld(e.frame,[s0[0][0]+sh[0],s0[0][1]+sh[1]]),b=toWorld(e.frame,[s0[s0.length-1][0]+sh[0],s0[s0.length-1][1]+sh[1]]);ctx.fillStyle='#4fd1c5';ctx.fillRect(a[0]-1.5/camZ,a[1]-1.5/camZ,3/camZ,3/camZ);ctx.fillStyle='#d9806a';ctx.fillRect(b[0]-1.5/camZ,b[1]-1.5/camZ,3/camZ,3/camZ)}}
    ctx.restore()}}
function drawFrame(fid,t){const f=FR[fid];const st=S_NOW.frames[fid];if(!st)return;
  if(f.surface){if(fid==='desk')drawDesk(t);drawContents(fid,t);return}
  const q=[[0,0],[f.lw,0],[f.lw,f.lh],[0,f.lh]].map(p=>toWorld(fid,p));const paperA=smooth(.55,1,st.prog);
  ctx.save();polyPath(q);ctx.closePath();ctx.clip();
  if(paperA>0){fillPoly(q,f.paper||PAPER,paperA);ctx.globalAlpha=paperA*.7;ctx.fillStyle=grainPat;ctx.fillRect(q[0][0],q[0][1],q[2][0]-q[0][0],q[2][1]-q[0][1]);ctx.globalAlpha=1}
  drawContents(fid,t);ctx.restore()}
function drawBorder(cf,t){const e=cf.ev;const p=planOf(e);if(!p)return;const sh=frameShift(e);const fr=fracsFor(e,t);
  ink(revealFracs(p.strokes,fr).map(pl=>pl.map(q=>toWorld(cf.parent,[q[0]+sh[0],q[1]+sh[1]]))),1,Math.max(.7,2*Math.sqrt(frameScale(cf.parent))))}
function drawContents(fid,t){const kids=Object.values(FR).filter(cf=>cf.parent===fid&&S_NOW.frames[cf.id]&&!cf.hidden);
  for(const cf of kids)if(cf.z!=='front'){drawFrame(cf.id,t);if(!cf.surface)drawBorder(cf,t)}
  for(const o of Object.values(S_NOW.objects))if(o.frame===fid)drawObject(o,t);
  const chars=Object.values(S_NOW.chars).filter(c=>c.frame===fid);for(const c of chars)drawCharBody(c,t);
  for(const cf of kids)if(cf.z==='front'){drawFrame(cf.id,t);if(!cf.surface)drawBorder(cf,t)}
  if(fid==='studio')drawLamp();
  for(const c of chars)drawCharArm(c,t);if(fid==='studio')drawInstruments(t)}
function drawRings(t){ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#e7a23c';
  for(const r of S_NOW.rings){const s=frameScale(r.frame);for(let k=0;k<4;k++){const ph=((t-r.t0)*1.1+k/4);if(ph<0||ph>1.6)continue;const rad=(14+ph*240)*Math.max(.3,s*2.2);
    ctx.globalAlpha=Math.max(0,(1-ph/1.6))*.85*sstep((t-r.t0)/.15);ctx.lineWidth=1.5;for(const a0 of[-.9,Math.PI-.9]){ctx.beginPath();ctx.arc(r.w[0],r.w[1],rad,a0,a0+1.8);ctx.stroke()}}}
  ctx.restore();ctx.globalAlpha=1}
function drawDenials(t){for(const d of S_NOW.denials){const e=d.e;const k=clamp((t-e.t)/1.4);if(k>=1)continue;let p=e.args&&e.args.point?toWorld(e.frame,e.args.point):null;
    const o=S_NOW.objects[e.target];if(!p&&o)p=objWorld(o,[0,0],t);const c=S_NOW.chars[e.actor];if(!p&&c)p=charWorld(c,[0,-200]);if(!p)continue;
    const r=Math.max(6,22*Math.sqrt(frameScale(e.frame)));ctx.globalAlpha=Math.sin(k*Math.PI);ctx.strokeStyle='#d9806a';ctx.lineWidth=Math.max(1.4,r*.18);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(p[0]-r*.5,p[1]-r*.5);ctx.lineTo(p[0]+r*.5,p[1]+r*.5);ctx.moveTo(p[0]+r*.5,p[1]-r*.5);ctx.lineTo(p[0]-r*.5,p[1]+r*.5);ctx.stroke();ctx.globalAlpha=1}}

/* ================= camera ================= */
const CAM=[[0,.86,640,370],[2.2,.86,640,370],[6,1.25,740,250],[12.5,1.25,740,250],[15,2.1,795,190],[22,2.1,795,190],[23.2,1.15,700,260],[27.5,1.15,700,260],[31,.95,640,330]];
let WIDE=false,camZ=1;
function fitFor(e){if(!e)return[.95,640,330];let fid=e.op==='FRAME'?e.args.id:e.frame;if(e.op==='ALTER'&&e.args.move)fid='studio';const f=FR[fid];if(!f||!f.parent||f.surface)return[1.05,620,330];
  const a=toWorld(fid,[0,0]),b=toWorld(fid,[f.lw,f.lh]);const w=b[0]-a[0],h=b[1]-a[1];const z=Math.min(2.7,Math.min(W/(w*2.6),H/(h*1.9)));return[z,(a[0]+b[0])/2+w*.35,(a[1]+b[1])/2]}
function camAt(t){if(WIDE)return[.86,640,370];if(SCENE==='diag')return[1.35,650,200];if(SCENE==='letter')return letterCam(t);if(SCENE==='episode')return episodeCam(t);
  if(t<=31){for(let i=1;i<CAM.length;i++)if(t<=CAM[i][0]){const a=CAM[i-1],b=CAM[i],k=ease(clamp((t-a[0])/(b[0]-a[0])));return[lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)]}}
  const evs=LOG.filter(e=>e.t>31&&e.t<=t+.6&&e.op!=='PROPAGATE');const cur=evs[evs.length-1];let prevE=null;for(let i=evs.length-2;i>=0;i--){const a=fitFor(evs[i]),b=fitFor(cur);if(a.join()!==b.join()){prevE=evs[i];break}}
  const A=prevE?fitFor(prevE):[.95,640,330],B=fitFor(cur);if(!cur)return A;const firstB=prevE?evs.find(e=>fitFor(e).join()===B.join()&&e.t>prevE.t):null;const start=firstB?firstB.t:cur.t;
  const k=ease(clamp((t-start+.6)/1.4));return[lerp(A[0],B[0],k),lerp(A[1],B[1],k),lerp(A[2],B[2],k)]}

/* ================= render ================= */
let S_NOW=null,DEBUG=false;
function render(t){RENDER_COUNT++;FR=frameDefs(t);S_NOW=stateAt(t);
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);
  const [z,cx,cy]=camAt(t);camZ=z;ctx.setTransform(SC*z,0,0,SC*z,SC*(W/2-cx*z),SC*(H/2-cy*z));
  if(!grainPat)grainPat=ctx.createPattern(grain,'repeat');
  drawSetBack(t);drawContents('studio',t);drawLight();drawRings(t);drawDenials(t);
  ctx.setTransform(SC,0,0,SC,0,0);const blk=1-smooth(0,.8,t);if(blk>0){ctx.fillStyle=`rgba(0,0,0,${blk})`;ctx.fillRect(0,0,W,H)}
  if(SCENE==='letter')drawEndCard(t);
  if(DEBUG)drawDebug(t)}
