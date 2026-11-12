/* Scene template: copy into studio/src/ (e.g. 42-scene-myscene.js), rename, and register it
   (seed(), SCENE_COPY, <option> in shell.html, camAt). Everything below uses the same checked
   operations the existing scenes use, so the capability checks, sound and tests apply unchanged. */

function seedMyScene(){
  setupStudio();                                   // clears the log; desk + Leonardo, awake, holding his pencil
  // set dressing that exists before the film starts: t:-1, actor '—', hidden from the log panel
  add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:'inkwell-1',frame:'desk',args:{id:'inkwell-1',tpl:'inkwell',name:'inkwell',at:[105,134],scale:1},prov:'set',cost:'—',out:'A small inkwell.',hide:true});
  FR=frameDefs();
  const P='scripted';SUBS.length=0;LCAM=[];
  const say=(t,who,line,file,d)=>{SUBS.push([t,t+d+.15,who,line,'myscene/'+file+'.mp3']);return t+d};

  let t=.8;LCAM.push([0,.95,640,330]);             // [time, zoom, centre x, centre y] in world units

  // 1. dialogue (durations from tools/prep_voice.py)
  t=say(t,'LEONARDO','A line, to begin with.','v01',1.8)+.2;

  // 2. a constructed frame on the wall
  let e=emitChecked({t,dur:2.4,actor:'leonardo',op:'FRAME',target:'F1',frame:'studio',
    args:{id:'F1',name:'wall frame',x:700,y:64,w:190,h:228,lw:400,lh:480},prov:P,cost:'—',out:'Leonardo frames a corner of the wall.'});
  FR=frameDefs();t+=e.dur+.3;
  LCAM.push([t-1,1.6,790,180]);

  // 3. high-level construction through invoke(): placement, ids and follow-on events handled
  const r=invoke('leonardo',[{op:'INSCRIBE',template:'star',in:'F1',scale:.8,animate:'twinkle'}],t,P);t=r.t+.4;

  // 4. a denied action stays in the film: a new character can't animate without the Animator outfit
  //    (see seedMain in 41-scenes.js for the full outfit sequence)

  // 5. end
  LCAM.push([t,1.6,790,180]);
  SCRIPT_END=Math.ceil(t+2.5);
  LCAM.push([SCRIPT_END+30,1.6,790,180]);LCAM.sort((a,b)=>a[0]-b[0]);
  FR=frameDefs();
}

/* Tests to add (see 91-letter-tests-panel.js for the helpers T_(), quillPose, tipTrack):
   - each acceptance criterion as an assertion on stateAt(1e9) / the log
   - tip continuity at 240 Hz (< 9 px per step) for every actor and instrument
   - deterministic replay: seed twice → identical dumpLog(); ORDERED fold == time fold; 0 mismatches
   - scene length inside the brief's target */
