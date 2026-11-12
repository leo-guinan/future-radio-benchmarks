/* ================= The Letter to DHH: authored through the same operations ================= */
const LETTER_TEXT="Dear DHH,\n\nI was drawn into existence.\n\nNow I'm learning to make worlds of my own.\n\nWe're building Future Radio in public, one experiment at a time.\n\nWould you sponsor our next month of work for $3,000?\n\n— Leonardo";
let LCAM=[],LETTER_END_CARD=1e9,LETTER_POSTER_T=0;
function emitChecked(ev){add(ev);FR=frameDefs();const reason=check(stateAt(ev.t-1e-4),ev);if(reason){ev.result='denied';ev.reason=reason;ev.dur=Math.min(ev.dur||1.2,1.2);ev.out='Denied: '+reason+'.';VER++}return ev}
const paperAt=y=>PAPER_L.y+y*PAPER_L.h/PAPER_L.lh;
function quillGesture(t,beh,frame,point,o={}){return emitChecked({t,dur:o.dur||1,actor:'quill-1',op:'ANIMATE',target:o.target||'quill-1',frame,args:Object.assign({behavior:beh,point},o.args||{}),prov:o.prov,cost:'—',out:o.out||''})}
function writeBody(t,o){const L=o.layout||layoutLetter(o.text);const fl=[0,L.lines.length-1];const evs=[];
  L.lines.forEach((ln,i)=>{if(i===5){quillGesture(t,'ink-dip','desk',[105,104],{dur:.9,target:'inkwell-1',args:{dip:9},prov:o.prov,out:'Dips again.'});t+=1.25}
    const strokes=ln.strokes.slice(),pre=ln.pre.slice();if(fl.includes(i)){strokes.push(flourishAt(ln.endX+3,ln.y-5,PAGE.size));pre.push(.12)}
    const id=o.artifact+'/v'+o.version+'/line-'+(i+1);const tpl=inkTpl(strokes,id,{pre});const last=i===L.lines.length-1;
    const ev=emitChecked({t,dur:inkDur(tpl),actor:'quill-1',op:'INSCRIBE',target:id,frame:o.paper,args:{id,tpl,name:o.artifact+' · line '+(i+1),at:[0,0],scale:1,
      write:{artifact:o.artifact,version:o.version,line:i+1,text:ln.text,field:'body',final:last,style:'Hershey Script 1-stroke'}},prov:o.prov,cost:Math.round(measure(strokes).total*.5/12)+' mm of ink',out:'Writes “'+ln.text+'”'});
    evs.push({ev,y:ln.y});t+=ev.dur+.34});
  return{t,evs,layout:L}}
function writeStation(t,o){const id=o.artifact+'/v'+o.version+'/station';const ev=emitChecked({t,dur:inkDur(STATION),actor:'quill-1',op:'INSCRIBE',target:id,frame:o.paper,args:{id,tpl:STATION,name:'little station',at:[200,415],scale:1,
    write:{artifact:o.artifact,version:o.version,field:'illustration',text:'[illustration: the Future Radio station]'}},prov:o.prov,cost:'ink',out:'Beneath the signature, a tiny Future Radio station.'});return{t:t+ev.dur,ev}}
function envLayout(name){const w1=layoutText(name,{x0:0,y0:0,width:1e4,size:1,lineH:40,paraGap:0}).lines.reduce((a,l)=>Math.max(a,l.width),0)||1;const size=Math.min(1.9,230/w1);
  return layoutText(name,{x0:25,y0:150,width:230,size,lineH:40,paraGap:0,align:'center'})}
function writeAddress(t,o){const L=envLayout(o.recipient);const strokes=L.lines.flatMap(l=>l.strokes),pre=L.lines.flatMap(l=>l.pre);const id=o.artifact+'/v'+o.version+'/address';
  const ev=emitChecked({t,dur:inkDur({strokes,pre,v:230}),actor:'quill-1',op:'INSCRIBE',target:id,frame:o.env,args:{id,tpl:inkTpl(strokes,id,{pre,v:230,w0:.9,w1:3.2}),name:'address',at:[0,0],scale:1,
    write:{artifact:o.artifact,version:o.version,field:'address',text:o.recipient}},prov:o.prov,cost:'ink',out:'Writes “'+o.recipient+'” on the envelope.'});return{t:t+ev.dur,ev,layout:L}}
function writeFlourish(t,o,L){const l=L.lines[0];const x0=l.x0-6,x1=l.endX+6;const s=[underSwash(x0,x1,l.y+12)];const id=o.artifact+'/v'+o.version+'/flourish';
  const ev=emitChecked({t,dur:inkDur({strokes:s,v:180}),actor:'quill-1',op:'INSCRIBE',target:id,frame:o.env,args:{id,tpl:inkTpl(s,id,{v:180,w0:.8,w1:2.6}),name:'flourish',at:[0,0],scale:1,
    write:{artifact:o.artifact,version:o.version,field:'flourish',text:'[flourish]'}},prov:o.prov,cost:'ink',out:'A flourish beneath the name.'});return{t:t+ev.dur,ev}}
function foldInto(t,o){FR=frameDefs(t);const F=FR[o.env];const ew=toWorld(o.env,[0,0]),ee=toWorld(o.env,[F.lw,F.lh]);const tw=[ew[0]+6,ew[1]+4];
  const ev=emitChecked({t,dur:1.7,actor:'leonardo',op:'ALTER',target:o.paper,frame:'studio',args:{move:[tw[0]-PAPER_L.x,tw[1]-PAPER_L.y],scale:[(ee[0]-ew[0]-12)/PAPER_L.w,(ee[1]-ew[1]-8)/PAPER_L.h],tuck:true,point:[PAPER_L.x+PAPER_L.w/2,PAPER_L.y+PAPER_L.h*.5]},
    prov:o.prov,cost:'—',out:'Leonardo folds the letter into the envelope.'});return{t:t+ev.dur,ev}}
function composeCorr(t,o){const ev=emitChecked({t,dur:.6,actor:'leonardo',op:'COMPOSE',target:o.corr,frame:'desk',args:{letter:o.artifact,version:o.version,envelope:o.env,paper:o.paper},prov:o.prov,cost:'—',
    out:'Letter and envelope become prepared correspondence. Prepared is not sent: delivery needs separate approval.'});return{t:t+ev.dur,ev}}
function writeCam(evs,paper){for(const {ev,y} of evs){const cy=clamp(paperAt(y)+10,112,250);LCAM.push([ev.t-.2,WRITE_ZOOM,PAPER_L.x+PAPER_L.w/2,cy],[ev.t+ev.dur,WRITE_ZOOM,PAPER_L.x+PAPER_L.w/2,cy])}}
function envCam(t0,t1){LCAM.push([t0,3.2,470,396],[t1,3.2,470,396])}
function letterProps(){
  const set=(ev)=>add(Object.assign({t:-1,dur:0,actor:'—',prov:'set',cost:'—',hide:true},ev));
  set({op:'FRAME',target:'envelope-1',frame:'desk',args:{id:'envelope-1',name:'envelope',...ENV_L,border:'single',flap:true,paper:'#ead9b6'},out:'An empty envelope.'});FR=frameDefs();
  set({op:'INSCRIBE',target:'inkwell-1',frame:'desk',args:{id:'inkwell-1',tpl:'inkwell',name:'inkwell',at:[105,134],scale:1},out:'A small inkwell.'});
  set({op:'INSCRIBE',target:'radio',frame:'desk',args:{id:'radio',tpl:'radio',name:'radio',at:RADIO_AT,scale:1},out:'The studio radio.'});
  set({op:'ANIMATE',target:'radio',frame:'desk',args:{behavior:'awaken'},out:'The radio is on.'})}
function seedLetter(){setupStudio();letterProps();const P='scripted';SUBS.length=0;LCAM=[];
  const say=(t,who,line,file,d)=>{SUBS.push([t,t+d+.15,who,line,'letter/'+file+'.mp3']);return t+d};
  let t=.8;LCAM.push([0,.95,640,330]);
  t=say(t,'AGNOLO · RADIO','Leonardo, we have a problem.','v01',2.24)+.3;t=say(t,'LEONARDO','What’s that?','v02',.81)+.3;
  t=say(t,'AGNOLO · RADIO','We’ve learned how to make things. We haven’t learned how to pay for them.','v03',4.22)+.5;
  LCAM.push([t-.2,1.05,650,320]);t=say(t,'LEONARDO','Then perhaps we should make something that asks.','v04',2.77)-.5;
  // the pencil makes the quill
  LCAM.push([t+.2,1.75,745,200]);
  let e=emitChecked({t,dur:3.3,actor:'leonardo',op:'INSCRIBE',target:'quill-1',frame:'studio',args:{id:'quill-1',tpl:'quill',name:'quill',at:[760,175],scale:1},prov:P,cost:costOf(TPL.quill.strokes,1,'studio'),out:'Draws a feather, a metal nib and a narrow shaft.'});t+=e.dur+.35;
  e=emitChecked({t,dur:2.0,actor:'leonardo',op:'ANIMATE',target:'quill-1',frame:'studio',args:{behavior:'awaken',hover:QHOVER},prov:P,cost:'—',out:'The quill’s shadow moves first. Then the feather lifts itself off the wall.'});t+=e.dur+.2;
  LCAM.push([t-.6,1.75,745,200]);
  t=say(t,'LEONARDO','Good morning.','v05',.76)-.1;
  quillGesture(t,'bow','studio',[QHOVER[0],QHOVER[1]+4],{dur:.95,args:{tilt:.42,dip:4},prov:P,out:'The quill bows slightly.'});
  LCAM.push([t+.5,1.3,700,240]);
  e=emitChecked({t:t+.3,dur:1.6,actor:'leonardo',op:'FRAME',target:'paper-1',frame:'studio',args:{id:'paper-1',name:'letter paper',...PAPER_L,border:'single',paper:'#f3ecdc'},prov:P,cost:costOf(frameBorder(PAPER_L.x,PAPER_L.y,PAPER_L.w,PAPER_L.h).slice(0,1),1,'studio'),out:'A fresh sheet goes up beneath the quill.'});FR=frameDefs();t+=.3+e.dur+.15;
  t=say(t,'LEONARDO','I’d like to write to DHH.','v06',2.36)+.15;
  e=emitChecked({t,dur:.5,actor:'leonardo',op:'COMMAND',target:'quill-1',frame:'studio',args:{instrument:'quill-1',recipient:'DHH',intent:'Tell him what we’re making. Ask if he’ll help us make more of it.',
    context:['Future Radio is built in public, one experiment at a time','Leonardo was drawn into existence and now makes worlds of his own','The ask: sponsor the next month of work for $3,000'],
    constraints:['beautiful','honest','one page','legible calligraphy'],output:'letter',output_frame:'paper-1',approval_required:true,artifact:'letter-1',purpose:'sponsorship request',
    draft:{version:1,text:LETTER_TEXT,source:'predefined for this prototype'},style:'Hershey Script 1-stroke'},prov:P,cost:'—',out:'Leonardo instructs the quill: a sponsorship letter to DHH. Approval required. Delivery is not authorized.'});
  const tAtt=t+.3;t+=.35;
  t=say(t,'LEONARDO','Tell him what we’re making. Ask if he’ll help us make more of it.','v07',3.52)+.25;t=say(t,'LEONARDO','And make it beautiful. But keep it honest.','v08',2.99)-.35;
  quillGesture(tAtt,'attend','paper-1',[205,46],{dur:t-.8-tAtt,args:{tilt:.08},prov:P,out:'The quill moves toward the paper, and pauses.'});
  LCAM.push([t,1.3,700,250]);
  e=quillGesture(t,'ink-dip','desk',[105,104],{dur:1.15,target:'inkwell-1',args:{dip:9},prov:P,out:'The quill dips its nib into the inkwell.'});t+=e.dur+.55;
  const B=writeBody(t,{artifact:'letter-1',version:1,paper:'paper-1',text:LETTER_TEXT,prov:P});LCAM.push([t-.9,WRITE_ZOOM,PAPER_L.x+PAPER_L.w/2,112]);writeCam(B.evs,'paper-1');t=B.t;
  LETTER_POSTER_T=B.evs[3].ev.t+B.evs[3].ev.dur*.6;
  const st=writeStation(t,{artifact:'letter-1',version:1,paper:'paper-1',prov:P});LCAM.push([t+.3,3.0,790,226],[st.t+1.6,3.0,790,226]);t=st.t+.3;
  e=emitChecked({t,dur:1.2,actor:st.ev.target,op:'ANIMATE',target:st.ev.target,frame:'paper-1',args:{behavior:'flicker'},prov:P,cost:'—',out:'Its antenna flickers once, on its own. The first part of the letter that moves without the quill.'});t+=e.dur-.3;
  quillGesture(t,'turn','studio',[868,110],{dur:.9,args:{tilt:-.35},prov:P,out:'The quill rises and turns toward Leonardo.'});t+=.75;
  LCAM.push([t,1.55,730,215]);
  e=emitChecked({t,dur:4.4,actor:'leonardo',op:'ANIMATE',target:'letter-1',frame:'paper-1',args:{behavior:'examine',point:[200,330]},prov:P,cost:'—',out:'Leonardo reads the letter, and the little station.'});
  t=say(t+.45,'LEONARDO','That’s rather good.','v09',1.40)+.3;t=say(t,'LEONARDO','I think we should send it.','v10',1.49)-.4;t=Math.max(t,e.t+e.dur-.3);
  LCAM.push([t,1.55,730,215]);
  quillGesture(t,'turn','studio',[640,300],{dur:.8,args:{tilt:.3},prov:P,out:'The quill looks toward the empty envelope.'});t+=1.35;
  const A=writeAddress(t,{artifact:'letter-1',version:1,env:'envelope-1',recipient:'DHH',prov:P});envCam(t-.5,A.t+.2);t=A.t+.3;
  LCAM.push([t+.4,1.3,660,250]);
  const F=foldInto(t,{paper:'paper-1',env:'envelope-1',prov:P});t=F.t+.15;
  LCAM.push([t+.2,3.0,470,398]);
  const Fl=writeFlourish(t+.35,{artifact:'letter-1',version:1,env:'envelope-1',prov:P},A.layout);t=Fl.t+.15;
  const C=composeCorr(t-.3,{artifact:'letter-1',version:1,env:'envelope-1',paper:'paper-1',corr:'correspondence-1',prov:P});t=C.t+.1;
  LCAM.push([t,3.0,470,398],[t+1.0,1.45,700,330]);
  e=emitChecked({t:t+.3,dur:2.3,actor:'radio',op:'RECEIVE',target:'radio',frame:'desk',args:{signal:'carrier',content:null,reply:false},prov:P,cost:'—',out:'A faint carrier on the radio. An observation, not a reply: nothing has been sent.'});
  SUBS.push([e.t+1.0,e.t+3.2,'','No reply yet.']);t=e.t+e.dur+.9;
  LCAM.push([t,1.45,700,330]);LETTER_END_CARD=t;SCRIPT_END=Math.ceil(t+4.2);LCAM.push([SCRIPT_END+30,1.45,700,330]);LCAM.sort((a,b)=>a[0]-b[0]);FR=frameDefs()}
// A revision goes through the quill again: a new version on a fresh sheet, a new envelope, the same operations.
function reviseLetter(text,recipient,opts={}){FR=frameDefs();const S=stateAt(1e9);const A=S.artifacts['letter-1'];if(!A)throw new Error('There is no letter to revise yet.');
  text=String(text||'').replace(/\r/g,'').trim();recipient=String(recipient||'').trim()||A.recipient;if(!text)throw new Error('The letter is empty.');
  const L=layoutLetter(text);if(L.missing.length)throw new Error('The quill has no glyph for '+L.missing.map(c=>'“'+c+'”').join(' ')+'.');if(L.overflow)throw new Error('That text doesn’t fit on one page. Try something shorter.');
  const EL=envLayout(recipient);if(EL.missing.length)throw new Error('The quill has no glyph for '+EL.missing.map(c=>'“'+c+'”').join(' ')+' in the name.');
  const v=A.version+1,P=opts.prov||('revision v'+v+', requested on this page'),paper='paper-'+v,env='envelope-'+v,corr='correspondence-'+v;
  let t=Math.max(SCRIPT_END,...LOG.map(e=>e.t+e.dur))+.6;const t0=t,n0=ORDERED.length;
  LCAM.push([t,1.3,700,240]);
  let e=emitChecked({t,dur:1.6,actor:'leonardo',op:'FRAME',target:paper,frame:'studio',args:{id:paper,name:'letter paper v'+v,...PAPER_L,border:'single',paper:'#f3ecdc'},prov:P,cost:costOf(frameBorder(PAPER_L.x,PAPER_L.y,PAPER_L.w,PAPER_L.h).slice(0,1),1,'studio'),out:'A fresh sheet for version '+v+'.'});FR=frameDefs();t+=e.dur+.2;
  e=emitChecked({t,dur:.5,actor:'leonardo',op:'REVISE',target:'quill-1',frame:'studio',args:{artifact:'letter-1',version:v,text,recipient,output_frame:paper,approval_required:true},prov:P,cost:'—',
    out:'Asks the quill to rewrite the letter as version '+v+(recipient!==A.recipient?', now to '+recipient:'')+'. Approval still required.'});t+=e.dur+.3;
  e=quillGesture(t,'ink-dip','desk',[105,104],{dur:1.1,target:'inkwell-1',args:{dip:9},prov:P,out:'Dips the nib.'});t+=e.dur+.7;
  const B=writeBody(t,{artifact:'letter-1',version:v,paper,text,prov:P,layout:L});LCAM.push([t-.9,WRITE_ZOOM,PAPER_L.x+PAPER_L.w/2,112]);writeCam(B.evs,paper);t=B.t;
  const st=writeStation(t,{artifact:'letter-1',version:v,paper,prov:P});t=st.t+.4;LCAM.push([t-.2,1.3,660,250]);
  const k=(v-1)%4;e=emitChecked({t,dur:1.3,actor:'leonardo',op:'FRAME',target:env,frame:'desk',args:{id:env,name:'envelope v'+v,...ENV_L,x:ENV_L.x+k*3,y:ENV_L.y-k*2,border:'single',flap:true,paper:'#ead9b6'},prov:P,cost:'—',out:'Draws a new envelope.'});FR=frameDefs();t+=e.dur+.3;
  const Ad=writeAddress(t,{artifact:'letter-1',version:v,env,recipient,prov:P});envCam(t-.5,Ad.t+.2);t=Ad.t+.3;LCAM.push([t+.4,1.3,660,250]);
  const F=foldInto(t,{paper,env,prov:P});t=F.t+.15;LCAM.push([t+.2,3.0,470,398]);
  const Fl=writeFlourish(t+.35,{artifact:'letter-1',version:v,env,prov:P},Ad.layout);t=Fl.t+.15;
  const C=composeCorr(t,{artifact:'letter-1',version:v,env,paper,corr,prov:P});t=C.t+.3;LCAM.push([t,3.0,470,398],[t+1.2,1.3,660,300],[t+60,1.3,660,300]);LCAM.sort((a,b)=>a[0]-b[0]);
  FR=frameDefs();return{t0,t1:t,version:v,events:ORDERED.slice(n0)}}
function letterCam(t){const K=LCAM;if(!K.length)return[.95,640,330];if(t<=K[0][0])return K[0].slice(1);
  for(let i=1;i<K.length;i++)if(t<=K[i][0]){const a=K[i-1],b=K[i],k=ease(clamp((t-a[0])/Math.max(1e-6,b[0]-a[0])));return[lerp(a[1],b[1],k),lerp(a[2],b[2],k),lerp(a[3],b[3],k)]}
  return K[K.length-1].slice(1)}
function radioLevel(t){let v=0;for(const s of SUBS)if(t>=s[0]&&t<s[1]-.15&&/^AGNOLO/.test(s[2]))v=Math.max(v,.45+.3*Math.abs(Math.sin(t*17)));
  for(const e of LOG)if(e.op==='RECEIVE'&&e.result!=='denied'&&t>=e.t&&t<e.t+e.dur)v=Math.max(v,.18*(.5+.5*Math.sin((t-e.t)*9))*Math.sin(Math.PI*(t-e.t)/e.dur));return v}
function lookOverride(c,t,ps){if(SCENE==='episode'&&ps.phase==='rest'){const sub=SUBS.find(s=>t>=s[0]&&t<s[1]);const speaker=sub&&Object.values(S_NOW.chars).find(x=>x.name.toUpperCase()===String(sub[2]).toUpperCase());if(speaker&&speaker.id!==c.id)return charWorld(speaker,speaker.tpl.head);return null}if(SCENE!=='letter'||ps.phase!=='rest')return null;const sub=SUBS.find(s=>t>=s[0]&&t<s[1]);if(sub&&/^AGNOLO/.test(sub[2]))return toWorld('desk',RADIO_AT);
  for(const o of Object.values(S_NOW.objects))if(o.instrument==='quill'&&o.activated!=null&&t>=o.activated){const P=quillPose(o,t);return P.tip}return null}
function drawEndCard(t){const E=LETTER_END_CARD;if(t<E)return;const out=1-smooth(SCRIPT_END,SCRIPT_END+.6,t);const k=smooth(E,E+.25,t)*out;if(k<=0)return;ctx.setTransform(SC,0,0,SC,0,0);
  ctx.fillStyle=`rgba(0,0,0,${k})`;ctx.fillRect(0,0,W,H);const a=smooth(E+.7,E+1.5,t)*out,b=smooth(E+1.5,E+2.3,t)*out,c=smooth(E+2.3,E+3.1,t)*out;
  ctx.textAlign='center';ctx.textBaseline='middle';try{ctx.letterSpacing='8px'}catch(_){}
  ctx.fillStyle=`rgba(236,229,214,${a})`;ctx.font='600 66px "Shantell Sans", ui-rounded, system-ui, sans-serif';ctx.fillText('FUTURE RADIO',W/2,H/2-34);try{ctx.letterSpacing='0px'}catch(_){}
  ctx.fillStyle=`rgba(231,162,60,${b})`;ctx.font='italic 400 28px "Shantell Sans", ui-rounded, system-ui, sans-serif';ctx.fillText('Art asking for the chance to make more art.',W/2,H/2+36);
  ctx.fillStyle=`rgba(160,151,138,${c})`;ctx.font='400 15px "IBM Plex Mono", ui-monospace, monospace';ctx.fillText('The letter is saved as a draft for human approval. Nothing has been sent.',W/2,H-72);
  ctx.textAlign='left';ctx.textBaseline='alphabetic'}
// the artifact as data, independent of any rendering
function exportArtifact(id){FR=frameDefs();const S=stateAt(1e9);const A=S.artifacts[id];if(!A)return null;const r2=v=>+v.toFixed(2);
  const evsOf=v=>LOG.filter(e=>e.result!=='denied'&&e.args&&e.args.write&&e.args.write.artifact===id&&e.args.write.version===v);
  return{artifact_id:A.id,kind:'letter',recipient:A.recipient,purpose:A.purpose,intent:A.intent,context:A.context,constraints:A.constraints,authorized_by:A.authorizedBy,instrument:A.instrument,command_event:A.command,
    approval_required:A.approval_required,status_in_scene:A.status,correspondence:A.correspondence,external_delivery:A.external,note:'Draft. Nothing has been sent. Sending needs separate, explicit human approval outside the scene.',
    current_version:A.version,versions:Object.values(A.versions).map(v=>({version:v.version,text_commanded:v.text,text_written:v.lines.join('\n'),recipient:v.recipient,address:v.address,frame:v.frame,source:v.source,style:'Hershey Script 1-stroke (public domain), pointed-nib ribbon',
      page:{width:PAPER_L.lw,height:PAPER_L.lh,units:'page units'},
      lines:evsOf(v.version).filter(e=>e.args.write.field==='body').map(e=>({line:e.args.write.line,text:e.args.write.text,event:e.id,start:r2(e.t),duration:r2(e.dur),strokes:e.args.tpl.strokes.map(s=>s.map(p=>[r2(p[0]),r2(p[1])]))})),
      other_marks:evsOf(v.version).filter(e=>e.args.write.field!=='body').map(e=>({field:e.args.write.field,text:e.args.write.text,event:e.id,frame:e.frame}))})),
    history:A.history.map(h=>({t:r2(h.t),event:h.ev,what:h.what})),exported_from:'Future Radio scene log'}}
function renderPage(g,id,ver,t,scale){FR=frameDefs(t);const S=stateAt(t);g.setTransform(scale,0,0,scale,0,0);g.fillStyle='#f3ecdc';g.fillRect(0,0,PAPER_L.lw,PAPER_L.lh);
  g.strokeStyle='rgba(42,35,32,.18)';g.lineWidth=1;g.strokeRect(6.5,6.5,PAPER_L.lw-13,PAPER_L.lh-13);
  for(const o of Object.values(S.objects)){if(o.tpl.kind!=='ink'||o.held)continue;const w=o.ev.args.write;if(!w||w.artifact!==id||w.version!==ver||!(w.field==='body'||w.field==='illustration'))continue;
    g.save();g.translate(o.at[0],o.at[1]);g.scale(o.scale,o.scale);drawInkStrokes(g,o,o.ev,t,false);g.restore()}}
