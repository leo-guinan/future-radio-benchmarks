/* The Benchmark Episode: authored scene-log staging, with source-linked dialogue. */
function benchmarkText(strokes,text,x,y,size=1,width=450){
  const laid=layoutText(text,{x0:x,y0:y,width,size,lineH:18*size,paraGap:0});
  if(laid.missing?.length||laid.overflow)throw new Error('Rivalry label does not fit: '+text);
  strokes.push(...laid.lines.flatMap(line=>line.strokes));
}
function benchmarkBoard(index){
  const strokes=[],fills=[],labels=[];
  const line=(x,y,u,v)=>strokes.push(Lp(x,y,u,v,5));
  const box=(x,y,w,h,color='#e3d4b8')=>{const p=RR(x,y,w,h,3);strokes.push(p);fills.push([p,color])};
  const text=(s,x,y,z=1)=>labels.push({text:s,x,y,size:12*z,width:Math.max(20,462-x)});
  const titles=['EVERYONE HAS A SCORE','THE COMMITTEE','THE MISSING MEASUREMENT','WHAT DOES AN EPISODE COST?','THE MINER','AN EPISODE MUST DO SOMETHING','BENCHMARK #000','THE INVITATION','THE RECEIPT'];
  text(titles[index],18,20,1.35);line(18,35,462,35);
  if(index===0){
    for(const [i,label] of ['MATH','CODE','STRAWBERRIES'].entries()){let x=20+i*150;box(x,54,138,85,['#b6c4c1','#d8b78c','#c8b4b2'][i]);text(label,x+8,78,.85);text('WINNER',x+18,115,1.25)}
    text('ACCORDING TO THEIR OWN TESTS',25,170,1.1);
  }else if(index===1){
    for(const [i,label] of ['LITERATURE','CREATIVITY','PROFIT'].entries()){let x=20+i*150;box(x,54,138,85);text(label,x+8,78,.85);text('?',x+57,117,2)}
    text('THREE INCOMPATIBLE SCORES',38,170,1.1);
  }else if(index===2){
    box(20,55,440,91,'#b6c4c1');text('INPUT: ONE REFERENCE SCRIPT',35,81,1.05);text('OUTPUT: ONE PLAYABLE EPISODE',35,116,1.05);text('A STANDARD UNIT. AN OPEN FUTURE.',20,171,1.04);
  }else if(index===3){
    text('COMPUTE   VOICES   MUSIC   EDITING',20,66,1.02);line(20,82,460,82);text('COST     QUALITY     REACH     GOAL',20,112,1.02);text('MEASURE HUMAN TIME SEPARATELY',20,170,1.08);
  }else if(index===4){
    box(20,55,160,91,'#a8bcbc');text('WORK',64,85,1.2);text('HAS A COST',34,120,1.04);line(191,100,270,100);box(280,55,180,91,'#d4b48d');text('INFERENCE',300,100,1.15);text('THIS CUT USES ELEVENLABS',20,170,1.1);
  }else if(index===5){
    for(let i=0;i<3;i++){let x=20+i*150;box(x,60,138,76,['#d7bb90','#b9c8c1','#bdb4c8'][i]);text(['EPISODE','OUTCOME','SUCCESSOR'][i],x+10,102,1)}
    text('RECORD THE GOAL. OBSERVE THE RESULT.',20,171,.98);
  }else if(index===6){
    text('1. MAKE IT      2. MEASURE IT',20,67,1.1);text('3. PUBLISH      4. INVITE A CHALLENGER',20,108,1.02);text('BASELINE FIRST. THEN TRY TO BEAT IT.',20,170,1.02);
  }else if(index===7){
    box(20,55,205,91,'#d4b48d');box(250,55,210,91,'#b6c4c1');text('A: SAME SCRIPT',30,85,1.05);text('LOWER COST?',30,118,1.05);text('B: ORIGINAL',260,85,1.05);text('BETTER OUTCOME?',260,118,1.03);text('SUBMIT EVIDENCE / NOV 22, 2026',20,171,1.03);
  }else{
    text('6,689 SYNTHESIS CREDITS',20,68,1.25);text('DOLLARS / HUMAN TIME / ENERGY: UNKNOWN',20,105,.98);text('PUBLICATION / FIRST CHALLENGER: PENDING',20,140,.92);text('THIS EPISODE WAS NOT FREE.',20,177,1.15);
  }
  return {kind:'drawing',key:'benchmark-board-'+index,strokes,fills,benchmarkLabels:labels,behaviors:[],pressure:.44};
}
function seedEpisode(){
  const spec=window.__FR_EPISODE_SPEC__;setupStudio();SUBS.length=0;EPISODE_SHOTS=[];
  const leo=LOG.find(e=>e.target==='leonardo'&&e.op==='INSCRIBE');leo.args.at=[520,418];
  add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:'borges',frame:'studio',args:{id:'borges',tpl:'borges',name:'Borges',at:[745,418],scale:.94,pencil:true,caps:ALL_CAPS},prov:'set',hide:true,out:'Borges is seated in the studio.'});
  add({t:-1,dur:0,actor:'borges',op:'ANIMATE',target:'borges',frame:'studio',args:{behavior:'wake'},prov:'set',hide:true,out:'Borges is awake.'});
  FR=frameDefs();
  const busy=[];
  for(const [index,scene] of spec.benchmarkScenes.entries()){
    const t=scene.start,id='benchmark-panel-'+index;TPL['benchmark-board-'+index]=benchmarkBoard(index);
    emitChecked({t:t+.5,dur:1.2,actor:'leonardo',op:'FRAME',target:id,frame:'studio',args:{id,name:scene.title,x:392,y:26,w:496,h:190,lw:480,lh:184,border:'single'},prov:'script-v1',out:'Leonardo constructs '+scene.title+'.'});FR=frameDefs();
    emitChecked({t:t+2.4,dur:1.4,actor:'leonardo',op:'INSCRIBE',target:'benchmark-drawing-'+index,frame:id,args:{id:'benchmark-drawing-'+index,tpl:'benchmark-board-'+index,name:scene.title,at:[0,0],scale:1},prov:'script-v1',out:'The shared drawing makes the scene visible.'});
    busy.push([t,t+4.5]);
  }
  for(const row of spec.dialogueTimeline){
    const actor=row.characterId;
    if(actor==='agnolo')continue;
    if(busy.some(([a,b])=>row.start<b&&row.start+.6>a))continue;
    const x=actor==='leonardo'?520:745;
    emitChecked({t:row.start,dur:Math.min(.7,(row.end-row.start)*.5),actor,op:'ANIMATE',target:actor,frame:'studio',args:{behavior:'speak',point:[x+(row.sequence%2?65:85),320+(row.sequence%3)*16],sourceEventId:row.eventId},prov:'script-v1',out:actor+' speaks '+row.eventId+'.'});
  }
  for(const cap of spec.captions){
    const row=spec.dialogueTimeline.find(r=>r.eventId===cap.eventId);
    SUBS.push([cap.start,cap.end,cap.speaker,cap.text,null,row.eventId,row.characterId==='agnolo'?null:row.characterId,row.wordTimings]);
  }
  SCRIPT_END=spec.duration;FR=frameDefs();
}
function episodeCam(t){
  const spec=window.__FR_EPISODE_SPEC__,scene=spec.benchmarkScenes.find(s=>t>=s.start&&t<s.end)||spec.benchmarkScenes.at(-1);
  const age=t-scene.start;
  // Hold each construction in a readable insert, then use speaker/reaction cuts.
  if(age<4.5)return[1.65,640,139];
  if(t>spec.duration-5)return[1.5,640,139];
  const row=spec.dialogueTimeline.find(r=>t>=r.start&&t<r.end);
  if(!row)return[1.14,640,285];
  const pos=spec.dialogueTimeline.indexOf(row);
  if(pos%5===0)return[1.14,640,285];
  if(pos%5===4)return[1.65,640,139];
  if(row.characterId==='agnolo')return[1.7,785,363];
  return row.characterId==='leonardo'?[1.65,530,320]:[1.65,740,320];
}
const benchmarkOriginalLamp=drawLamp;
drawLamp=function(){if(SCENE!=='episode')benchmarkOriginalLamp()};

// Labels are semantic data on the constructed object, rendered from replayed state.
const benchmarkOriginalObject=drawObject;
drawObject=function(o,t){
  benchmarkOriginalObject(o,t);
  if(!o.tpl.benchmarkLabels||o.prog<.97)return;
  const origin=objWorld(o,[0,0],t),scale=frameScale(o.frame)*o.scale;
  ctx.save();ctx.translate(origin[0],origin[1]);ctx.scale(scale,scale);
  ctx.fillStyle='#332c24';ctx.textBaseline='alphabetic';
  for(const label of o.tpl.benchmarkLabels){
    ctx.font='600 '+label.size+'px "IBM Plex Mono", monospace';
    ctx.fillText(label.text,label.x,label.y,label.width);
  }
  ctx.restore();
};
const benchmarkOriginalLight=drawLight;
drawLight=function(){if(SCENE!=='episode')benchmarkOriginalLight()};
