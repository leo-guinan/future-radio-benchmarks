/* ================= world state (fold with capability checks), memoized ================= */
function newState(){return{objects:{},chars:{},frames:{},rings:[],looks:{},denials:[],mismatch:[],artifacts:{},correspondence:{},signals:[]}}
function capsOf(S,cid){const c=S.chars[cid];if(!c)return[];const set=new Set(c.caps);for(const oid of c.equipped){const o=S.objects[oid];if(o&&ROLES[o.role])for(const k of ROLES[o.role].caps)set.add(k)}return ALL_CAPS.filter(k=>set.has(k))}
function roleOf(S,cid){const c=S.chars[cid];if(!c)return null;const o=c.equipped.map(id=>S.objects[id]).find(o=>o&&o.role);return o?ROLES[o.role].name:null}
function check(S,e){if(e.op==='PROPAGATE')return null;const pre=checkGrammar(S,e);if(pre!==undefined)return pre;const c=S.chars[e.actor];if(!c)return null;if(c.prog<1)return'actor is still being drawn';
  const selfWake=e.op==='ANIMATE'&&e.args.behavior==='wake'&&e.target===e.actor;
  if(!selfWake&&(c.awake==null||e.t<c.awake))return'actor is asleep';
  if(!selfWake&&!capsOf(S,e.actor).includes(e.op))return'missing capability '+e.op;
  if(!isAncestor(c.frame,e.frame))return'out of reach ('+e.frame+' is outside '+c.frame+')';
  if(e.op==='EQUIP'){const o=S.objects[e.target],w=S.chars[e.args.wearer];if(!o||o.kind!=='outfit')return'no such outfit';if(o.equippedBy)return'already worn';if(!w)return'no such wearer';if(!isAncestor(w.frame,o.frame))return'wearer cannot reach it'}
  if(e.op==='UNEQUIP'){const o=S.objects[e.target];if(!o||!o.equippedBy)return'not being worn'}
  return checkCommand(S,e)}
function apply(S,e,t){const p=e.dur?clamp((t-e.t)/e.dur):1;const a=e.args||{};
  const reason=check(S,e);const denied=e.result==='denied'||!!reason;
  if((e.result==='denied')!==!!reason)S.mismatch.push(e.id+': log says '+e.result+', replay says '+(reason||'ok'));
  if(denied){if(t<e.t+1.6)S.denials.push({e,reason:reason||e.reason});return}
  if(e.op==='FRAME'){S.frames[a.id]={id:a.id,prog:p,ev:e}}
  else if(e.op==='INSCRIBE'){const tpl=tplOf(a);
    if(tpl.kind==='character'&&a.as!=='drawing')S.chars[a.id]={id:a.id,name:a.name,frame:e.frame,at:[...a.at],scale:a.scale,tpl,prog:p,awake:null,hasPencil:a.pencil?e.t:null,caps:[...(a.caps||ALL_CAPS)],equipped:[],creator:e.actor,ev:e};
    else S.objects[a.id]={id:a.id,name:a.name||a.tpl,frame:e.frame,at:[...a.at],scale:a.scale,tpl,prog:p,behaviors:[],held:false,kind:tpl.kind||'drawing',
      design:tpl.design||null,role:tpl.design?OUTFITS[tpl.design].role:null,equippedBy:null,creator:e.actor,ev:e,instrument:tpl.instrument||null,activated:null,hover:null,commands:[]};if(a.write)applyWrite(S,e,p)}
  else if(e.op==='ANIMATE'){const o=S.objects[e.target],c=S.chars[e.target];if(c&&a.behavior==='wake'&&c.awake==null)c.awake=e.t;if(o)o.behaviors.push({b:a.behavior,t0:e.t,t1:a.until?e.t+a.until:Infinity});applyAnimate2(S,e,p)}
  else if(e.op==='ALTER'){if(a.attach&&p>=1){const o=S.objects[e.target],c=S.chars[a.attach];if(o&&c){o.held=true;c.hasPencil=e.t+e.dur}}}
  else if(e.op==='EQUIP'&&p>=1){const o=S.objects[e.target],w=S.chars[a.wearer];o.equippedBy=w.id;o.frame=w.frame;w.equipped.push(o.id)}
  else if(e.op==='UNEQUIP'&&p>=1){const o=S.objects[e.target],w=S.chars[o.equippedBy];w.equipped=w.equipped.filter(id=>id!==o.id);o.equippedBy=null;o.frame=e.frame;o.at=[...a.at]}
  else if(e.op==='COMMAND'||e.op==='REVISE'||e.op==='COMPOSE'||e.op==='RECEIVE')applyGrammar(S,e,p,t)
  else if(e.op==='PROPAGATE'){const src=S.objects[e.target];if(src&&t<e.t+e.dur){const w=objWorld(src,src.tpl.pivot||[0,0],t);S.rings.push({w,t0:e.t,frame:src.frame,dur:e.dur});
      for(const c of Object.values(S.chars))if(c.frame!==src.frame&&isAncestor(c.frame,src.frame))S.looks[c.id]={w,until:e.t+2.8}}}}
const SCACHE=new Map();
function stateAt(t,order){if(order){const S=newState();for(const e of order){if(e.t>t)continue;apply(S,e,t)}return S}
  const key=VER+'|'+t;const hit=SCACHE.get(key);if(hit)return hit;const keep=FR;FR=frameDefs(t);const S=newState();for(const e of LOG){if(e.t>t)continue;apply(S,e,t)}FR=keep;
  if(SCACHE.size>300)SCACHE.clear();SCACHE.set(key,S);return S}
const hasPencilNow=(S,c,t)=>(c.hasPencil!=null&&t>=c.hasPencil)||c.equipped.some(id=>{const o=S.objects[id];return o&&ROLES[o.role]&&ROLES[o.role].tools.includes('pencil')});

function behaviorXform(o,t){let ang=0,sc=1,dx=0,dy=0;for(const b of o.behaviors){if(t<b.t0||t>b.t1)continue;const d=t-b.t0;
    if(b.b==='ring'&&d<2.6)ang+=.42*Math.exp(-d*1.5)*Math.sin(d*13)*sstep(d/.08);
    if(b.b==='sway')ang+=.12*Math.sin(d*2.1)*sstep(d/.6);
    if(b.b==='twinkle')sc*=1+.12*Math.sin(d*6)*sstep(d/.4);
    if(b.b==='spin')ang+=d*d/(d+1)*.6;
    if(b.b==='drift'||b.b==='swim'){const f=FR[o.frame];const span=f.lw+120;const v=b.b==='swim'?34:18;const ramp=d<1?d*d/2:d-.5;const x=((o.at[0]+ramp*v)+60)%span-60;dx+=x-o.at[0];if(b.b==='swim')dy+=Math.sin(d*2)*6*sstep(d)}}
  return{ang,sc,dx,dy}}
function objLocal(o,p,t){const x=behaviorXform(o,t);const pv=o.tpl.pivot||[0,0];let q=[p[0]-pv[0],p[1]-pv[1]];
  const c=Math.cos(x.ang),s=Math.sin(x.ang);q=[(q[0]*c-q[1]*s)*x.sc+pv[0],(q[0]*s+q[1]*c)*x.sc+pv[1]];
  return[o.at[0]+q[0]*o.scale+x.dx,o.at[1]+q[1]*o.scale+x.dy]}
const objWorld=(o,p,t)=>toWorld(o.frame,objLocal(o,p,t));
const charLocal=(c,p)=>{const at=SCENE==='episode'&&typeof episodeCharacterOrigin==='function'?episodeCharacterOrigin(c,T):c.at;return[at[0]+p[0]*c.scale,at[1]+p[1]*c.scale]};
const charWorld=(c,p)=>toWorld(c.frame,charLocal(c,p));

/* ================= choreography: approach, contact, trace, lift, observe ================= */
// Pencil tasks per actor, derived from the log: drawing events (with plans) and reach gestures (EQUIP, ALTER, denials).
const TASKS=new Map();
function tasksOf(cid){const key=VER+'|'+cid;let t=TASKS.get(key);if(t)return t;
  t=LOG.filter(e=>e.actor===cid&&e.op!=='PROPAGATE'&&e.dur>0&&((planOf(e)&&planOf(e).strokes.length)||(e.args&&e.args.point))).map(e=>({e,t0:e.t,t1:e.t+e.dur,draw:!!(planOf(e)&&planOf(e).strokes.length)}));
  if(TASKS.size>200)TASKS.clear();TASKS.set(key,t);return t}
// a point of an event, in the acting character's frame
function evPoint(e,p,c){const sh=frameShift(e);return worldTo(c.frame,toWorld(e.frame,[p[0]+sh[0],p[1]+sh[1]]))}
function taskEnds(task,c){const e=task.e;if(task.draw){const p=planOf(e);const s0=p.strokes[0],sl=p.strokes[p.strokes.length-1];return[evPoint(e,s0[0],c),evPoint(e,sl[sl.length-1],c)]}const q=evPoint(e,e.args.point,c);return[q,q]}
function taskTarget(task,c){const e=task.e;if(e.op==='FRAME'){const a=e.args;return toWorld(e.frame,[a.x+a.w/2+frameShift(e)[0],a.y+a.h/2+frameShift(e)[1]])}if(e.op==='INSCRIBE')return toWorld(e.frame,e.args.at);return toWorld(e.frame,e.args.point)}
const PCACHE=new Map();
function pencilState(c,t){const key=VER+'|'+c.id+'|'+t;const hit=PCACHE.get(key);if(hit)return hit;const r=pencilStateRaw(c,t);if(PCACHE.size>2000)PCACHE.clear();PCACHE.set(key,r);return r}
function pencilStateRaw(c,t){const rest=charLocal(c,c.tpl.rest);const H=16*c.scale;const up=p=>[p[0],p[1]-H];
  const tasks=tasksOf(c.id);let i=0;while(i<tasks.length&&tasks[i].t1<t)i++;
  const cur=tasks[i];
  if(cur&&t>=cur.t0){const e=cur.e;const u=(t-cur.t0)/(cur.t1-cur.t0);
    if(cur.draw){const p=planOf(e);const r=evalPlan(p,u);const sh=frameShift(e);const lift=r.lift;
      // lift happens in the event's frame: convert a lifted point
      const tipEv=[r.tip[0]+sh[0],r.tip[1]+sh[1]-lift];const tip=worldTo(c.frame,toWorld(e.frame,tipEv));
      return{p:tip,contact:r.contact,drawing:e,plan:p,ev:r,look:toWorld(e.frame,[r.tip[0]+sh[0],r.tip[1]+sh[1]]),phase:r.contact?'trace':'travel'}}
    const q=evPoint(e,e.args.point,c);const k=Math.pow(Math.sin(Math.PI*clamp(u)),2);let p=q;if(e.result==='denied')p=[q[0]+Math.sin(u*Math.PI*6)*3*c.scale*k,q[1]];
    return{p,contact:false,gesture:e,look:toWorld(c.frame,q),phase:e.result==='denied'?'denied':'reach'}}
  // between tasks
  const prev=tasks[i-1],next=cur;const E=prev?prev.t1:-Infinity,S=next?next.t0:Infinity;const g=S-E;
  const endP=prev?taskEnds(prev,c)[1]:rest,startP=next?taskEnds(next,c)[0]:rest;
  const l=Math.min(.22,isFinite(g)?g*.3:.22),d=Math.min(.16,isFinite(g)?g*.25:.16);
  const lookObs=prev&&prev.draw&&t-E<Math.min(.8,g-.3)?taskTarget(prev,c):null;
  const lookApp=next?taskTarget(next,c):null;
  if(!isFinite(g)||g>1.4){const ret=.5,app=.5;
    if(prev&&t<E+l)return{p:lp(endP,up(endP),sstep((t-E)/l)),contact:false,look:lookObs,phase:'lift'};
    if(prev&&t<E+l+ret)return{p:lp(up(endP),rest,sstep((t-E-l)/ret)),contact:false,look:lookObs,phase:'return'};
    if(next&&t>S-d-app&&t<S-d)return{p:lp(rest,up(startP),sstep((t-(S-d-app))/app)),contact:false,look:lookApp,phase:'approach'};
    if(next&&t>=S-d)return{p:lp(up(startP),startP,sstep((t-(S-d))/d)),contact:false,look:lookApp,phase:'descend'};
    return{p:rest,contact:false,look:lookObs,phase:'rest'}}
  {const k=(t-E)/Math.max(1e-6,g);const b=lp(endP,startP,sstep(k));const hop=Math.pow(Math.sin(Math.PI*k),2)*H*clamp(.6+dist(endP,startP)/(120*c.scale),.6,1.6);
   return{p:[b[0],b[1]-hop],contact:false,look:k<.35&&lookObs?lookObs:lookApp,phase:k<.2?'lift':k>.8?'descend':'travel'}}}

/* ================= placement ================= */
function areaOf(fid){const f=FR[fid];if(fid==='studio')return[392,30,888,296];if(f.surface)return[8,16,f.lw-8,134];return[6,6,f.lw-6,f.lh-6]}
function obstacles(S,fid){const boxes=[];
  for(const o of Object.values(S.objects))if(o.frame===fid&&!o.held&&!o.equippedBy){const b=tplBox(o.tpl);boxes.push([o.at[0]+b[0]*o.scale,o.at[1]+b[1]*o.scale,o.at[0]+b[2]*o.scale,o.at[1]+b[3]*o.scale])}
  for(const c of Object.values(S.chars)){const b=c.tpl.bbox;const A=charWorld(c,[b[0],b[1]]),B=charWorld(c,[b[2]+60,b[3]]);boxes.push([...worldTo(fid,A),...worldTo(fid,B)])}
  for(const cf of Object.values(FR))if(cf.parent===fid)boxes.push([cf.x,cf.y,cf.x+cf.w,cf.y+cf.h]);
  if(fid==='studio')boxes.push([398,64,536,208]);if(fid==='desk')boxes.push([282,20,330,140],[366,30,470,140]);return boxes}
function placeBox(S,fid,w,h,opts={}){const A=areaOf(fid);const boxes=obstacles(S,fid);let best=null;const bottom=opts.stand?A[3]:null;
  const ys=bottom!=null?[bottom-h]:Array.from({length:10},(_,i)=>lerp(A[1],A[3]-h,i/9));
  for(const y of ys)for(let i=0;i<=24;i++){const x=lerp(A[0],A[2]-w,i/24);if(x<A[0]-1)continue;const r=[x,y,x+w,y+h];
    let ov=0;for(const b of boxes){const ox=Math.max(0,Math.min(r[2],b[2])-Math.max(r[0],b[0])),oy=Math.max(0,Math.min(r[3],b[3])-Math.max(r[1],b[1]));ov+=ox*oy}
    const pref=opts.prefer?Math.hypot(x+w/2-opts.prefer[0],y+h/2-opts.prefer[1]):0;const score=ov*10+pref;if(!best||score<best.s)best={s:score,x,y,ov}}
  return best}
function placeObj(S,fid,tpl,scale,prefer){const b=tplBox(tpl).map(v=>v*scale);const p=placeBox(S,fid,b[2]-b[0],b[3]-b[1],{prefer,stand:FR[fid].surface});return[p.x-b[0],p.y-b[1]]}

/* ================= invoke() ================= */
const costOf=(strokes,scale,fid)=>Math.round(measure(strokes).total*scale*frameScale(fid)/12)+' mm';
const slug=s=>String(s||'thing').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,18)||'thing';
function findChar(S,ref,fallback){if(!ref)return fallback;const r=String(ref).toLowerCase();const cs=Object.values(S.chars);
  if(r==='$new'||r==='new')return cs[cs.length-1];
  return cs.find(c=>c.id.toLowerCase()===r)||cs.find(c=>c.name.toLowerCase()===r)||cs.filter(c=>c.name.toLowerCase().includes(r)).pop()||fallback}
function invoke(actorId,ops,t0,prov,opts={}){let t=t0;FR=frameDefs(t);let S=stateAt(t);const actor=S.chars[actorId];if(!actor)throw new Error('No such character: '+actorId);
  const ctx={newFrame:null,lastChar:null,lastObj:null,lastOutfit:null};const emitted=[];
  const emit=(ev)=>{ev.t=t;ev.prov=prov;ev.live=!!opts.live;ev.actor=ev.actor||actorId;add(ev);FR=frameDefs(t);
    const before=stateAt(ev.t-1e-4);const reason=check(before,ev);if(reason){ev.result='denied';ev.reason=reason;ev.dur=1.2;ev.out='Denied: '+reason+'.';ev.cost='—';VER++}
    emitted.push(ev);t+=ev.dur+.3;FR=frameDefs(t);S=stateAt(t);return!reason};
  const resolveFrame=(ref)=>{if(ref==null||ref==='here')return actor.frame;const r=String(ref);if(r==='new')return ctx.newFrame||actor.frame;if(FR[r])return r;
    const c=findChar(S,r,null);if(c)return c.frame;const byName=Object.values(FR).find(f=>String(f.name).toLowerCase()===r.toLowerCase());return byName?byName.id:actor.frame};
  const findObj=(ref,pred=()=>true)=>{const os=Object.values(S.objects).filter(o=>isAncestor(actor.frame,o.frame)&&pred(o));if(ref){const r=String(ref).toLowerCase();
      const m=os.filter(o=>o.id===r||String(o.name).toLowerCase()===r||String(o.name).toLowerCase().includes(r)||r.includes(String(o.name).toLowerCase()));if(m.length)return m[m.length-1]}
    return null};
  for(const op of ops){
    if(op.op==='FRAME'){const on=op.on||'here';const parent=on==='desk'?'desk':on==='wall'?'studio':resolveFrame(on);if(!FR[parent])continue;
      const P=FR[parent];const sz={small:.75,medium:1,large:1.35}[op.size]||1;
      let w,h;if(parent==='desk'){w=80*sz;h=96*sz}else if(parent==='studio'){w=120*sz;h=144*sz}else{w=Math.round(P.lw*.36*sz);h=Math.round(w*1.2)}
      let pl=placeBox(S,parent,w,h,{stand:P.surface,prefer:parent==='desk'?[60,90]:null});
      {const w0=w,h0=h;for(const k of[.8,.65]){if(pl.ov<=0)break;const q=placeBox(S,parent,w0*k,h0*k,{stand:P.surface,prefer:parent==='desk'?[60,90]:null});if(q.ov<pl.ov*.6){pl=q;w=Math.round(w0*k);h=Math.round(h0*k)}}}
      const id='F'+(Object.keys(FR).length)+'-'+(uid++);const a={id,name:op.name||'frame',x:Math.round(pl.x),y:Math.round(pl.y),w,h,lw:400,lh:480,feet:!!P.surface};
      if(emit({dur:2.6,op:'FRAME',target:id,frame:parent,args:a,cost:costOf(frameStrokes(a),1,parent),out:(P.surface?'A frame standing on the '+P.name:'A frame')+', with its own coordinate system.'}))ctx.newFrame=id}
    else if(op.op==='INSCRIBE'){const fid=resolveFrame(op.in);const tpl=op.def||TPL[op.template||op.tpl];if(!tpl||!FR[fid])continue;
      const isChar=tpl.kind==='character'&&op.as!=='drawing';const sc=clamp(op.scale||(isChar?1:.85),.25,2.2);
      let at=null;if(op.on==='hook'){const hk=findObj('hook',o=>o.frame===fid);if(hk)at=[hk.at[0]+tpl.pivot[0]*-sc+hk.tpl.hook[0]*hk.scale,hk.at[1]+hk.tpl.hook[1]*hk.scale-tpl.pivot[1]*sc]}
      if(!at&&op.at&&isFinite(op.at[0])&&isFinite(op.at[1])){const b=tplBox(tpl).map(v=>v*sc),f=FR[fid];at=(op.at[0]+b[0]>=0&&op.at[1]+b[1]>=0&&op.at[0]+b[2]<=f.lw&&op.at[1]+b[3]<=f.lh)?op.at:null}
      if(!at)at=isChar&&FR[fid].lw===400?[200,420]:placeObj(S,fid,tpl,sc);
      let name=op.name||op.template||'drawing',id;
      if(isChar){const n=Object.values(S.chars).filter(c=>c.tpl===LEO).length;name=op.name&&!/^leonardo$/i.test(op.name)?op.name:'Little Leonardo '+n;id='leonardo-'+n+'-'+(uid++)}
      else if(tpl.kind==='outfit'){name=op.name||OUTFITS[tpl.design].name;id=slug(name)+'-'+(uid++)}else id=slug(name)+'-'+(uid++);
      const args={id,tpl:op.def?op.def:(op.template||op.tpl),name,at,scale:sc};if(isChar)args.caps=op.caps||BASELINE_NEW;if(op.as==='drawing')args.as='drawing';
      const dur=clamp(measure(tpl.strokes).total*sc/150,1.0,isChar?5:4);
      if(emit({dur,op:'INSCRIBE',target:id,frame:fid,args,cost:costOf(tpl.strokes,sc,fid),out:isChar?'Draws '+name+': a new character, dormant until woken.':tpl.kind==='outfit'?'Draws the '+name+'. Drawing it grants nothing until someone puts it on.':'Draws '+(op.name||op.template)+'.'})){
        if(isChar)ctx.lastChar=id;else if(tpl.kind==='outfit')ctx.lastOutfit=id;else ctx.lastObj=id}
      if(op.animate)ops.splice(ops.indexOf(op)+1,0,{op:'ANIMATE',target:id,behavior:op.animate})}
    else if(op.op==='ANIMATE'){const b=op.behavior;
      if(b==='wake'){const c=op.target==='$new'||!op.target?(ctx.lastChar&&S.chars[ctx.lastChar]):findChar(S,op.target,null);if(!c)continue;
        emit({dur:2,op:'ANIMATE',target:c.id,frame:c.frame,args:{behavior:'wake'},cost:'—',out:c.id===actorId?'Wakes up.':'Wakes '+c.name+'.'});continue}
      const reachable=o=>o&&isAncestor(actor.frame,o.frame);let target=findObj(op.target)||(reachable(S.objects[ctx.lastObj])?S.objects[ctx.lastObj]:null);if(!target)target=findObj(null,o=>(o.tpl.behaviors||[]).includes(b));if(!target)continue;
      const pt=worldTo(target.frame,objWorld(target,[0,0],t));
      const ok=emit({dur:b==='ring'?.4:.5,op:'ANIMATE',target:target.id,frame:target.frame,args:{behavior:b,until:b==='ring'?2.6:null,point:pt},cost:'—',out:({ring:'Rings it.',glow:'Switches it on. The light stays inside this frame.',sway:'Sets it swaying.',drift:'Sets it drifting.',swim:'Lets it swim.',twinkle:'Makes it twinkle.',spin:'Sets it turning.'})[b]||'Animates it.'});
      if(ok&&b==='ring'){const pe={dur:2.6,actor:target.id,op:'PROPAGATE',target:target.id,frame:target.frame,args:{kind:'sound',arrive:op.arrive||0},cost:'—',out:'The sound leaves '+target.frame+'. Characters in the containing frames turn toward it. The bell stays where it is.'};
        t-=.2;pe.t=t;pe.prov='consequence';pe.live=false;add(pe);emitted.push(pe);t+=2.8;S=stateAt(t)}}
    else if(op.op==='EQUIP'){const wearer=findChar(S,op.wearer,actor);const o=findObj(op.outfit,x=>x.kind==='outfit'&&!x.equippedBy)||findObj(null,x=>x.kind==='outfit'&&!x.equippedBy);if(!o)continue;
      const pt=worldTo(o.frame,objWorld(o,[0,0],t));
      emit({dur:1.4,op:'EQUIP',target:o.id,frame:o.frame,args:{wearer:wearer.id,point:pt},cost:'—',out:wearer.name+' puts on the '+o.name+' and takes on the '+ROLES[o.role].name+' role.'})}
    else if(op.op==='UNEQUIP'){const wearer=findChar(S,op.wearer,actor);const o=(op.outfit&&findObj(op.outfit,x=>x.equippedBy===wearer.id))||wearer.equipped.map(id=>S.objects[id]).find(Boolean);if(!o)continue;
      const fid=wearer.frame;const hk=op.to!=='floor'?Object.values(S.objects).find(x=>x.frame===fid&&x.tpl===TPL.hook):null;const otpl=o.tpl;
      const at=hk?[hk.at[0]+hk.tpl.hook[0]*hk.scale,hk.at[1]+hk.tpl.hook[1]*hk.scale-otpl.pivot[1]*o.scale]:placeObj(S,fid,otpl,o.scale);
      emit({dur:1.4,op:'UNEQUIP',target:o.id,frame:fid,args:{wearer:wearer.id,at,point:at,to:hk?hk.id:'floor'},cost:'—',out:wearer.name+' takes off the '+o.name+(hk?' and hangs it on the hook.':' and sets it down.')+' Its capabilities go with it.'})}
    else if(op.op==='ALTER'&&op.move){const target=resolveFrame(op.target);if(target==='studio')continue;const f=FR[target];
      emit({dur:1.6,op:'ALTER',target,frame:f.parent,args:{move:op.move},cost:'—',out:'Moves '+f.name+'. Everything parented to it moves with it.'})}}
  return{t,emitted}}
