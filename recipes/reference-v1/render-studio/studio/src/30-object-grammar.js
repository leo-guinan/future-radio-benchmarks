/* ================= Object Grammar v0.1: tools, instruments, correspondence ================= */
// Script glyphs: Hershey "Script 1-stroke" (public domain), single-stroke paths in correct stroke order.
const GLYPHS=__GLYPHS__;
const INSTRUMENTS={
  pencil:{name:'Pencil',agency:'tool',domain:'local world state: surfaces, objects, actors, frames',interface:'direct manipulation',caps:['INSCRIBE','ALTER','FRAME','ANIMATE','COMPOSE'],
    boundary:'changes begin locally and cross frames only through permitted operations',persistence:'the construction survives when the pencil stops',cost:'graphite'},
  quill:{name:'Quill',agency:'instrument',domain:'language and correspondence',interface:'command and review',caps:['LISTEN','DRAFT','INSCRIBE','REVISE','PRESENT','PREPARE','ANIMATE'],withheld:['DISPATCH'],
    boundary:'can prepare a letter meant to leave the scene; cannot open a real-world channel or send without separate authorization',persistence:'the letter stays a readable, editable, attributable artifact',cost:'ink'},
  radio:{name:'Radio',agency:'instrument',domain:'signals across frames and times',interface:'tuning and routing',caps:['TUNE','RECEIVE','BROADCAST','ROUTE','RECORD','REPLAY'],
    boundary:'signals cross frames by the timespace rules; an observation is never a delivery or a reply',persistence:'a signal can remain as a recording',cost:'power'}};
const CORR_STATES=['DRAFTED','APPROVED','DISPATCHED','DELIVERED','REPLIED'];
const CMD_FIELDS=['instrument','recipient','intent','context','constraints','output_frame','approval_required','artifact'];
const NO_SEND='external delivery needs separate, explicit human authorization, and nothing in the scene can grant it';
const PAPER_L={x:690,y:34,w:200,h:280,lw:400,lh:560};
const PAGE={x0:30,y0:60,width:340,size:.74,lineH:30,paraGap:9,maxY:440};
const ENV_L={x:8,y:74,w:84,h:60,lw:280,lh:200};
const RADIO_AT=[392,106];
const WRITE_V=420,WRITE_ZOOM=3.6;
const QHOVER=[846,118];

function catmull(pts,n=3){if(pts.length<3)return pts.map(p=>[p[0],p[1]]);const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
    for(let k=0;k<n;k++){const t=k/n,t2=t*t,t3=t2*t;const f=j=>.5*(2*p1[j]+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3);out.push([f(0),f(1)])}}
  out.push([pts[pts.length-1][0],pts[pts.length-1][1]]);return out}
function glyphOf(ch){if(ch==='—'||ch==='–')return{w:24,s:[[[1,16],[12,15.6],[23,16]]]};if(ch==='’'||ch==='‘')ch="'";if(ch==='“'||ch==='”')ch='"';return GLYPHS[ch]||null}
function advOf(g,ch){if(ch===' ')return 11;if(!g||!g.s.length)return g?g.w:11;let m=-1e9;for(const s of g.s)for(const p of s)m=Math.max(m,p[0]);return m+(/[a-z]/.test(ch)?0:2.5)}
// Layout is computed before the quill starts, so it never runs off the page.
function layoutText(text,o){const size=o.size,maxW=o.width,missing=new Set();const lines=[];let y=o.y0;
  const gl=ch=>{if(ch===' ')return null;const g=glyphOf(ch);if(!g){missing.add(ch);return glyphOf('?')}return g};
  const wordW=w=>[...w].reduce((a,ch)=>a+advOf(gl(ch),ch),0)*size;
  for(const para of String(text).replace(/\r/g,'').split('\n')){if(!para.trim()){if(lines.length)y+=o.paraGap;continue}
    const words=para.trim().split(/\s+/);let cur=[];const flush=()=>{if(!cur.length)return;lines.push({text:cur.join(' '),y});y+=o.lineH;cur=[]};
    for(const w of words){if(cur.length&&wordW([...cur,w].join(' '))>maxW)flush();cur.push(w)}flush()}
  for(const L of lines){const wTot=wordW(L.text);const align=o.align||(/^[—–]/.test(L.text)?'right':'left');
    let x=align==='right'?o.x0+maxW-wTot:align==='center'?o.x0+(maxW-wTot)/2:o.x0;L.x0=x;const strokes=[],pre=[],raw=[];let newWord=false;
    for(const ch of L.text){if(ch===' '){newWord=true;x+=advOf(null,' ')*size;continue}const g=gl(ch);
      g.s.forEach((s,k)=>{const pts=s.map(p=>[x+p[0]*size,L.y+(p[1]-22)*size]);const pause=k===0&&newWord?.12:(k===0&&/[,.;:!?]/.test(ch)?.05:0);
        // joined cursive: a stroke that starts where the last one ended continues it, so the nib doesn't lift inside a word
        const prev=raw[raw.length-1];if(prev&&!pause&&dist(prev[prev.length-1],pts[0])<1.6*size)raw[raw.length-1]=prev.concat(pts.slice(1));else{raw.push(pts);pre.push(pause)}});newWord=false;x+=advOf(g,ch)*size}
    for(const pts of raw)strokes.push(pts.length>1?catmull(pts,3):[pts[0],[pts[0][0]+.5,pts[0][1]+.5]]);
    L.strokes=strokes;L.pre=pre;L.width=wTot;L.endX=x}
  const bottom=lines.length?lines[lines.length-1].y+12*size:0;
  return{lines,missing:[...missing],overflow:o.maxY!=null&&bottom>o.maxY,bottom}}
const layoutLetter=text=>layoutText(text,PAGE);
function flourishAt(x,y,s){return catmull([[x,y],[x+6*s,y-3*s],[x+12*s,y-7*s],[x+15*s,y-3*s],[x+12*s,y+1*s],[x+17*s,y+2*s],[x+28*s,y-1*s]],4)}
function underSwash(x0,x1,y){const w=x1-x0;return catmull([[x0,y+2],[x0+w*.18,y+6],[x0+w*.42,y+3],[x0+w*.62,y-1],[x0+w*.8,y+1],[x0+w*.9,y+6],[x0+w*.84,y+9],[x0+w*.92,y+4],[x1,y-2]],4)}

/* ink: timing proportional to the length of each stroke, short pauses between words, no wobble */
function inkPlan(strokes,tpl){const pre=tpl.pre||[],V=tpl.v||WRITE_V;const segs=[];let tot=0;const lens=strokes.map(s=>{let L=0;for(let i=1;i<s.length;i++)L+=dist(s[i-1],s[i]);return L});
  strokes.forEach((s,si)=>{if(si>0){const from=strokes[si-1][strokes[si-1].length-1],to=s[0];const d=dist(from,to);const w=.022+d/900+(pre[si]||0);segs.push({type:'travel',from,to,d,w});tot+=w}
    const w=lens[si]/V+.014;segs.push({type:'draw',si,len:lens[si],w});tot+=w});
  let acc=0;for(const s of segs){s.u0=acc/(tot||1);acc+=s.w;s.u1=acc/(tot||1)}
  const done=new Array(strokes.length).fill(1);for(const s of segs)if(s.type==='draw')done[s.si]=s.u1;
  return{strokes,segs,lens,pressure:.5,corners:strokes.map(()=>[]),lift:4,ink:true,tot,done}}
const inkDur=tpl=>inkPlan(tpl.strokes,tpl).tot;
function inkTpl(strokes,key,extra={}){return Object.assign({kind:'ink',key,strokes,w0:.55,w1:2.1,behaviors:[]},extra)}

/* a pointed nib: downstrokes swell, upstrokes stay hairline, the ends taper */
const RIB=new WeakMap();
function ribbonPts(pl,w0,w1){const n=pl.length;if(n<2)return null;const c=[0];for(let i=1;i<n;i++)c.push(c[i-1]+dist(pl[i-1],pl[i]));const L=c[n-1]||1e-6;const A=[],B=[];
  for(let i=0;i<n;i++){const a=pl[Math.max(0,i-1)],b=pl[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
    const down=clamp(ty*.85+tx*.15);const taper=L<5?1:Math.min(1,c[i]/2.2,(L-c[i])/2.2);const w=Math.max(.5,(w0+w1*Math.pow(down,1.3))*(.35+.65*Math.max(0,taper)));
    A.push([pl[i][0]-ty*w/2,pl[i][1]+tx*w/2]);B.push([pl[i][0]+ty*w/2,pl[i][1]-tx*w/2])}
  return A.concat(B.reverse())}
function ptsPath(pts){const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p}
function ribbonPath(pl,w0,w1){let p=RIB.get(pl);if(p)return p;const pts=ribbonPts(pl,w0,w1);p=pts?ptsPath(pts):new Path2D();RIB.set(pl,p);return p}
const INK_DRY='#2a2320',INK_WET='#1d2b5e';
// the frame's affine map, including a non-uniform squash while a sheet is being folded
function frameAffine(fid){const o=toWorld(fid,[0,0]),ex=toWorld(fid,[1,0]),ey=toWorld(fid,[0,1]);return[ex[0]-o[0],ey[1]-o[1],o[0],o[1]]}
function drawInkStrokes(g,o,e,t,wetOK){const p=planOf(e);const fr=fracsFor(e,t);const W0=o.tpl.w0||.55,W1=o.tpl.w1||2.1;const late=!e.dur||t>e.t+e.dur+2.4;
  o.tpl.strokes.forEach((st,si)=>{const f=fr?fr[si]:1;if(f<=0)return;let path,partial=false;
    if(f>=1)path=ribbonPath(st,W0,W1);else{const pl=revealFracs([st],[f])[0];const pts=ribbonPts(pl,W0,W1);if(!pts)return;path=ptsPath(pts);partial=true}
    g.globalAlpha=.93;g.fillStyle=INK_DRY;g.fill(path);
    if(wetOK&&!late&&p){const tc=e.t+p.done[si]*e.dur;const wet=partial?1:1-smooth(0,2.2,t-tc);if(wet>0){g.globalAlpha=.6*wet;g.fillStyle=INK_WET;g.fill(path)}}
    g.globalAlpha=1})}
function drawInk(o,t){const e=o.ev;const [sx,sy,ox,oy]=frameAffine(o.frame);ctx.save();ctx.transform(sx,0,0,sy,ox,oy);ctx.translate(o.at[0],o.at[1]);ctx.scale(o.scale,o.scale);
  drawInkStrokes(ctx,o,e,t,true);
  const fl=o.behaviors.find(b=>b.b==='flicker'&&t>=b.t0&&t<b.t0+1.2);if(fl&&o.tpl.light)drawFlicker(ctx,o.tpl.light,clamp((t-fl.t0)/1.2));
  ctx.restore()}
function drawFlicker(g,L,u){const k=Math.pow(Math.sin(Math.PI*u),2)*(.75+.25*Math.sin(u*40));g.save();g.globalCompositeOperation='lighter';
  const gr=g.createRadialGradient(L[0],L[1],0,L[0],L[1],26);gr.addColorStop(0,`rgba(255,196,96,${.9*k})`);gr.addColorStop(1,'rgba(255,196,96,0)');g.fillStyle=gr;g.fillRect(L[0]-26,L[1]-26,52,52);
  g.strokeStyle=`rgba(231,162,60,${.85*k})`;g.lineWidth=1.1;for(const r of[7,12])for(const a of[0,Math.PI]){g.beginPath();g.arc(L[0],L[1],r+k*3,a-.5,a+.5);g.stroke()}g.restore()}

/* the quill: what the pencil draws, and how it moves once awake */
const QS=.72;
const QAX=(()=>{const S=pl=>pl.map(p=>[p[0]*QS,p[1]*QS]);const st=[Poly([[-3.2,-15],[0,0],[3.2,-15],[-3.2,-15]],4),Lp(0,-3,0,-11,3),Qb([0,-15],[3,-80],[9,-150],18),Qb([1,-38],[-17,-92],[8,-148],16),Qb([2,-42],[15,-102],[9,-150],16),
    ...[50,64,78,92,106,120].map((d,i)=>Lp(1.2+d*.04,-d,-9+i*.9,-d-10,2)),...[56,72,88,104].map(d=>Lp(1.4+d*.045,-d,11,-d-8,2))].map(S);
  const fill=S([...Qb([1,-38],[-17,-92],[8,-148],16),...Qb([9,-150],[15,-102],[2,-42],16)]);return{strokes:st,fills:[[fill,'#f1ebdc'],[S([[-3.2,-15],[0,0],[3.2,-15]]),'#9aa0a3']]}})();
const QA0=.95;const rot=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a)];
TPL.quill={kind:'instrument',instrument:'quill',key:'quill',strokes:QAX.strokes.map(s=>s.map(p=>rot(p,QA0))),fills:QAX.fills.map(([pts,c])=>[pts.map(p=>rot(p,QA0)),c]),pressure:.5,behaviors:['awaken']};
TPL.inkwell={key:'inkwell',strokes:[Poly([[-12,0],[-15,-13],[-7,-19],[7,-19],[15,-13],[12,0],[-12,0]],4),RR(-6,-25,12,6,1.5),Qb([-9,-12],[0,-9],[9,-12],6)],fills:[[[[-12,0],[-15,-13],[-7,-19],[7,-19],[15,-13],[12,0]],'#3b4254'],[RR(-6,-25,12,6,1.5),'#8d7252']],behaviors:[]};
TPL.radio={kind:'instrument',instrument:'radio',key:'radio',strokes:[],behaviors:[],bbox:[0,0,0,0]};
const STATION=inkTpl([RR(-28,-15,56,30,5),Ci(-12,0,7,16),Lp(-12,0,-8,-4,2),...[6,10.5,15,19.5].map(x=>Lp(x,-9,x,9,3)),Lp(18,-15,30,-42,6),Ci(31,-44.5,2.6,10)].map(s=>catmull(s,2)),'station',{w0:.45,w1:1.3,light:[31,-44.5],behaviors:['flicker']});
let _qaxis=null;const QUILL_AXIS=()=>_qaxis||(_qaxis=drawnOf(TPL.quill).map(s=>s.map(p=>rot(p,-QA0))));
function qWorld(e,p){const sh=frameShift(e);return toWorld(e.frame,[p[0]+sh[0],p[1]+sh[1]])}
function quillHover(o,t){const h=o.hover||QHOVER;return{tip:[h[0]+Math.sin(t*1.1)*1.4,h[1]+Math.sin(t*1.3+1)*2.1],ang:.45+Math.sin(t*.8)*.035}}
const QTASKS=new Map(),QCACHE=new Map();
function quillTasks(id){const key=VER+'|'+id;let t=QTASKS.get(key);if(t)return t;
  t=LOG.filter(e=>e.actor===id&&e.result!=='denied'&&e.dur>0&&((planOf(e)&&planOf(e).strokes.length)||(e.args&&e.args.point))).map(e=>({e,t0:e.t,t1:e.t+e.dur,draw:!!(planOf(e)&&planOf(e).strokes.length)}));
  if(QTASKS.size>50)QTASKS.clear();QTASKS.set(key,t);return t}
function quillPose(o,t){const key=VER+'|'+o.id+'|'+t;const hit=QCACHE.get(key);if(hit)return hit;FR=frameDefs(t);const r=quillPoseRaw(o,t);if(QCACHE.size>4000)QCACHE.clear();QCACHE.set(key,r);return r}
function quillPoseRaw(o,t){const drawn={tip:toWorld(o.frame,o.at),ang:QA0,shadow:0,phase:'drawn'};
  if(o.activated==null||t<o.activated)return drawn;const aw=o.awakenEv;const H0=quillHover(o,t);
  if(aw&&t<aw.t+aw.dur){const ks=sstep((t-aw.t)/(aw.dur*.55)),k=sstep((t-aw.t-.4)/(aw.dur-.4));const tip=lp(drawn.tip,H0.tip,k);tip[1]-=Math.sin(Math.PI*k)*22;
    return{tip,ang:lerp(QA0,H0.ang,k),shadow:ks,phase:'awaken'}}
  const tasks=quillTasks(o.id);let i=0;while(i<tasks.length&&tasks[i].t1<t)i++;const cur=tasks[i];const up=7;
  const at=(task,last)=>{const e=task.e;if(task.draw){const p=planOf(e);const s=last?p.strokes[p.strokes.length-1]:p.strokes[0];return qWorld(e,last?s[s.length-1]:s[0])}return qWorld(e,e.args.point)};
  if(cur&&t>=cur.t0){const e=cur.e,u=(t-cur.t0)/(cur.t1-cur.t0);
    if(cur.draw){const p=planOf(e);const r=evalPlan(p,u);const w=qWorld(e,r.tip);const sy=frameAffine(e.frame)[1];w[1]-=r.lift*sy*1.4;
      const r2=evalPlan(p,clamp(u+.003));const w2=qWorld(e,r2.tip);const lean=clamp((w2[0]-w[0])*.9,-.12,.12);
      return{tip:w,ang:.55+lean,shadow:1,drawing:e,plan:p,ev:r,contact:r.contact&&r.si>=0,phase:r.si>=0?'write':'travel'}}
    const q=qWorld(e,e.args.point);const k=Math.pow(Math.sin(Math.PI*clamp(u)),2);
    return{tip:[q[0],q[1]+(e.args.dip||0)*k],ang:.45+(e.args.tilt||0)*k,shadow:1,gesture:e,phase:e.args.behavior||'gesture'}}
  const prev=tasks[i-1],next=cur;const E=prev?prev.t1:-Infinity,S=next?next.t0:Infinity,g=S-E;
  const endP=prev?at(prev,1):H0.tip,startP=next?at(next,0):H0.tip;const ang0=prev&&prev.draw?.55:.45,ang1=next&&next.draw?.55:.45;
  if(!isFinite(g)||g>1.6){const ret=.6;
    if(prev&&t<E+ret){const k=sstep((t-E)/ret);const b=lp(endP,H0.tip,k);b[1]-=Math.sin(Math.PI*k)*up;return{tip:b,ang:lerp(ang0,H0.ang,k),shadow:1,phase:'return'}}
    if(next&&t>S-ret){const k=sstep((t-(S-ret))/ret);const b=lp(H0.tip,startP,k);b[1]-=Math.sin(Math.PI*k)*up;return{tip:b,ang:lerp(H0.ang,ang1,k),shadow:1,phase:'approach'}}
    return{tip:H0.tip,ang:H0.ang,shadow:1,phase:'hover'}}
  const k=(t-E)/Math.max(1e-6,g);const b=lp(endP,startP,sstep(k));b[1]-=Math.pow(Math.sin(Math.PI*k),2)*(up+dist(endP,startP)*.08);return{tip:b,ang:lerp(ang0,ang1,sstep(k)),shadow:1,phase:'travel'}}
function drawQuill(o,t){const P=quillPose(o,t);if(P.phase==='drawn')return;const axis=QUILL_AXIS();const sway=Math.sin(t*2.3)*.012+(P.phase==='write'?Math.sin(t*7)*.006:0);
  const M=p=>{const q=rot(p,P.ang+(p[1]<-40?sway*(-p[1]-40)/60:0));return[P.tip[0]+q[0],P.tip[1]+q[1]]};
  // the shadow moves first when it wakes, then stays on the wall behind the floating quill
  ctx.save();ctx.filter='blur(3px)';ctx.globalAlpha=.18*P.shadow;ctx.fillStyle='#1a140f';const sh=[8+P.shadow*10,10+P.shadow*12];
  polyPath(QAX.fills[0][0].map(p=>{const q=M(p);return[q[0]+sh[0],q[1]+sh[1]]}));ctx.closePath();ctx.fill();ctx.restore();
  for(const [pts,col] of QAX.fills)fillPoly(pts.map(M),col,.96);ink(axis.map(s=>s.map(M)),1,1.25);
  if(DEBUG){ctx.fillStyle=P.contact?'#4fd1c5':'#e7a23c';ctx.beginPath();ctx.arc(P.tip[0],P.tip[1],2.2/Math.max(.5,camZ),0,Math.PI*2);ctx.fill()}}
function drawInstruments(t){for(const o of Object.values(S_NOW.objects))if(o.instrument==='quill'&&o.activated!=null&&t>=o.activated)drawQuill(o,t)}
function lifecycleOf(S,o,t){if(!o)return'—';if(o.prog<1)return'being constructed';if(o.activated==null||t<o.activated)return'constructed';
  if(LOG.some(e=>e.actor===o.id&&e.result!=='denied'&&t>=e.t&&t<e.t+e.dur&&e.args&&e.args.write))return'executing';
  const arts=Object.values(S.artifacts).filter(a=>a.instrument===o.id);if(!arts.length)return'activated';const a=arts[arts.length-1];const v=a.versions[a.version];
  return v.written?'completed':(v.lines.length?'executing':'commanded')}

/* checks and state for the new operations */
function checkGrammar(S,e){
  if(e.op==='DISPATCH')return NO_SEND;
  if(e.op==='RECEIVE'){const r=S.objects[e.actor];if(!r||r.instrument!=='radio')return'only a radio can receive';if(r.activated==null)return'the radio is off';
    if(e.args&&e.args.reply){const a=S.artifacts[e.args.in_reply_to];if(!a||!['DISPATCHED','DELIVERED','REPLIED'].includes(a.correspondence))return'nothing was sent, so no signal can be a reply'}return null}
  const io=S.objects[e.actor];if(!io||S.chars[e.actor])return undefined;
  if(io.prog<1)return'still being drawn';
  if(io.kind==='instrument'){const I=INSTRUMENTS[io.instrument];if(io.activated==null||e.t<io.activated)return'the '+io.instrument+' is not awake';
    if(!I.caps.includes(e.op))return'missing capability '+e.op;if(!isAncestor(io.frame,e.frame))return'out of reach';
    const w=e.args&&e.args.write;if(e.op==='INSCRIBE'){if(!w)return'the quill writes only under a command';const a=S.artifacts[w.artifact];if(!a||a.instrument!==io.id)return'no command for '+w.artifact;if(w.version!==a.version)return'version '+w.version+' was not commanded'}
    return null}
  if(e.op==='ANIMATE'&&e.target===io.id&&(io.tpl.behaviors||[]).includes(e.args.behavior))return null;
  return'a drawing can only animate itself'}
function checkCommand(S,e){
  if(e.op==='COMMAND'||e.op==='REVISE'){const q=S.objects[e.target];if(!q||q.kind!=='instrument')return'not an instrument';if(q.activated==null||e.t<q.activated)return'the instrument is not awake';
    if(e.op==='COMMAND'){const miss=CMD_FIELDS.filter(k=>e.args[k]==null||e.args[k]==='');if(miss.length)return'incomplete command (missing '+miss.join(', ')+')';if(S.artifacts[e.args.artifact])return'that letter already exists'}
    else{const a=S.artifacts[e.args.artifact];if(!a)return'no such letter';if(a.instrument!==q.id)return'commanded through another instrument';if(e.args.version!==a.version+1)return'revisions must be numbered in order';if(!String(e.args.text||'').trim())return'empty revision'}}
  if(e.op==='COMPOSE'){const a=S.artifacts[e.args.letter];if(!a||!a.versions[a.version].written)return'the letter is not finished';if(!a.address)return'the envelope is not addressed'}
  return null}
function applyWrite(S,e,p){const w=e.args.write;const A=S.artifacts[w.artifact];if(!A)return;const v=A.versions[w.version];if(!v)return;v.events.push(e.id);
  if(w.field==='body'){if(p>=1){v.lines[w.line-1]=w.text;if(w.final){v.written=true;if(A.status==='requested'||A.status==='writing')A.status='drafted';if(A.correspondence==='none')A.correspondence='DRAFTED';A.history.push({t:e.t+e.dur,ev:e.id,what:'v'+w.version+' written by '+e.actor+' ('+v.lines.length+' lines)'})}}
    else{v.writing=w.text;if(A.status==='requested')A.status='writing'}}
  else if(w.field==='address'&&p>=1){A.address=w.text;v.address=w.text;if(A.status==='reviewed'||A.status==='drafted')A.status='addressed';A.history.push({t:e.t+e.dur,ev:e.id,what:'envelope addressed to '+w.text})}
  else if(p>=1)v.marks=(v.marks||0)+1}
function applyAnimate2(S,e,p){const a=e.args||{};const o=S.objects[e.target];
  if(o&&a.behavior==='awaken'&&o.kind==='instrument'&&o.activated==null){o.activated=e.t;o.awakenEv=e;o.hover=a.hover||null}
  const A=S.artifacts[e.target];if(A&&a.behavior==='examine'&&p>=1){A.reviewed=e.t+e.dur;A.reviewedBy=e.actor;if(A.status==='drafted')A.status='reviewed';A.history.push({t:e.t+e.dur,ev:e.id,what:'reviewed by '+e.actor})}}
function applyGrammar(S,e,p,t){const a=e.args||{};
  if(e.op==='COMMAND'){const q=S.objects[e.target];q.commands.push(e.id);const v=a.draft.version;
    S.artifacts[a.artifact]={id:a.artifact,kind:'letter',recipient:a.recipient,purpose:a.purpose||'',intent:a.intent,context:a.context,constraints:a.constraints,authorizedBy:e.actor,instrument:e.target,command:e.id,approval_required:!!a.approval_required,
      version:v,versions:{[v]:{version:v,text:a.draft.text,recipient:a.recipient,source:a.draft.source||'',frame:a.output_frame,lines:[],events:[],written:false,address:null}},status:'requested',correspondence:'none',external:'not sent',address:null,
      history:[{t:e.t,ev:e.id,what:'commanded by '+e.actor+' through '+e.target+(a.approval_required?', approval required':'')}]}}
  else if(e.op==='REVISE'){const A=S.artifacts[a.artifact];A.version=a.version;A.recipient=a.recipient||A.recipient;A.address=null;A.status='requested';
    A.versions[a.version]={version:a.version,text:a.text,recipient:A.recipient,source:'revision',frame:a.output_frame,lines:[],events:[],written:false,address:null};A.history.push({t:e.t,ev:e.id,what:'revision v'+a.version+' requested by '+e.actor})}
  else if(e.op==='COMPOSE'&&p>=1){const A=S.artifacts[a.letter];S.correspondence[e.target]={id:e.target,letter:a.letter,version:A.version,envelope:a.envelope,status:'prepared',external:'not sent',t:e.t};
    A.status='prepared';A.envelope=a.envelope;A.history.push({t:e.t+e.dur,ev:e.id,what:'folded into '+a.envelope+': prepared, not sent'})}
  else if(e.op==='RECEIVE'){S.signals.push({t:e.t,dur:e.dur,signal:a.signal,reply:!!a.reply,observation:true,ev:e.id});
    if(t<e.t+e.dur+1.2)for(const c of Object.values(S.chars))if(c.frame==='studio')S.looks[c.id]={w:toWorld('desk',RADIO_AT),until:e.t+e.dur+1.2}}}

