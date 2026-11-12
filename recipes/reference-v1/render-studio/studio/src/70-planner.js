/* ================= plans from instructions (unchanged semantics) ================= */
const B_OK=['ring','glow','sway','drift','swim','twinkle','spin','wake'];
const wantsNested=s=>/\b(frame|picture|portrait|canvas|world)\b/i.test(s)&&/\b(leonardo|yourself|himself|copy|another (you|one)|character|little)\b/i.test(s);
function planLocal(text,S,actorId){const s=text.toLowerCase();const ops=[];const surface=/\bdesk\b/.test(s)?'desk':/\bwall\b/.test(s)?'wall':'here';
  if(/\b(move|slide|push|shift)\b.*\bdesk\b/.test(s)){ops.push({op:'ALTER',target:'desk',move:[/left/.test(s)?-60:60,0]});return ops}
  if(wantsNested(s)){const decor=/\b(portrait|decorat|just a picture|painting of)\b/.test(s)&&!/\b(alive|wake|awake|active|real)\b/.test(s);
    ops.push({op:'FRAME',on:surface,size:/small|tiny/.test(s)?'small':/big|large/.test(s)?'large':'medium',name:surface==='desk'?'desk picture frame':'frame'});
    ops.push({op:'INSCRIBE',template:'leonardo',in:'new',as:decor?'drawing':'actor'});if(!decor&&!/\b(asleep|dormant)\b/.test(s))ops.push({op:'ANIMATE',target:'$new',behavior:'wake'})}
  const forWho=(()=>{const m=Object.values(S.chars).filter(c=>c.id!==actorId&&s.includes(c.name.toLowerCase()));return m.length?m[m.length-1]:null})();
  if(/\b(outfit|apron|costume|uniform|animator)\b/.test(s)&&/\b(draw|make|design|sketch|create)\b/.test(s)){if(/\bhook\b/.test(s))ops.push({op:'INSCRIBE',template:'hook',in:forWho?forWho.id:'here',scale:1.3});
    ops.push({op:'INSCRIBE',template:'outfit:animator',in:forWho?forWho.id:(ops.some(o=>o.op==='FRAME')?'new':'here'),on:/\bhook\b/.test(s)?'hook':undefined,scale:1.6})}
  if(/\b(put (it|the [a-z ]*)? ?on|wear|equip|dress|try (it )?on)\b/.test(s))ops.push({op:'EQUIP',wearer:forWho?forWho.id:undefined});
  if(/\b(take (it |the [a-z ]*)?off|remove|unequip|hang (it|the [a-z ]*)? ?up)\b/.test(s))ops.push({op:'UNEQUIP',to:'hook'});
  if(/\bhook\b/.test(s)&&!ops.some(o=>o.template==='hook')&&!ops.some(o=>o.op==='UNEQUIP'))ops.push({op:'INSCRIBE',template:'hook',scale:1.3});
  for(const k of Object.keys(TPL)){if(['pencil','leonardo','hook','outfit:animator','quill','inkwell','radio'].includes(k))continue;if(new RegExp('\\b'+k).test(s)){const tpl=TPL[k];
    if(/^\s*ring\b/.test(s)&&k==='bell')continue;const op={op:'INSCRIBE',template:k,scale:.85};
    if(/\b(on|light|glow|switch)\b/.test(s)&&tpl.behaviors.includes('glow'))op.animate='glow';else{const b=tpl.behaviors.find(b=>new RegExp(b.slice(0,4)).test(s))||(/\b(move|animate|let it)\b/.test(s)&&tpl.behaviors[0]);if(b)op.animate=b}
    ops.push(op)}}
  if(/\bring\b/.test(s)&&!ops.some(o=>o.template==='bell'))ops.push({op:'ANIMATE',target:'bell',behavior:'ring'});
  for(const b of['drift','sway','spin','twinkle','swim','glow'])if(new RegExp('\\b(make|let|set) (the |it )?([a-z]+ )?'+b.slice(0,4)).test(s)&&!ops.some(o=>o.animate===b)){const m=s.match(/the ([a-z]+)/);ops.push({op:'ANIMATE',target:m?m[1]:'',behavior:b})}
  return ops}
function sanitize(plan){const ops=[];for(const o of (plan&&plan.ops)||[]){if(ops.length>=6)break;const op=String(o.op||'').toUpperCase();
  if(op==='FRAME')ops.push({op:'FRAME',on:['desk','wall','here'].includes(o.on)?o.on:String(o.on||'here'),size:['small','medium','large'].includes(o.size)?o.size:'medium',name:String(o.name||'frame').slice(0,30)});
  else if(op==='ANIMATE'&&B_OK.includes(o.behavior))ops.push({op:'ANIMATE',target:String(o.target||''),behavior:o.behavior});
  else if(op==='EQUIP')ops.push({op:'EQUIP',outfit:o.outfit?String(o.outfit):undefined,wearer:o.wearer?String(o.wearer):undefined});
  else if(op==='UNEQUIP')ops.push({op:'UNEQUIP',outfit:o.outfit?String(o.outfit):undefined,to:'hook'});
  else if(op==='ALTER'&&Array.isArray(o.move))ops.push({op:'ALTER',target:String(o.target||'desk'),move:[clamp(+o.move[0]||0,-120,120),clamp(+o.move[1]||0,-60,60)]});
  else if(op==='INSCRIBE'){const an=B_OK.includes(o.animate)?o.animate:undefined;const inn=o.in?String(o.in):'here';
    if(o.template&&TPL[o.template])ops.push({op:'INSCRIBE',template:o.template,name:o.name?String(o.name).slice(0,24):undefined,in:inn,as:o.as==='drawing'?'drawing':'actor',on:o.on==='hook'?'hook':undefined,at:Array.isArray(o.at)?o.at.map(Number):null,scale:+o.scale||undefined,animate:an});
    else if(Array.isArray(o.strokes)){const strokes=o.strokes.slice(0,12).map(s=>(Array.isArray(s)?s:[]).slice(0,30).map(p=>[clamp(+p[0]||0,-60,60),clamp(+p[1]||0,-60,60)])).filter(s=>s.length>=2);if(!strokes.length)continue;
      const beh=(o.behaviors||[]).filter(b=>B_OK.includes(b)&&b!=='wake');
      ops.push({op:'INSCRIBE',def:{strokes,pivot:Array.isArray(o.pivot)?o.pivot.map(Number):[0,0],light:Array.isArray(o.light)?o.light.map(Number):(beh.includes('glow')?[0,0]:null),behaviors:beh,key:'inline-'+String(o.name||'')},name:String(o.name||'drawing').slice(0,24),in:inn,at:Array.isArray(o.at)?o.at.map(Number):null,scale:+o.scale||1,animate:an})}}}
  return ops}
function structuralOK(text,ops){if(!wantsNested(text))return true;const decor=/\b(portrait|decorat|painting of)\b/i.test(text);
  return ops.some(o=>o.op==='FRAME')&&ops.some(o=>o.op==='INSCRIBE'&&o.template==='leonardo'&&(decor||o.as!=='drawing'))&&!ops.some(o=>o.def&&/leonardo|robot|self|portrait|character/i.test(o.name||''))}

