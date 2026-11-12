/* ================= the log ================= */
let LOG=[],ORDERED=[],NEXT=1,uid=1,LIVE_N=0,VER=0;
function add(ev){ev.id=ev.id||('e'+(NEXT++));ev.result=ev.result||'ok';LOG.push(ev);ORDERED.push(ev);LOG.sort((a,b)=>a.t-b.t||(+a.id.slice(1))-(+b.id.slice(1)));VER++;return ev}

/* ================= stroke plans: the drawing path of an event, decided before it starts ================= */
// Each construction event gets a plan: its strokes (in the event's frame), pen-up travel between them, and a time share for each.
// The plan is a pure function of the event, so any fractional time can be evaluated and the result is the same at any frame rate.
const PLANS=new WeakMap();
function planOf(e){if(!e||e.result==='denied'||!(e.op==='FRAME'||e.op==='INSCRIBE'))return null;let p=PLANS.get(e);if(p)return p;const a=e.args;let strokes,pressure;
  if(e.op==='FRAME'){strokes=frameStrokes(a).map((s,i)=>wobbleStroke(s,hashStr(a.id)+i*13,.6));pressure=.85}
  else{const tpl=tplOf(a);strokes=drawnOf(tpl).map(s=>s.map(q=>[a.at[0]+q[0]*a.scale,a.at[1]+q[1]*a.scale]));pressure=tpl.pressure||.55;if(tpl.kind==='ink'){p=inkPlan(strokes,tpl);PLANS.set(e,p);return p}}
  const segs=[];let tot=0;const lens=strokes.map(s=>{let L=0;for(let i=1;i<s.length;i++)L+=dist(s[i-1],s[i]);return L});
  strokes.forEach((s,si)=>{if(si>0){const from=strokes[si-1][strokes[si-1].length-1],to=s[0];const d=dist(from,to);const w=1.5+Math.pow(d,.8)*.6;segs.push({type:'travel',from,to,d,w});tot+=w}
    const w=Math.pow(Math.max(lens[si],.5),.85)+.5;segs.push({type:'draw',si,len:lens[si],w});tot+=w});
  let acc=0;for(const s of segs){s.u0=acc/(tot||1);acc+=s.w;s.u1=acc/(tot||1)}
  // sharp corners, for audio ticks
  const corners=strokes.map(s=>{const out=[];let d=0;for(let i=1;i<s.length-1;i++){d+=dist(s[i-1],s[i]);const a1=Math.atan2(s[i][1]-s[i-1][1],s[i][0]-s[i-1][0]),a2=Math.atan2(s[i+1][1]-s[i][1],s[i+1][0]-s[i][0]);let da=Math.abs(a2-a1);if(da>Math.PI)da=2*Math.PI-da;if(da>1.1)out.push(d)}return out});
  p={strokes,segs,lens,pressure,corners,lift:e.op==='FRAME'?10:8};PLANS.set(e,p);return p}
function evalPlan(p,u){u=clamp(u);const fr=new Array(p.strokes.length).fill(0);let seg=p.segs[p.segs.length-1];for(const s of p.segs)if(u<=s.u1){seg=s;break}
  for(const s of p.segs)if(s.type==='draw'){if(s.u1<=u)fr[s.si]=1}
  const k=(u-seg.u0)/Math.max(1e-9,seg.u1-seg.u0);
  if(seg.type==='draw'){const ks=easeSine(k);fr[seg.si]=ks;const st=p.strokes[seg.si];const {cum}=measure(p.strokes);const c=cum[seg.si];const target=ks*p.lens[seg.si];
    let i=1;while(i<st.length-1&&c[i]<target)i++;const kk=(target-c[i-1])/Math.max(1e-9,c[i]-c[i-1]);return{fracs:fr,tip:lp(st[i-1],st[i],clamp(kk)),contact:k>0&&k<1||(k>=0&&k<=1),si:seg.si,k,lift:0,seg}}
  const kt=sstep(k);return{fracs:fr,tip:lp(seg.from,seg.to,kt),contact:false,si:-1,k,lift:Math.pow(Math.sin(Math.PI*k),2)*p.lift*clamp(seg.d/18),seg}}

/* ================= frames ================= */
let FR=null;const FCACHE=new Map();
function frameDefs(t=Infinity){const key=VER+'|'+t;const hit=FCACHE.get(key);if(hit)return hit;
  const F={studio:{id:'studio',parent:null,x:0,y:0,w:W,h:H,lw:W,lh:H,depth:0,t:-1,name:'studio'}};
  for(const e of LOG)if(e.op==='FRAME'&&e.result!=='denied'){const a=e.args;F[a.id]={id:a.id,name:a.name||a.id,parent:e.frame,x:a.x,y:a.y,w:a.w,h:a.h,lw:a.lw,lh:a.lh,surface:!!a.surface,z:a.z||'back',paper:a.paper||null,t:e.t,ev:e}}
  for(const e of LOG)if(e.op==='ALTER'&&e.args.move&&e.result!=='denied'&&e.t<=t&&F[e.target]){const u=clamp((t-e.t)/(e.dur||1)),k=ease(u);const f=F[e.target];f.x+=e.args.move[0]*k;f.y+=e.args.move[1]*k;if(e.args.scale){f.w*=lerp(1,e.args.scale[0],ease(clamp(u*1.15)));f.h*=lerp(1,e.args.scale[1],ease(clamp(u*1.6)))}if(e.args.tuck&&t>=e.t+e.dur)f.hidden=true}
  for(const f of Object.values(F)){let d=0,p=f;while(p.parent){d++;p=F[p.parent];if(!p)break}f.depth=d}
  if(FCACHE.size>400)FCACHE.clear();FCACHE.set(key,F);return F}
const toParent=(f,p)=>[f.x+p[0]*f.w/f.lw,f.y+p[1]*f.h/f.lh];
const fromParent=(f,p)=>[(p[0]-f.x)*f.lw/f.w,(p[1]-f.y)*f.lh/f.h];
function toWorld(fid,p){let f=FR[fid];while(f&&f.parent){p=toParent(f,p);f=FR[f.parent]}return p}
function chain(fid){const c=[];let f=FR[fid];while(f){c.unshift(f);f=FR[f.parent]}return c}
function worldTo(fid,p){for(const f of chain(fid))if(f.parent)p=fromParent(f,p);return p}
function frameScale(fid){let s=1,f=FR[fid];while(f&&f.parent){s*=f.w/f.lw;f=FR[f.parent]}return s}
const pathOf=fid=>FR[fid]?chain(fid).map(f=>f.id).join(' › '):fid;
const isAncestor=(a,b)=>{let f=FR[b];while(f){if(f.id===a)return true;f=FR[f.parent]}return false};
// a FRAME event's plan is in the parent's coordinates at creation; follow the frame if it has moved since
const frameShift=e=>{if(e.op!=='FRAME')return[0,0];const f=FR[e.args.id];return f?[f.x-e.args.x,f.y-e.args.y]:[0,0]};

