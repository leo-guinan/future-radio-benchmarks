(()=>{
const W=1280,H=720;
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const sstep=t=>{t=clamp(t);return t*t*(3-2*t)};
const easeSine=t=>.5-.5*Math.cos(Math.PI*clamp(t));
const smooth=(a,b,t)=>sstep((t-a)/(b-a));
const lp=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
const dist=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
const hash=(a,b)=>{const s=Math.sin(a*12.9898+b*78.233)*43758.5453;return s-Math.floor(s)};
const hashStr=s=>{let h=7;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))%1000003;return h};

/* ================= geometry ================= */
function Lp(x1,y1,x2,y2,n=6){const p=[];for(let i=0;i<=n;i++)p.push([lerp(x1,x2,i/n),lerp(y1,y2,i/n)]);return p}
function El(cx,cy,rx,ry,a0=0,a1=Math.PI*2,n=24){const p=[];for(let i=0;i<=n;i++){const a=lerp(a0,a1,i/n);p.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}return p}
function Ci(cx,cy,r,n=20){return El(cx,cy,r,r,-Math.PI/2,Math.PI*1.5,n)}
function RR(x,y,w,h,r){const p=[];const seg=(x1,y1,x2,y2)=>{for(let i=0;i<6;i++)p.push([lerp(x1,x2,i/6),lerp(y1,y2,i/6)])};
  const arc=(cx,cy,a0)=>{for(let i=0;i<5;i++){const a=a0+i/5*Math.PI/2;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}};
  seg(x+r,y,x+w-r,y);arc(x+w-r,y+r,-Math.PI/2);seg(x+w,y+r,x+w,y+h-r);arc(x+w-r,y+h-r,0);seg(x+w-r,y+h,x+r,y+h);arc(x+r,y+h-r,Math.PI/2);seg(x,y+h-r,x,y+r);arc(x+r,y+r,Math.PI);p.push([x+r,y]);return p}
function Qb(a,b,c,n=12){const p=[];for(let i=0;i<=n;i++){const t=i/n;p.push([(1-t)*(1-t)*a[0]+2*(1-t)*t*b[0]+t*t*c[0],(1-t)*(1-t)*a[1]+2*(1-t)*t*b[1]+t*t*c[1]])}return p}
function Poly(pts,n=5){const p=[];for(let i=0;i<pts.length-1;i++)for(let k=0;k<n;k++)p.push(lp(pts[i],pts[i+1],k/n));p.push(pts[pts.length-1]);return p}

/* ================= templates ================= */
const LEO={kind:'character',strokes:[RR(-40,-168,80,62,12),Lp(0,-168,0,-188,3),Ci(0,-194,5,12),Ci(-17,-139,7,14),Ci(17,-139,7,14),Lp(-11,-121,11,-121,3),
  Lp(-6,-106,-6,-96,2),Lp(6,-106,6,-96,2),RR(-34,-96,72,96,8),Ci(2,-62,11,16),Lp(2,-62,8,-69,2),Lp(-26,-24,30,-24,6),Ci(-30,-75,4,10),Ci(36,-75,4,10),
  Lp(-32,-72,-49,-26,5),Lp(-49,-26,-51,0,4),Ci(-52,10,8,16),Qb([-58,16],[-60,23],[-61,30],5),Qb([-54,18],[-55,25],[-55,32],5),Qb([-50,18],[-49,25],[-49,32],5),Qb([-46,16],[-44,23],[-43,29],5)],
  fills:[[RR(-40,-168,80,62,12),'#b3babd'],[RR(-34,-96,72,96,8),'#b3babd'],[Ci(2,-62,11,16),'#c47744']],
  eyes:[[-17,-139],[17,-139]],shoulder:[38,-72],rest:[76,18],head:[0,-139],bbox:[-62,-200,90,34],behaviors:[],pressure:.6};
const starPts=Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?16:40;return[Math.cos(a)*r,Math.sin(a)*r]});
const TPL={
  leonardo:LEO,
  pencil:{strokes:[Lp(0,0,14,-27,4),Lp(3,1,17,-26,4),Lp(0,0,2,4,2)],fills:[[[[0,0],[14,-27],[17,-26],[3,1]],'#c47744']],behaviors:[]},
  bell:{strokes:[Ci(0,-44,5,12),Qb([-30,20],[-34,-40],[0,-39],12),Qb([0,-39],[34,-40],[30,20],12),Lp(-37,20,37,20,8),Ci(0,29,6,12)],fills:[[[...Qb([-30,20],[-34,-40],[0,-39],12),...Qb([0,-39],[34,-40],[30,20],12)],'#d9b46a']],pivot:[0,-44],behaviors:['ring'],sound:'bell'},
  lamp:{strokes:[El(0,46,18,4,0,Math.PI*2,16),Lp(0,46,0,-10,6),Poly([[-22,-10],[22,-10],[14,-36],[-14,-36],[-22,-10]])],fills:[[[[-22,-10],[22,-10],[14,-36],[-14,-36]],'#c47744']],light:[0,-4],behaviors:['glow']},
  star:{strokes:[Poly([...starPts,starPts[0]],3)],fills:[[starPts,'#f0d36a']],light:[0,0],behaviors:['twinkle','glow']},
  sun:{strokes:[Ci(0,0,20,20),...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return Lp(Math.cos(a)*27,Math.sin(a)*27,Math.cos(a)*42,Math.sin(a)*42,2)})],fills:[[Ci(0,0,20,20),'#f0c25a']],light:[0,0],behaviors:['glow','spin']},
  cloud:{strokes:[El(-18,4,14,12,Math.PI,Math.PI*2,8),El(2,-4,18,17,Math.PI,Math.PI*2,10),El(22,4,13,11,Math.PI,Math.PI*2,8),Lp(35,4,-32,4,8)],behaviors:['drift']},
  flower:{strokes:[Qb([0,46],[6,10],[0,-18],10),Qb([2,22],[18,12],[22,22],6),...Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return Ci(Math.cos(a)*11,-30+Math.sin(a)*11,8,12)}),Ci(0,-30,5,10)],fills:[[Ci(0,-30,5,10),'#e7a23c']],pivot:[0,46],behaviors:['sway']},
  tree:{strokes:[Lp(-5,46,-4,0,4),Lp(5,46,4,0,4),El(0,-14,30,26,0,Math.PI*2,22),Qb([-12,-10],[-4,-18],[6,-12],6)],fills:[[El(0,-14,30,26,0,Math.PI*2,22),'#8fa983']],pivot:[0,46],behaviors:['sway']},
  fish:{strokes:[El(-4,0,26,13,0,Math.PI*2,22),Poly([[20,0],[38,-13],[38,13],[20,0]]),Ci(-18,-3,2.5,8),Qb([-2,-12],[4,0],[-2,12],6)],fills:[[El(-4,0,26,13,0,Math.PI*2,22),'#9db4cc']],behaviors:['swim']},
  house:{strokes:[Poly([[-30,44],[-30,0],[30,0],[30,44],[-30,44]]),Poly([[-36,2],[0,-30],[36,2]]),Poly([[-8,44],[-8,22],[8,22],[8,44]]),RR(14,10,10,10,1)],fills:[[[[-30,44],[-30,0],[30,0],[30,44]],'#d8c3a0']],behaviors:[]},
  moon:{strokes:[El(0,0,30,30,-Math.PI*.7,Math.PI*.7,18),Qb([Math.cos(-Math.PI*.7)*30,Math.sin(-Math.PI*.7)*30],[-2,0],[Math.cos(Math.PI*.7)*30,Math.sin(Math.PI*.7)*30],12)],light:[10,0],behaviors:['glow']},
  hook:{strokes:[Lp(-9,-6,9,-6,4),Lp(0,-6,0,0,2),Qb([0,0],[0,9],[7,8],6)],behaviors:[],hook:[0,7],pressure:.75},
  // diagnostic primitives
  line:{strokes:[Lp(-60,0,60,0,24)],behaviors:[],pressure:.55},
  curve:{strokes:[Qb([-55,22],[0,-58],[55,22],28)],behaviors:[],pressure:.55},
  circle:{strokes:[Ci(0,0,38,36)],behaviors:[],pressure:.55},
  marks:{strokes:[Lp(-30,6,-24,-6,2),Lp(-8,6,-2,-6,2),Lp(14,6,20,-6,2),Lp(36,6,42,-6,2)],behaviors:[],pressure:.85},
  'outfit:animator':{kind:'outfit',design:'animator',strokes:[Qb([-9,-36],[0,-50],[9,-36],8),Poly([[-17,-36],[17,-36],[24,32],[-24,32],[-17,-36]]),RR(-10,-4,20,15,2),RR(-7,-10,13,8,1),Lp(9,-26,22,-48,4),Ci(-14,40,6,12),Lp(-12,-12,-4,-16,2),Lp(6,18,14,14,2)],
    fills:[[[[-17,-36],[17,-36],[24,32],[-24,32]],'#cdbf9f'],[RR(-7,-10,13,8,1),'#efe3c6'],[Ci(-14,40,6,12),'#4a433b'],[[[9,-26],[22,-48],[24,-47],[11,-25]],'#c47744']],pivot:[0,-46],behaviors:[],pressure:.5}};
for(const [k,v] of Object.entries(TPL))v.key=k;
const OUTFITS={animator:{name:'Animator outfit',role:'animator',attach:['torso','ear','pocket','left hand'],
  worn:{fills:[[[[-30,-90],[34,-90],[42,-2],[-38,-2]],'#cdbf9f'],[RR(-19,-60,16,11,1),'#efe3c6'],[Ci(-52,10,9,16),'#4a433b'],[[[40,-150],[50,-186],[53,-185],[43,-149]],'#c47744']],
    strokes:[Poly([[-30,-90],[34,-90],[42,-2],[-38,-2],[-30,-90]]),Lp(-26,-90,-18,-106,3),Lp(30,-90,22,-106,3),RR(-22,-52,24,20,3),RR(-19,-60,16,11,1),Lp(-15,-56,-7,-56,2),
      Qb([-6,-30],[2,-34],[8,-28],5),Qb([14,-16],[20,-20],[26,-14],5),Lp(40,-150,50,-186,4),Lp(43,-149,53,-185,4),Ci(-52,10,9,16)]}}};
const ROLES={animator:{name:'Animator',caps:['INSCRIBE','ALTER','ANIMATE','FRAME'],tools:['pencil']}};
const ALL_CAPS=['INSCRIBE','ALTER','ANIMATE','FRAME','EQUIP','UNEQUIP','COMMAND','REVISE','COMPOSE'];
const BASELINE_NEW=['EQUIP','UNEQUIP'];
const tplOf=a=>typeof a.tpl==='string'?TPL[a.tpl]:a.tpl;
const frameBorder=(x,y,w,h)=>[Poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]],10),Poly([[x+w*.04,y+w*.04],[x+w-w*.04,y+w*.04],[x+w-w*.04,y+h-w*.04],[x+w*.04,y+h-w*.04],[x+w*.04,y+w*.04]],10)];
const frameStrokes=a=>a.border===false?[]:a.border==='single'?[Poly([[a.x,a.y],[a.x+a.w,a.y],[a.x+a.w,a.y+a.h],[a.x,a.y+a.h],[a.x,a.y]],10)].concat(a.flap?[Poly([[a.x+a.w*.02,a.y+a.h*.03],[a.x+a.w/2,a.y+a.h*.4],[a.x+a.w*.98,a.y+a.h*.03]],8)]:[]):frameBorder(a.x,a.y,a.w,a.h).concat(a.feet?[Lp(a.x+a.w*.2,a.y+a.h,a.x+a.w*.12,a.y+a.h+4,2),Lp(a.x+a.w*.8,a.y+a.h,a.x+a.w*.88,a.y+a.h+4,2)]:[]);

/* ================= measuring, coherent wobble ================= */
const MEAS=new WeakMap();
function measure(strokes){let m=MEAS.get(strokes);if(m)return m;const cum=[];let total=0;
  for(const s of strokes){const c=[0];let L=0;for(let i=1;i<s.length;i++){L+=dist(s[i-1],s[i]);c.push(L)}cum.push(c);total+=L}
  m={cum,total};MEAS.set(strokes,m);return m}
// wobble lives in the drawing's own coordinates, depends only on arc length and a seed: same every frame, moves with the object
function wobbleStroke(s,seed,amp){const c=[0];for(let i=1;i<s.length;i++)c.push(c[i-1]+dist(s[i-1],s[i]));const L=c[c.length-1]||1;
  const ph1=hash(seed,1)*6.283,ph2=hash(seed,2)*6.283,f1=.035+hash(seed,3)*.03,f2=.11+hash(seed,4)*.05;
  return s.map((p,i)=>{const a=s[Math.max(0,i-1)],b=s[Math.min(s.length-1,i+1)];let nx=-(b[1]-a[1]),ny=b[0]-a[0];const nl=Math.hypot(nx,ny)||1;nx/=nl;ny/=nl;
    const d=c[i],w=amp*(.65*Math.sin(d*f1+ph1)+.35*Math.sin(d*f2+ph2))*Math.min(1,d/6,(L-d)/6);return[p[0]+nx*w,p[1]+ny*w]})}
const DRAWN=new WeakMap();
function drawnOf(tpl){let d=DRAWN.get(tpl);if(d)return d;if(tpl.kind==='ink'){DRAWN.set(tpl,tpl.strokes);return tpl.strokes}const seed=hashStr(tpl.key||'inline');d=tpl.strokes.map((s,i)=>wobbleStroke(s,seed+i*17,.55));DRAWN.set(tpl,d);return d}
function revealFracs(strokes,fracs){const out=[];const {cum}=measure(strokes);
  for(let si=0;si<strokes.length;si++){const f=fracs?fracs[si]:1;if(f<=0)continue;const s=strokes[si],c=cum[si],L=c[c.length-1],target=f*L,pl=[];
    for(let i=0;i<s.length;i++){if(c[i]<=target)pl.push(s[i]);else{const k=(target-c[i-1])/Math.max(1e-9,c[i]-c[i-1]);pl.push(lp(s[i-1],s[i],k));break}}out.push(pl)}
  return out}
const tplBox=tpl=>{let a=[1e9,1e9,-1e9,-1e9];for(const s of tpl.strokes)for(const p of s){a[0]=Math.min(a[0],p[0]);a[1]=Math.min(a[1],p[1]);a[2]=Math.max(a[2],p[0]);a[3]=Math.max(a[3],p[1])}return tpl.bbox||a};

