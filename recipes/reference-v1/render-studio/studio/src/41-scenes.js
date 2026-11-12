/* ================= scenes ================= */
const SUBS=[];let SCRIPT_END=0,SCENE='letter';
function setupStudio(){LOG=[];ORDERED=[];NEXT=1;uid=1;SUBS.length=0;VER++;
  add({t:-1,dur:0,actor:'—',op:'FRAME',target:'desk',frame:'studio',args:{id:'desk',name:'desk',x:420,y:300,w:450,h:260,lw:450,lh:260,surface:true,z:'front',border:false},prov:'set',cost:'—',out:'The desk, as a surface other things can stand on.',hide:true});
  add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:'leonardo',frame:'studio',args:{id:'leonardo',tpl:'leonardo',name:'Leonardo',at:[600,418],scale:1,pencil:true,caps:ALL_CAPS},prov:'set',cost:'—',out:'Leonardo, at his desk.',hide:true});
  add({t:-1,dur:0,actor:'leonardo',op:'ANIMATE',target:'leonardo',frame:'studio',args:{behavior:'wake'},prov:'set',cost:'—',out:'Awake.',hide:true});FR=frameDefs()}
function seedMain(){setupStudio();const P='scripted';
  add({t:2.5,dur:3.5,actor:'leonardo',op:'FRAME',target:'F1',frame:'studio',args:{id:'F1',name:'wall frame',x:700,y:64,w:190,h:228,lw:400,lh:480},prov:P,cost:costOf(frameBorder(700,64,190,228),1,'studio'),out:'Leonardo frames a corner of the wall.'});FR=frameDefs();
  add({t:6.3,dur:6.0,actor:'leonardo',op:'INSCRIBE',target:'mini',frame:'F1',args:{id:'mini',tpl:'leonardo',name:'Little Leonardo',at:[200,420],scale:1},prov:P,cost:costOf(LEO.strokes,1,'F1'),out:'Inside the frame he draws a small copy of himself.'});
  add({t:12.5,dur:1.0,actor:'leonardo',op:'INSCRIBE',target:'pencil-m',frame:'F1',args:{id:'pencil-m',tpl:'pencil',name:'pencil',at:[80,420],scale:1.2},prov:P,cost:costOf(TPL.pencil.strokes,1.2,'F1'),out:'And a pencil beside him.'});
  add({t:15.2,dur:2,actor:'mini',op:'ANIMATE',target:'mini',frame:'F1',args:{behavior:'wake'},prov:P,cost:'—',out:'The little Leonardo wakes and looks around his frame.'});
  add({t:17.4,dur:.8,actor:'mini',op:'ALTER',target:'pencil-m',frame:'F1',args:{attach:'mini',point:[86,406]},prov:P,cost:'—',out:'He picks up the pencil.'});
  add({t:18.6,dur:3.6,actor:'mini',op:'INSCRIBE',target:'bell',frame:'F1',args:{id:'bell',tpl:'bell',name:'bell',at:[318,300],scale:.85},prov:P,cost:costOf(TPL.bell.strokes,.85,'F1'),out:'He draws a bell, with the same INSCRIBE call Leonardo used.'});
  add({t:22.6,dur:.4,actor:'mini',op:'ANIMATE',target:'bell',frame:'F1',args:{behavior:'ring',until:2.6},prov:P,cost:'—',out:'He rings it.'});
  add({t:22.7,dur:2.6,actor:'bell',op:'PROPAGATE',target:'bell',frame:'F1',args:{kind:'sound'},prov:'consequence',cost:'—',out:'The sound leaves the frame. Leonardo turns toward it.'});
  add({t:26.2,dur:.4,actor:'mini',op:'ANIMATE',target:'bell',frame:'F1',args:{behavior:'ring',until:2.6},prov:P,cost:'—',out:'He rings it again.'});
  add({t:26.3,dur:2.6,actor:'bell',op:'PROPAGATE',target:'bell',frame:'F1',args:{kind:'sound'},prov:'consequence',cost:'—',out:'The sound reaches the studio again.'});
  SUBS.push([13.7,15.0,'LEONARDO','There.'],[24.4,26.0,'LEONARDO','Did you just—'],[28.4,30.6,'LEONARDO','Oh. You can reach us.']);
  let r;
  r=invoke('leonardo',[{op:'FRAME',on:'desk',name:'desk picture frame'},{op:'INSCRIBE',template:'leonardo',in:'new',as:'actor'},{op:'INSCRIBE',template:'cloud',in:'new',scale:.9,at:[230,130]},{op:'ANIMATE',target:'$new',behavior:'wake'}],32,P);
  const L2=r.emitted.find(e=>e.op==='INSCRIBE'&&e.args.tpl==='leonardo').target;const F2=r.emitted.find(e=>e.op==='FRAME').target;
  SUBS.push([r.t-.6,r.t+1.2,'LEONARDO','And one for the desk.']);
  r=invoke(L2,[{op:'ANIMATE',target:'cloud',behavior:'drift'}],r.t+1.2,P);
  SUBS.push([r.t-1.4,r.t+.6,'LITTLE LEONARDO 2','It won’t move.'],[r.t+.7,r.t+2.6,'LEONARDO','You need the right clothes.']);
  r=invoke('leonardo',[{op:'INSCRIBE',template:'hook',in:F2,at:[330,150],scale:1.3},{op:'INSCRIBE',template:'outfit:animator',in:F2,on:'hook',scale:1.6}],r.t+2.8,P);
  r=invoke(L2,[{op:'EQUIP',outfit:'animator outfit'}],r.t+.4,P);
  r=invoke(L2,[{op:'ANIMATE',target:'cloud',behavior:'drift'},{op:'INSCRIBE',template:'bell',scale:.8,at:[300,330]},{op:'ANIMATE',target:'bell',behavior:'ring'}],r.t+.3,P);
  SUBS.push([r.t-1.8,r.t-.2,'LEONARDO','I heard that.']);
  r=invoke(L2,[{op:'UNEQUIP',to:'hook'},{op:'ANIMATE',target:'bell',behavior:'ring'}],r.t+.4,P);
  SUBS.push([r.t-.8,r.t+.9,'LITTLE LEONARDO 2','…Oh.']);
  r=invoke('leonardo',[{op:'EQUIP',outfit:'animator outfit'}],r.t+1.2,P);
  SUBS.push([r.t-.2,r.t+2,'LEONARDO','I’ll keep it warm for you.']);
  SCRIPT_END=Math.ceil(r.t+2.5);FR=frameDefs()}
// a short, repeatable scene for checking the stroke renderer and the stroke-audio engine
function seedDiag(){setupStudio();const P='diagnostic';
  const r=invoke('leonardo',[{op:'INSCRIBE',template:'line',at:[470,90],scale:1},{op:'INSCRIBE',template:'curve',at:[640,100],scale:1},{op:'INSCRIBE',template:'circle',at:[800,110],scale:1},
    {op:'INSCRIBE',template:'marks',at:[490,190],scale:1},{op:'INSCRIBE',template:'bell',at:[660,215],scale:.6}],1.2,P);
  SCRIPT_END=Math.ceil(r.t+1.5);FR=frameDefs()}
function seed(){if(SCENE==='diag')seedDiag();else if(SCENE==='letter')seedLetter();else if(SCENE==='episode')seedEpisode();else seedMain()}
