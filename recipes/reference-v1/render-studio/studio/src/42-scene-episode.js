/* ================ Episode scene adapter: script events -> Studio operation log ================ */
const EPISODE_CAM=[];
let EPISODE_SHOTS=[];
function episodeShotAt(t){
  if(!EPISODE_SHOTS.length)return null;
  return EPISODE_SHOTS.find(s=>t>=s.startSeconds&&t<s.endSeconds)||EPISODE_SHOTS[EPISODE_SHOTS.length-1];
}
function episodeCharacterOrigin(c,t){
  const shot=episodeShotAt(t), p=shot&&shot.blocking&&shot.blocking[c.id];
  return p?[p.x*12.8,p.y*7.2]:c.at;
}
function episodeCharacter(kind){
  if(kind==='borges')return{kind:'character',key:'borges',strokes:[
    Qb([-38,-148],[-34,-202],[0,-201],16),Qb([0,-201],[38,-202],[40,-150],16),Qb([-39,-147],[-45,-126],[-35,-105],10),Qb([40,-150],[48,-125],[35,-105],10),
    Qb([-38,-146],[-22,-173],[0,-163],12),Qb([0,-163],[24,-174],[40,-146],12),
    Qb([-32,-132],[-17,-139],[-4,-131],8),Qb([4,-131],[20,-139],[34,-132],8),
    Ci(-18,-127,11,18),Ci(18,-127,11,18),Lp(-7,-127,7,-127,3),Lp(-30,-142,-43,-149,4),Lp(30,-142,43,-149,4),
    Lp(0,-118,-3,-100,4),Qb([-3,-100],[4,-94],[9,-101],5),
    Qb([-30,-100],[-21,-111],[-8,-106],8),Qb([-8,-106],[3,-112],[16,-105],8),Qb([16,-105],[29,-109],[32,-94],8),
    Qb([-31,-94],[-23,-75],[0,-74],12),Qb([0,-74],[24,-73],[32,-94],12),
    RR(-39,-78,78,79,9),Qb([-39,-70],[-64,-42],[-68,0],12),Qb([39,-70],[64,-42],[68,0],12),
    Qb([-36,-10],[-48,7],[-59,14],8),Qb([36,-10],[48,7],[59,14],8),Lp(-28,0,-30,27,5),Lp(27,0,30,27,5)
  ],fills:[[RR(-39,-78,78,79,9),'#657d82'],[[[-39,-78],[-20,-92],[0,-77],[19,-92],[39,-78],[30,-4],[-30,-4]],'#8c8778'],[[[-38,-145],[-31,-180],[0,-195],[37,-164],[40,-145],[11,-157],[-7,-151]],'#aaa397'],[[[-31,-94],[-23,-75],[0,-74],[24,-73],[32,-94],[20,-108],[0,-101],[-16,-108]],'#ece4d4']],eyes:[[-18,-127],[18,-127]],mouth:[0,-97],shoulder:[38,-67],rest:[72,23],head:[0,-137],bbox:[-70,-205,75,32],behaviors:[],pressure:.63};
  if(kind==='agnolo')return{kind:'character',key:'agnolo',strokes:[
    Qb([-39,-148],[-36,-201],[0,-202],16),Qb([0,-202],[40,-200],[42,-148],16),Qb([-39,-148],[-47,-127],[-35,-105],10),Qb([41,-148],[48,-124],[35,-104],10),
    Qb([-39,-150],[-29,-184],[-3,-174],12),Qb([-3,-174],[20,-184],[40,-151],12),
    Qb([-31,-132],[-18,-139],[-5,-132],8),Qb([5,-132],[20,-138],[33,-131],8),
    Qb([-29,-140],[-18,-145],[-6,-140],6),Qb([6,-140],[20,-145],[31,-139],6),
    Lp(0,-125,-2,-105,4),Qb([-2,-105],[5,-100],[10,-106],5),
    Qb([-29,-99],[-19,-108],[-6,-102],8),Qb([-6,-102],[5,-110],[17,-102],8),Qb([17,-102],[27,-108],[31,-96],8),
    Qb([-34,-94],[-24,-73],[0,-73],12),Qb([0,-73],[24,-73],[34,-94],12),
    RR(-43,-78,86,81,10),Qb([-42,-65],[-63,-34],[-68,0],12),Qb([42,-65],[63,-34],[68,0],12),
    Qb([-38,-8],[-47,9],[-59,15],8),Qb([38,-8],[47,9],[59,15],8),Lp(-29,0,-31,27,5),Lp(29,0,31,27,5)
  ],fills:[[RR(-43,-78,86,81,10),'#838366'],[[[-43,-78],[-20,-92],[0,-78],[20,-92],[43,-78],[32,-3],[-32,-3]],'#a67e5f'],[[[-39,-149],[-34,-184],[-7,-187],[1,-176],[26,-183],[42,-148],[11,-158],[-9,-152]],'#514a43'],[[[-34,-94],[-24,-73],[0,-73],[24,-73],[34,-94],[22,-108],[0,-102],[-18,-108]],'#81634f']],eyes:[[-18,-130],[18,-130]],mouth:[0,-99],shoulder:[42,-67],rest:[75,23],head:[0,-138],bbox:[-70,-205,75,32],behaviors:[],pressure:.66};
  if(kind==='eval')return{kind:'character',key:'eval',strokes:[
    RR(-39,-197,78,77,13),Poly([[-39,-170],[-32,-193],[-10,-204],[8,-198],[34,-190],[39,-169],[22,-180],[7,-176],[-7,-183],[-23,-174]],6),
    RR(-31,-164,26,21,4),RR(5,-164,26,21,4),Lp(-5,-154,5,-154,3),Lp(-37,-157,-44,-160,3),Lp(31,-157,40,-161,3),
    Qb([-24,-173],[-16,-178],[-8,-173],5),Qb([8,-177],[18,-171],[25,-174],5),Lp(-8,-123,8,-123,4),
    Poly([[-43,-94],[-28,-105],[0,-98],[28,-105],[43,-94],[34,1],[-34,1]],7),
    Lp(-42,-76,-58,-44,5),Lp(-58,-44,-69,-49,4),Lp(42,-76,58,-45,5),Lp(58,-45,69,-53,4),
    Poly([[-10,-92],[0,-78],[10,-92],[5,-28],[-5,-28]],4),Lp(-24,-39,24,-39,3),
    Lp(-25,1,-27,27,5),Lp(25,1,27,27,5)
  ],fills:[[RR(-39,-197,78,77,13),'#c8c2b5'],[Poly([[-39,-170],[-32,-193],[-10,-204],[8,-198],[34,-190],[39,-169],[22,-180],[7,-176],[-7,-183],[-23,-174]],6),'#4e5964'],[Poly([[-43,-94],[-28,-105],[0,-98],[28,-105],[43,-94],[34,1],[-34,1]],7),'#667985'],[RR(-31,-164,26,21,4),'#eee7d8'],[RR(5,-164,26,21,4),'#eee7d8']],eyes:[[-18,-153],[18,-153]],mouth:[0,-130],shoulder:[40,-72],rest:[72,23],head:[0,-158],bbox:[-73,-207,146,238],behaviors:[],pressure:.62};
  // Supporting cast get silhouettes and visual motifs tied to their roles. These are
  // deliberately built from the same replayable vector primitives as the main cast.
  if(kind==='robot-one')return{kind:'character',key:kind,strokes:[
    Poly([[-49,-151],[-42,-192],[-12,-203],[28,-195],[47,-164],[42,-121],[22,-103],[-27,-104],[-47,-123],[-49,-151]],8),
    RR(-58,-91,116,93,5),Lp(-35,-76,35,-76,4),Lp(-31,-55,31,-55,4),Lp(-25,-30,25,-30,4),
    Lp(-48,-72,-66,-43,5),Lp(-66,-43,-77,-55,5),Ci(-78,-60,7,12),Lp(48,-72,68,-45,5),Lp(68,-45,80,-52,5),Ci(82,-56,7,12),
    Lp(-31,2,-35,27,5),Lp(31,2,35,27,5),Lp(-38,-165,38,-165,4),Lp(-39,-156,39,-156,4)
  ],fills:[[Poly([[-49,-151],[-42,-192],[-12,-203],[28,-195],[47,-164],[42,-121],[22,-103],[-27,-104],[-47,-123]],8),'#9babb0'],[RR(-58,-91,116,93,5),'#54727b'],[Ci(-18,-143,9,12),'#e8bd62'],[Ci(18,-143,9,12),'#e8bd62']],eyes:[[-18,-143],[18,-143]],mouth:[0,-121],shoulder:[55,-68],rest:[88,23],head:[0,-151],bbox:[-85,-207,170,238],behaviors:[],pressure:.63};
  if(kind==='robot-two')return{kind:'character',key:kind,strokes:[
    RR(-43,-199,86,72,13),RR(-34,-185,68,43,5),Lp(0,-214,0,-200,4),Ci(0,-217,5,12),
    RR(-50,-104,100,106,7),Lp(-37,-83,37,-83,4),Lp(-30,-55,30,-55,4),Lp(-24,-26,24,-26,4),
    Lp(-46,-79,-59,-49,5),Lp(46,-79,59,-49,5),Lp(-28,2,-30,28,5),Lp(28,2,30,28,5),
    Lp(-22,-165,22,-165,3),Lp(-22,-157,22,-157,3),Lp(-22,-149,22,-149,3)
  ],fills:[[RR(-43,-199,86,72,13),'#555d70'],[RR(-34,-185,68,43,5),'#d5d0c1'],[RR(-50,-104,100,106,7),'#767b89'],[Ci(0,-163,8,12),'#bd7253']],eyes:[],mouth:[0,-163],shoulder:[49,-68],rest:[72,23],head:[0,-163],bbox:[-62,-222,124,252],behaviors:[],pressure:.6};
  if(kind==='the-little-pilot')return{kind:'character',key:kind,strokes:[
    Poly([[-31,-144],[-24,-183],[0,-199],[25,-181],[31,-144],[23,-117],[-22,-117],[-31,-144]],8),
    Poly([[-31,-144],[-5,-158],[31,-144],[23,-117],[-22,-117]],6),
    Ci(-11,-139,3,10),Ci(11,-139,3,10),Lp(-7,-110,0,-104,3),Lp(0,-104,7,-110,3),
    Poly([[-25,-116],[25,-116],[34,-43],[0,-31],[-34,-43],[-25,-116]],7),
    Lp(-24,-101,-43,-74,4),Lp(-43,-74,-50,-61,4),Lp(24,-101,42,-78,4),Lp(42,-78,47,-62,4),
    Lp(-18,-37,-20,-9,4),Lp(18,-37,20,-9,4),Lp(-20,-9,-28,-8,4),Lp(20,-9,28,-8,4),
    Poly([[-25,-165],[0,-189],[25,-165]],5),Ci(0,-72,7,12)
  ],fills:[[Poly([[-31,-144],[-24,-183],[0,-199],[25,-181],[31,-144],[23,-117],[-22,-117]],8),'#e3d6b8'],[Poly([[-31,-144],[-5,-158],[31,-144],[23,-117],[-22,-117]],6),'#bf7652'],[Poly([[-25,-116],[25,-116],[34,-43],[0,-31],[-34,-43]],7),'#e3d6b8'],[Ci(0,-72,7,12),'#bd9250']],eyes:[[-11,-139],[11,-139]],mouth:[0,-110],shoulder:[27,-92],rest:[52,4],head:[0,-152],bbox:[-53,-202,106,206],behaviors:[],pressure:.6};
  if(kind==='door')return{kind:'character',key:kind,strokes:[
    RR(-42,-202,84,204,8),RR(-32,-188,64,176,4),Ci(20,-98,4,10),RR(-16,-153,30,20,2),
    Lp(-14,-145,13,-145,3),Lp(-14,-139,13,-139,3),Lp(-14,-133,8,-133,3),
    Ci(-13,-168,3,10),Ci(13,-168,3,10),Lp(-7,-119,7,-119,3),
    Lp(-46,-187,-46,-10,4),Ci(-47,-194,4,10)
  ],fills:[[RR(-42,-202,84,204,8),'#8b644f'],[RR(-32,-188,64,176,4),'#c5a77a'],[RR(-16,-153,30,20,2),'#e5d7ba'],[Ci(20,-98,4,10),'#d8bd79']],eyes:[[-13,-168],[13,-168]],mouth:[0,-119],shoulder:[43,-80],rest:[55,20],head:[0,-164],bbox:[-52,-207,108,214],behaviors:[],pressure:.62};
  return{kind:'character',key:kind,strokes:[
    Qb([-39,-148],[-36,-201],[0,-202],16),Qb([0,-202],[40,-200],[42,-148],16),Qb([-39,-148],[-47,-127],[-35,-105],10),Qb([41,-148],[48,-124],[35,-104],10),
    Qb([-37,-149],[-27,-183],[0,-177],14),Qb([0,-177],[28,-184],[40,-148],14),
    Qb([-30,-133],[-17,-139],[-5,-132],8),Qb([5,-132],[20,-139],[33,-131],8),Lp(0,-125,1,-107,4),
    Qb([-34,-99],[-22,-109],[-8,-103],8),Qb([-8,-103],[5,-111],[18,-103],8),Qb([18,-103],[29,-109],[33,-96],8),
    RR(-41,-79,82,80,9),Qb([-40,-67],[-64,-34],[-68,0],12),Qb([40,-67],[64,-34],[68,0],12),
    Qb([-38,-8],[-47,9],[-59,15],8),Qb([38,-8],[47,9],[59,15],8),Lp(-29,0,-31,27,5),Lp(29,0,31,27,5)
  ],fills:[[RR(-41,-79,82,80,9),'#697d7b'],[[[-41,-79],[-20,-93],[0,-79],[20,-93],[41,-79],[31,-2],[-31,-2]],'#c0a178'],[[[-39,-148],[-32,-181],[-5,-190],[3,-177],[28,-184],[42,-148],[11,-158],[-10,-151]],'#5a5147']],eyes:[[-18,-131],[18,-131]],mouth:[0,-100],shoulder:[40,-67],rest:[73,23],head:[0,-138],bbox:[-70,-205,75,32],behaviors:[],pressure:.62};
}
const BORGES_TPL=episodeCharacter('borges'),AGNOLO_TPL=episodeCharacter('agnolo');
// Give the writers' room leads a few recognizable, repeatable character cues.
BORGES_TPL.strokes.push(Lp(-18,-156,-18,-145,3),Lp(18,-156,18,-145,3),Qb([-30,-157],[-18,-165],[-6,-158],5),Qb([6,-158],[18,-165],[30,-157],5),Lp(-22,-67,-3,-32,4),Lp(22,-67,3,-32,4));
AGNOLO_TPL.strokes.push(Poly([[-9,-91],[0,-78],[9,-91],[5,-30],[-5,-30]],4),Lp(-18,-47,18,-47,3),Lp(-18,-39,18,-39,3),Lp(-17,-31,17,-31,3));
TPL.borges=BORGES_TPL;TPL.agnolo=AGNOLO_TPL;TPL.borges.key='borges';TPL.agnolo.key='agnolo';
TPL.leonardo.mouth=[0,-119];
TPL.leonardo.strokes.push(Ci(2,-62,7,14),Lp(-6,-88,0,-83,3),Lp(0,-83,6,-88,3));

const MESSAGE_TPL=(()=>{const glyph=layoutText('ANNALEA',{x0:-33,y0:-17,width:68,size:.48,lineH:12,paraGap:0,align:'center'});
  return{kind:'drawing',key:'annalea-message',strokes:[RR(-54,-43,108,86,3),Lp(-38,4,37,4,7),Lp(-38,14,31,14,6),...glyph.lines.flatMap(l=>l.strokes)],
    fills:[[RR(-54,-43,108,86,3),'#f6efd9']],behaviors:[],pressure:.4}})();
const LEDGER_TPL={kind:'drawing',key:'ledger',strokes:[RR(-48,-58,96,116,4),Lp(-33,-45,-33,45,8),Lp(-24,-34,34,-34,5),Lp(-24,-19,27,-19,5),Lp(-24,-4,33,-4,5),Lp(-24,11,21,11,4),Lp(-24,27,31,27,5),Lp(-42,-41,-42,39,10)],fills:[[RR(-48,-58,96,116,4),'#c9b28c']],behaviors:['sway'],pivot:[0,50],pressure:.5};
const BOOK_TPL={kind:'drawing',key:'book-stack',strokes:[RR(-43,-20,84,23,2),Lp(-30,-18,-30,1,5),RR(-37,-43,78,23,2),Lp(26,-42,26,-21,5),RR(-48,-65,81,22,2),Lp(-35,-63,-35,-44,5)],fills:[[RR(-43,-20,84,23,2),'#a97755'],[RR(-37,-43,78,23,2),'#74868a'],[RR(-48,-65,81,22,2),'#c6ab79']],behaviors:[],pressure:.55};
const PLANE_TPL={kind:'drawing',key:'flying-show-plane',strokes:[Qb([-55,0],[-12,-14],[43,-3],10),Qb([43,-3],[57,0],[44,4],6),Lp(-8,-2,-22,-34,7),Lp(-22,-34,8,-30,5),Lp(2,-1,24,-24,6),Lp(24,-24,34,-19,4),Lp(-38,-1,-51,-19,5),Lp(-51,-19,-40,-15,4),Lp(50,0,62,-10,4),Lp(50,0,62,10,4),Ci(-38,0,4,10)],fills:[[[[-45,-2],[-10,-8],[39,-3],[47,1],[38,4],[-45,3]],'#bc7048'],[[[-9,-2],[-22,-32],[6,-29],[20,-3]],'#d4b26e'],[[[2,-1],[24,-22],[32,-18],[26,1]],'#9aac9a']],behaviors:['drift'],pivot:[-38,0],pressure:.55};
const PRINTER_TPL={kind:'drawing',key:'antique-printer',strokes:[RR(-58,-42,116,75,4),RR(-43,-32,86,38,2),Lp(-37,-22,36,-22,5),Lp(-37,-13,30,-13,5),Lp(-37,-4,24,-4,5),Qb([-40,32],[-31,45],[-20,46],6),Qb([40,32],[31,45],[20,46],6)],fills:[[RR(-58,-42,116,75,4),'#95856d'],[RR(-43,-32,86,38,2),'#efe7d6']],behaviors:[],pressure:.5};
const CLOCK_TPL={kind:'drawing',key:'studio-clock',strokes:[Ci(0,0,47,36),Ci(0,0,2,8),Lp(0,0,-3,-27,5),Lp(0,0,21,10,5),...Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return Lp(Math.cos(a)*38,Math.sin(a)*38,Math.cos(a)*43,Math.sin(a)*43,2)})],fills:[[Ci(0,0,47,36),'#ede5d6']],behaviors:[],pressure:.45};
TPL.annaleaMessage=MESSAGE_TPL;TPL.ledger=LEDGER_TPL;TPL.bookStack=BOOK_TPL;TPL.pilotPlane=PLANE_TPL;TPL.antiquePrinter=PRINTER_TPL;TPL.clock=CLOCK_TPL;

// The room's television is a miniature picture frame. Each frozen scene gets a
// compact, hand-drawn thumbnail of its subject; no generated image is needed.
function episodeTvTemplate(sceneId,castIds){
  const frame=RR(-62,-42,124,84,4),screen=RR(-53,-33,106,66,2);
  const strokes=[frame,screen,Lp(-18,43,-18,48,4),Lp(18,43,18,48,4),Lp(-25,48,25,48,5)];
  const fills=[[frame,'#75634e'],[screen,'#d4d0bd']];
  const line=(...args)=>strokes.push(Lp(...args));
  const dot=(x,y,r=5,c='#c47744')=>{const p=Ci(x,y,r,r);strokes.push(p);fills.push([p,c])};
  const poly=(points,c)=>{const p=Poly(points,3);strokes.push(p);fills.push([p,c])};
  // Keep every motif inside the inner screen (x -49..49, y -29..29).
  switch(sceneId){
    case 'scene-01': // discovery: a game appears on the broadcast
      line(-44,15,44,15,3);line(-44,-12,44,-12,3);line(-44,-12,-44,15,3);line(44,-12,44,15,3);dot(0,0,8,'#c47744');break;
    case 'scene-02': // scorekeeping
      line(-36,-15,36,-15,4);line(-36,-3,24,-3,4);line(-36,9,30,9,4);line(-36,21,14,21,4);break;
    case 'scene-03': // unknown stars
      dot(-23,8,9,'#8f8062');dot(22,8,9,'#8f8062');dot(-24,-14,3,'#c47744');dot(23,-17,3,'#c47744');line(-38,20,38,20,3);break;
    case 'scene-04': // replay tape
      dot(-19,0,12,'#9a7550');dot(19,0,12,'#9a7550');dot(-19,0,4,'#d4d0bd');dot(19,0,4,'#d4d0bd');line(-7,0,7,0,4);break;
    case 'scene-05': // draft board
      line(-34,-20,-34,20,4);line(-34,-17,31,-17,4);line(-34,0,23,0,4);line(-34,17,32,17,4);dot(33,-17,4,'#c47744');break;
    case 'scene-06': // open field / no franchise
      line(-40,18,40,18,3);line(-32,18,-32,-14,4);line(-32,-14,8,-14,4);line(8,-14,8,18,4);line(8,18,39,-7,3);break;
    case 'scene-07': // story market
      line(-38,20,-38,-13,4);line(-38,20,39,20,4);poly([[-30,12],[-13,-4],[0,5],[18,-17],[32,-10],[35,-2],[17,-8],[0,13],[-13,4],[-30,19]],'#9a7550');break;
    case 'scene-08': // dressing room
      for(const x of [-25,0,25]){dot(x,-7,7,x===0?'#c47744':'#8f8062');line(x,-1,x,17,4);line(x-8,20,x+8,20,3)}break;
    case 'scene-09': // duck / camera frame
      line(-39,-19,39,-19,3);line(-39,19,39,19,3);line(-39,-19,-39,19,3);line(39,-19,39,19,3);dot(0,4,11,'#c7a65f');dot(12,2,4,'#c47744');break;
    case 'scene-10': // committee: several review cards
      for(const x of [-24,0,24]){const p=RR(x-10,-17,20,34,2);strokes.push(p);fills.push([p,'#e6ddc9']);line(x-5,7,x+5,7,2);line(x-5,13,x+3,13,2)}break;
    case 'scene-11': // compression: many pages become one frame
      for(let i=0;i<4;i++){const p=RR(-33+i*8,-20+i*5,60,39,2);strokes.push(p);fills.push([p,i===3?'#d5bd91':'#b6ad9b'])}line(-25,0,25,0,4);break;
    case 'scene-12': // first broadcast
      dot(0,0,10,'#c47744');for(const x of [-24,24]){line(x,-14,x,14,3);line(x<0?x+4:x-4,-9,x<0?x+4:x-4,9,2)}line(-40,22,40,22,3);break;
    default: // scouting report: field notes and a discovered mark
      const card=RR(-35,-21,70,42,2);strokes.push(card);fills.push([card,'#e6ddc9']);line(-25,-11,8,-11,3);line(-25,-2,22,-2,3);line(-25,7,4,7,3);dot(20,12,5,'#c47744');
  }
  // Reuse the cast's actual vector designs as tiny figures, so the inset reads
  // like a compressed scene instead of a generic status icon.
  const miniCast=[...new Set(castIds||[])].slice(0,2),miniScale=miniCast.length>1?.145:.18;
  miniCast.forEach((id,i)=>{
    const mini=episodeCharacter(id),cx=miniCast.length>1?(i===0?-24:24):0,cy=12;
    const transform=path=>path.map(([x,y])=>[cx+x*miniScale,cy+y*miniScale]);
    for(const path of mini.strokes)strokes.push(transform(path));
    for(const [path,color] of mini.fills)fills.push([transform(path),color]);
  });
  return{kind:'drawing',key:'episode-tv-'+sceneId,strokes,fills,behaviors:[],pressure:.48};
}

function episodeEvent(t,dur,actor,op,target,args,out,prov='episode-script'){
  const ev={t,dur,actor,op,target,frame:'studio',args,prov,cost:'—',out};
  if(typeof emitChecked==='function')return emitChecked(ev);
  add(ev);return ev;
}
function episodeCam(t){
  const shot=episodeShotAt(t);if(!shot)return[.86,640,370];
  const zoom={wide:.86,medium:1.14,close:1.65,insert:1.8,over_shoulder:1.2}[shot.framing]||.95;
  const focus=shot.focus||{x:50,y:50}, cx=focus.x*12.8, cy=focus.y*7.2;
  if(shot.movement==='locked')return[zoom,cx,cy];
  const elapsed=Math.max(0,t-shot.startSeconds), k=smooth(0,Math.min(.7,shot.endSeconds-shot.startSeconds),elapsed);
  const index=EPISODE_SHOTS.indexOf(shot),from=index>0?EPISODE_SHOTS[index-1]:null;
  const start=from&&from.focus?from.focus:{x:50,y:50};
  return[zoom,lerp(start.x*12.8,cx,k),lerp(start.y*7.2,cy,k)];
}
function seedEpisode(){
  const spec=window.__FR_EPISODE_SPEC__;if(!spec)throw new Error('Episode renderer requires a frozen scene plan');
  setupStudio();SUBS.length=0;LCAM=[];EPISODE_CAM.length=0;EPISODE_SHOTS=(spec.scene.shots||[]).slice().sort((a,b)=>a.startSeconds-b.startSeconds);
  const P='script '+spec.scriptArtifactId;const byId=Object.fromEntries(spec.characters.map(c=>[c.id,c]));
  const visualMap=spec.visualCharacterMap||Object.fromEntries(spec.scene.characterIds.map(cid=>[cid,cid]));
  const cast=[...new Set(spec.scene.characterIds.map(cid=>visualMap[cid]).filter(Boolean))];
  if(!cast.includes('leonardo')){LOG=LOG.filter(e=>e.actor!=='leonardo'&&e.target!=='leonardo');ORDERED=LOG.slice();VER++}
  const positions={};const spacing=cast.length>1?Math.min(205,920/(cast.length-1)):0;const left=640-spacing*(cast.length-1)/2;
  cast.forEach((cid,i)=>{positions[cid]=[left+i*spacing,418]});
  // setupStudio seeds Leonardo at a fixed desk mark. Move that seed with the cast
  // layout so it cannot overlap another character when the cast is centered.
  const leonardoSeed=LOG.find(e=>e.op==='INSCRIBE'&&e.target==='leonardo');
  if(leonardoSeed&&positions.leonardo)leonardoSeed.args.at=positions.leonardo;
  for(const cid of cast){if(cid==='leonardo'||!byId[cid])continue;const c=byId[cid],at=positions[cid];
    if(!TPL[cid]){TPL[cid]=episodeCharacter(cid);TPL[cid].key=cid}
    add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:cid,frame:'studio',args:{id:cid,tpl:cid,name:c.name,at,scale:.88,pencil:true,caps:ALL_CAPS},prov:'cast',cost:'—',out:c.description||c.name,hide:true});
    add({t:-.8,dur:.8,actor:cid,op:'ANIMATE',target:cid,frame:'studio',args:{behavior:'wake'},prov:'cast',cost:'—',out:c.name+' wakes into the scene.',hide:true});}
  // The room is set dressing. Story actions and all character-created objects below stay in the log.
  const tvTplKey='episodeTv_'+spec.scene.sceneId;TPL[tvTplKey]=episodeTvTemplate(spec.scene.sceneId,cast);
  episodeEvent(-1,0,'—','INSCRIBE','studio-tv',{id:'studio-tv',tpl:tvTplKey,name:'episode television',at:[320,318],scale:1.05,sourceScriptArtifactId:spec.scriptArtifactId,sourceSceneId:spec.scene.sceneId},'The television shows a compressed drawing of '+spec.scene.sceneTitle+'.',P);
  add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:'deadline-clock',frame:'studio',args:{id:'deadline-clock',tpl:'clock',name:'deadline clock',at:[872,144],scale:.72},prov:'set',cost:'—',out:'A clock that keeps time.',hide:true});
  add({t:-1,dur:0,actor:'—',op:'INSCRIBE',target:'message-bell',frame:'studio',args:{id:'message-bell',tpl:'bell',name:'notification bell',at:[844,260],scale:.58},prov:'set',cost:'—',out:'A small notification bell.',hide:true});
  FR=frameDefs();
  const d=spec.dialogueTimeline;for(const row of d){const name=(byId[row.characterId]||{}).name||row.characterId.toUpperCase();const visualId=visualMap[row.characterId]||null;
    const caption=row.text.replace(/\[[^\]]*\]/g,' ').replace(/---/g,' ').replace(/\s+/g,' ').trim();
    if(caption)SUBS.push([row.start,row.end,name,caption,null,row.eventId,visualId,row.wordTimings||[]]);
    if(!visualId)continue;
    const at=positions[visualId]||positions.leonardo||[640,418];const k=(row.sequence||0)%4;const pts=[[at[0]+72,at[1]-94],[at[0]+38,at[1]-126],[at[0]+81,at[1]-52],[at[0]+105,at[1]-80]][k];
    episodeEvent(row.start,Math.max(.42,Math.min(.85,(row.end-row.start)*.62)),visualId,'ANIMATE',visualId,{behavior:'speak',point:pts,sourceEventId:row.eventId},'Speaks the approved line '+row.eventId+'.',P);
  }
  // Script-linked staging beats: draw the incoming note, the accountant's ledger, the books,
  // then let Leonardo turn the phrase "flying show" into a moving plane.
  const dialogueById=Object.fromEntries(d.map(row=>[row.eventId,row]));
  const atDialogue=(fn)=>d.find(row=>fn(row.text,row));
  const messageCue=spec.directionTimeline.find(x=>/message|printer|paper|notification/i.test(x.text));
  const messageAt=messageCue?.start??.2;
  if(positions.borges)episodeEvent(messageAt+.18,2.2,'borges','INSCRIBE','annalea-message',{id:'annalea-message',tpl:'annaleaMessage',name:'message from Annalea',at:[545,250],scale:.78,sourceEventId:messageCue?.eventId},'Borges draws out the message from the printer.',P);
  const costLine=atDialogue(text=>/cost|money/i.test(text));
  if(costLine)episodeEvent(costLine.start+.12,1.6,costLine.characterId,'INSCRIBE','ledger',{id:'agnolo-ledger',tpl:'ledger',name:'Agnolo’s ledger',at:[820,330],scale:.55,sourceEventId:costLine.eventId},'Agnolo opens the ledger.',P);
  const bookLine=atDialogue(text=>/book|hundreds/i.test(text));
  if(bookLine)episodeEvent(bookLine.start+.1,1.7,bookLine.characterId,'INSCRIBE','books',{id:'library-books',tpl:'bookStack',name:'Borges’s books',at:[438,340],scale:.52,sourceEventId:bookLine.eventId},'Borges shows the books he has read.',P);
  const planeLine=atDialogue(text=>/flying show|pilot needs a plane|write the plane/i.test(text));
  if(planeLine){const t=planeLine.start+.15,creator=planeLine.characterId;episodeEvent(t,2.2,creator,'INSCRIBE','pilot-plane',{id:'pilot-plane',tpl:'pilotPlane',name:'a very small plane',at:[610,198],scale:.95,sourceEventId:planeLine.eventId},'Leonardo draws the flying show.',P);
    episodeEvent(t+2.25,.35,creator,'ANIMATE','pilot-plane',{behavior:'drift',until:14,sourceEventId:planeLine.eventId},'The plane takes off across the studio.',P);
    episodeEvent(t+2.3,.35,creator,'ANIMATE','message-bell',{behavior:'ring',until:2.6,sourceEventId:planeLine.eventId},'The bell rings as the plane launches.',P);}
  const propActor=positions.leonardo?'leonardo':cast[0];
  for(const cue of spec.directionTimeline){if(/message|printer|paper|notification/i.test(cue.text)&&positions.borges){episodeEvent(cue.start,.4,propActor,'ANIMATE','message-bell',{behavior:'ring',until:2.6,sourceEventId:cue.eventId},'The incoming message rings.',P);}
    if(/orchestral fanfare|propeller/i.test(cue.text)&&planeLine){episodeEvent(cue.start,.4,planeLine.characterId,'ANIMATE','pilot-plane',{behavior:'drift',until:12,sourceEventId:cue.eventId},'The Orchestra launches the pilot plane.',P)}}
  EPISODE_CAM.push([0,.88,640,365],[Math.max(.25,messageAt),1.2,550,305]);
  if(planeLine)EPISODE_CAM.push([planeLine.start,1.02,635,315],[planeLine.start+2.2,.88,640,365]);
  EPISODE_CAM.push([spec.duration,.88,640,365]);EPISODE_CAM.sort((a,b)=>a[0]-b[0]);
  SCRIPT_END=spec.duration;FR=frameDefs();
}
function drawEpisodeMouth(c,t){if(SCENE!=='episode'||!c.tpl.mouth)return;const sub=SUBS.find(s=>s[6]===c.id&&t>=s[0]&&t<s[1]);const word=sub&&sub[7].find(w=>t>=w.start&&t<=w.end);const p=charWorld(c,c.tpl.mouth),s=frameScale(c.frame)*c.scale;
  ctx.save();ctx.strokeStyle=GRAPH;ctx.fillStyle=GRAPH;ctx.lineWidth=Math.max(.8,1.4*s);ctx.beginPath();
  if(word||sub&&!sub[7].length){const open=2.4+3.2*Math.abs(Math.sin(t*12.7+c.id.length));ctx.ellipse(p[0],p[1],4.1*s,open*s,0,0,Math.PI*2);ctx.fill()}
  else{ctx.moveTo(p[0]-4*s,p[1]);ctx.quadraticCurveTo(p[0],p[1]+1.2*s,p[0]+4*s,p[1]);ctx.stroke()}ctx.restore()}
