const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const caption = document.querySelector('#caption');
const finishButton = document.querySelector('#finish');
const world = document.querySelector('.world');
const TAU = Math.PI * 2;
const paths = {
  hug: '<path d="M8 12c-5-3-7 4-3 7l7 5 7-5c4-3 2-10-3-7l-4 3z"/><path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 11 1 14m19-3 3 3"/>',
  kiss: '<path d="M12 21S1 14 2 7c1-5 7-6 10-1 3-5 9-4 10 1 1 7-10 14-10 14Z"/><path d="m8 12 3 2 5-5"/>',
  dance: '<path d="m16 3 6-2v13M16 3v14M16 7l6-2"/><ellipse cx="13" cy="18" rx="3" ry="2"/><ellipse cx="19" cy="15" rx="3" ry="2"/><path d="m4 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1zM6 17v5m-2-2h4"/>',
  bench: '<path d="M3 6h18v7H3zM2 16h20M5 13v9m14-9v9M3 9h18"/>',
  sip: '<path d="M3 9h14v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM17 10h2a3 3 0 0 1 0 6h-2M7 5c-2-2 2-2 0-4m5 4c-2-2 2-2 0-4M1 24h19"/>',
  laugh: '<circle cx="12" cy="12" r="10"/><path d="m5 9 2-2 2 2m6 0 2-2 2 2M6 13h12a6 6 0 0 1-12 0Z"/>'
};
const scenes = [
  { id:'hug', name:'Hug', sub:'Your favorite place', color:'#eee5f3', ink:'#a18ab4', line:'Some things just feel like home.' },
  { id:'kiss', name:'Kiss', sub:'All the butterflies', color:'#f6e5e8', ink:'#c28e9c', line:'And suddenly, the rest of the world disappears.' },
  { id:'dance', name:'Dance', sub:'Our kind of rhythm', color:'#eee9f6', ink:'#9c8bbb', line:'Two left feet. One very happy heart.' },
  { id:'bench', name:'Bench', sub:'Watch the world', color:'#f5eddc', ink:'#b9a16a', line:'No hurry. Nowhere else we need to be.' },
  { id:'sip', name:'Sip', sub:'A cup of together', color:'#e9eee4', ink:'#94a085', line:'You, me, and something warm.' },
  { id:'laugh', name:'Laugh', sub:'The good kind of ache', color:'#f7e9de', ink:'#c49e7f', line:'Your laugh will always be my favorite sound.' }
];
for (const [i, scene] of scenes.entries()) {
  const button = document.createElement('button');
  button.className = 'choice'; button.dataset.scene = scene.id;
  button.style.setProperty('--tint',scene.color); button.style.setProperty('--ink',scene.ink);
  button.setAttribute('aria-pressed','false');
  button.innerHTML = `<span class="number">0${i+1}</span><svg viewBox="-1 -1 26 27" aria-hidden="true">${paths[scene.id]}</svg><span class="label">${scene.name}</span><span class="sub">${scene.sub}</span>`;
  button.addEventListener('click',()=>selectScene(scene.id));
  document.querySelector('#choices').append(button);
}

let state = { mode:'idle', scene:null, since:performance.now(), returnFrom:null };
let selectedMoment = null;
let sharing = false;
const receivedMoment = scenes.find(s=>s.id === new URLSearchParams(location.search).get('moment'));
const sendButton = document.querySelector('#send');
const shareDialog = document.querySelector('#share-dialog');
const shareStatus = document.querySelector('#share-status');
let sound = false, audio;
let now = 0;
const home = [{x:235,y:353},{x:865,y:353}];
const lerp = (a,b,t)=>a+(b-a)*t;
const clamp = n=>Math.max(0,Math.min(1,n));
const smooth = t=>{t=clamp(t);return t*t*(3-2*t)};
const mix = (a,b,t)=>({x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)});
function chime(notes=[523.25,659.25,783.99]) {
  if (!sound) return;
  audio ??= new AudioContext(); audio.resume();
  notes.forEach((f,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.09;osc.type='sine';osc.frequency.value=f;gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.02);gain.gain.exponentialRampToValueAtTime(.001,at+.65);osc.connect(gain);gain.connect(audio.destination);osc.start(at);osc.stop(at+.7)});
}
document.querySelector('#sound').addEventListener('click',e=>{
  sound=!sound; const b=e.currentTarget;b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label',`Turn sound ${sound?'off':'on'}`);b.title=`Sound ${sound?'on':'off'}`;
  b.querySelector('path').setAttribute('d',sound?'M11 5 6 9H3v6h3l5 4zM16 8a6 6 0 0 1 0 8M19 5a10 10 0 0 1 0 14':'M11 5 6 9H3v6h3l5 4zM16 9l5 6m0-6-5 6');chime();
});
function updateControls() {
  document.querySelectorAll('.choice').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.scene===state.scene));b.disabled=state.mode!=='idle'});
  finishButton.hidden=state.mode==='idle'||state.mode==='return';
  world.classList.toggle('active',!finishButton.hidden);
}
function selectScene(id) {
  if(state.mode!=='idle')return;
  selectedMoment = scenes.find(s=>s.id===id);
  if(!selectedMoment)return;
  updateSendButton();
  state={mode:'enter',scene:id,since:performance.now(),returnFrom:null};
  caption.textContent='A little moment is on its way…';
  canvas.setAttribute('aria-label',`${scenes.find(s=>s.id===id).name} scene playing. Click the scene or the button to return to the blocks.`);
  updateControls();chime();
}
function finish() {
  if(state.mode==='idle'||state.mode==='return')return;
  const elapsed=(performance.now()-state.since)/1000;
  state.returnFrom=positions(elapsed);
  state.mode='return';state.since=performance.now();caption.textContent='Until our next little moment.';
  updateControls();chime([659.25,523.25]);
}
function reset(){state={mode:'idle',scene:null,since:performance.now(),returnFrom:null};caption.textContent='A little space. A whole lot of possibility.';canvas.setAttribute('aria-label','The couple are back on their blocks. Choose a moment below.');updateControls()}
document.querySelector('#reset').addEventListener('click',reset);
finishButton.addEventListener('click',finish);canvas.addEventListener('click',finish);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!shareDialog.open)finish()});

function updateSendButton() {
  const scene=selectedMoment;
  sendButton.disabled=!scene||sharing;
  if(!scene)return;
  const article=scene.id==='bench'?'a quiet bench moment':scene.id==='sip'?'a coffee moment':scene.id==='dance'?'a little dance':`a ${scene.name.toLowerCase()}`;
  document.querySelector('#send-heading').textContent=`Send ${article}${receivedMoment?' back':''}.`;
  document.querySelector('#send-description').textContent='They’ll open straight into this moment. No sign-up, just a smile.';
  document.querySelector('#send-label').textContent=sharing?'Opening share…':`Send ${scene.name.toLowerCase()}${receivedMoment?' back':''}`;
  shareStatus.textContent='';
}
function shareDetails() {
  const scene=selectedMoment;
  const url=new URL(location.href);
  url.search='';url.hash='';url.searchParams.set('moment',scene.id);
  const messages={hug:'Sending you a little hug. ♡',kiss:'A little kiss, just for you. ♡',dance:'Save a little dance for me. ♡',bench:'Let’s watch the world together for a moment. ♡',sip:'A little coffee date, just you and me. ♡',laugh:'A little laughter to brighten your day. ♡'};
  return {title:'A little closer',text:messages[scene.id],url:url.href};
}
function showShareOptions(details) {
  const titles={hug:'Send a little hug',kiss:'Send a little kiss',dance:'Send a little dance',bench:'Share a quiet moment',sip:'Send a coffee moment',laugh:'Send a little laughter'};
  document.querySelector('#share-title').textContent=titles[selectedMoment.id];
  document.querySelector('#share-link').value=details.url;
  document.querySelector('#copy-status').textContent='';
  document.querySelector('#copy-link').textContent='Copy link';
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  document.querySelector('#text-link').href=`sms:${ios?'&':'?'}body=${encodeURIComponent(`${details.text}\n${details.url}`)}`;
  shareDialog.showModal();
}
sendButton.addEventListener('click',async()=>{
  if(!selectedMoment||sharing)return;
  const details=shareDetails();
  if(!navigator.share){showShareOptions(details);return}
  sharing=true;updateSendButton();
  try{await navigator.share(details)}
  catch(error){if(error.name!=='AbortError')showShareOptions(details)}
  finally{sharing=false;updateSendButton()}
});
document.querySelector('#copy-link').addEventListener('click',async()=>{
  const input=document.querySelector('#share-link');
  let copied=false;
  try{await navigator.clipboard.writeText(input.value);copied=true}
  catch{input.focus();input.select();input.setSelectionRange(0,input.value.length);try{copied=document.execCommand('copy')}catch{/* Leave the link selected for manual copying. */}}
  document.querySelector('#copy-status').textContent=copied?'Link copied. Paste it into a message to send your moment.':'Select and copy the link above, then paste it into your message.';
  document.querySelector('#copy-link').textContent=copied?'Copied!':'Copy link';
});
shareDialog.addEventListener('click',e=>{
  if(e.target!==shareDialog)return;
  const r=shareDialog.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)shareDialog.close();
});
shareDialog.addEventListener('close',()=>sendButton.focus());

function rounded(x,y,w,h,r,fill,stroke) {ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);ctx.fillStyle=fill;ctx.fill()}
function line(points,color,width=2){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
function shape(points,fill,stroke){ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function heart(x,y,size,color,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(size/20,size/20);ctx.beginPath();ctx.moveTo(0,7);ctx.bezierCurveTo(-22,-5,-9,-21,0,-9);ctx.bezierCurveTo(9,-21,22,-5,0,7);ctx.fillStyle=color;ctx.fill();ctx.restore()}
function flower(x,y,size=8,alpha=1,rotation=0){ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rotation);for(let i=0;i<8;i++){ctx.rotate(TAU/8);ellipse(0,-size*.65,size*.25,size*.48,'#d8ad57')}ellipse(0,0,size*.36,size*.36,'#92714b');ellipse(-size*.07,-size*.07,size*.12,size*.12,'#b58a52');ctx.restore()}
function sparkle(x,y,s,color){ctx.save();ctx.translate(x,y);shape([[0,-s],[s*.25,-s*.25],[s,0],[s*.25,s*.25],[0,s],[-s*.25,s*.25],[-s,0],[-s*.25,-s*.25]],color);ctx.restore()}

function background(t, scene, progress) {
  const g=ctx.createLinearGradient(0,0,0,510);g.addColorStop(0,'#f1eaf0');g.addColorStop(.75,'#f6f1eb');g.addColorStop(1,'#f0e9e4');ctx.fillStyle=g;ctx.fillRect(0,0,1100,510);
  const sunset=scene==='bench'?progress:0;
  if(sunset){ctx.save();ctx.globalAlpha=sunset*.8;const g=ctx.createLinearGradient(0,60,0,395);g.addColorStop(0,'#e8c7d2');g.addColorStop(.65,'#f4d3b3');g.addColorStop(1,'#fae4bf');ctx.fillStyle=g;ctx.fillRect(0,0,1100,395);ctx.restore()}
  ctx.save();ctx.globalAlpha=.7;ellipse(550,225,137,137,sunset?'#f6ce9c':'#f6eee0');ctx.restore();
  ctx.save();ctx.globalAlpha=.45;ctx.strokeStyle='#d9ccd8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(550,225,155,Math.PI*1.07,Math.PI*1.9);ctx.stroke();ctx.restore();
  // Distant rolling paper hills and a warm, quiet floor.
  ctx.beginPath();ctx.moveTo(0,360);ctx.bezierCurveTo(190,315,300,360,480,346);ctx.bezierCurveTo(730,322,840,339,1100,320);ctx.lineTo(1100,510);ctx.lineTo(0,510);ctx.fillStyle='#e8e0e24d';ctx.fill();
  ctx.beginPath();ctx.moveTo(0,378);ctx.bezierCurveTo(370,366,660,396,1100,365);ctx.lineTo(1100,510);ctx.lineTo(0,510);ctx.fillStyle='#e9e3dc66';ctx.fill();
  line([[78,395],[1022,395]],'#d9cfcc',1);
  [195,925].forEach((x,i)=>{ctx.save();ctx.translate(x,389);ctx.scale(i?-1:1,1);line([[0,0],[-5,-30],[-2,-44]],'#a1aa91',1.4);line([[-5,-23],[-17,-34]],'#a1aa91',1.2);ellipse(-13,-30,6,2.5,'#adb59f');ellipse(-1,-27,2.7,6,'#adb59f');flower(-2,-47,7,.85);ctx.restore()});
  flower(117,316,10,.45,Math.sin(t*.4)*.15);flower(983,286,8,.38,t*.04);
  sparkle(346,145,5,'#c7b3cd');sparkle(781,179,6,'#c9b783');sparkle(713,97,3,'#cdbfca');
  [[381,258],[756,280],[145,193],[938,160],[471,100]].forEach(([x,y],i)=>ellipse(x,y+Math.sin(t*.6+i)*5,1.5,1.5,'#d7c4d6'));
  for(const [i,p] of home.entries()){
    ellipse(p.x,399,75,7,'#8c748512');
    rounded(p.x-63,354,126,40,5,i?'#c7b6ce':'#b7b2c6');
    rounded(p.x-65,349,130,10,4,i?'#dfd0e3':'#d4cddb');
    line([[p.x-54,388],[p.x+54,388]],i?'#bba8c4':'#a7a0b8',1);
    ctx.font='9px "DM Sans",sans-serif';ctx.fillStyle='#fff9';ctx.textAlign='center';ctx.fillText(i?'a little sunshine':'a little daydream',p.x,377);
  }
  ctx.font='italic 12px Georgia';ctx.textAlign='center';ctx.fillStyle='#b2a1ad';ctx.fillText('a place for us',550,424);
}

function positions(t) {
  const scene=state.scene;
  let targets=scene==='hug'?[{x:533,y:393},{x:567,y:393}]:scene==='kiss'?[{x:531,y:393},{x:569,y:393}]:scene==='dance'?[{x:514,y:393},{x:586,y:393}]:scene==='bench'?[{x:525,y:402},{x:575,y:402}]:scene==='sip'?[{x:486,y:393},{x:614,y:393}]:[{x:507,y:393},{x:593,y:393}];
  if(state.mode==='idle')return home.map(p=>({...p,walk:0,angle:0}));
  if(state.mode==='return'){
    const out=[];
    for(let i=0;i<2;i++){
      // He walks her home, helps her up, and then heads back after a kiss.
      if(['kiss','sip'].includes(scene)&&i===0&&t<3.1){const p=mix(state.returnFrom[i],{x:823,y:393},smooth(t/2.4));out.push({...p,walk:t<2.4?1:0,angle:0});continue}
      const delay=['kiss','sip'].includes(scene)&&i===0?3.1:0;
      const q=t-delay;
      const from=['kiss','sip'].includes(scene)&&i===0?{x:823,y:393}:state.returnFrom[i];
      let p=mix(from,{x:home[i].x,y:393},smooth(q/2.7));
      if(q>2.7){const k=clamp((q-2.7)/.7);p.y=lerp(393,353,k)-Math.sin(k*Math.PI)*37}
      if(q<2.7)p.y-=Math.abs(Math.sin(q*11))*2;
      out.push({...p,walk:q>0&&q<2.7?1:0,angle:0});
    }return out;
  }
  if(state.mode==='enter'){
    if(scene==='hug')return home.map((p,i)=>{
      if(i===0){
        const jump=clamp((t-.25)/.65);
        const x=t<.9?lerp(p.x,270,jump):t<2.7?lerp(270,807,smooth((t-.9)/1.8)):lerp(807,533,smooth((t-3.4)/2));
        return {x,y:t<.9?lerp(353,393,jump)-Math.sin(jump*Math.PI)*42:393,walk:(t>.9&&t<2.7)||t>3.4?1:0,angle:0};
      }
      const jump=clamp((t-2.7)/.7);
      return {x:t<3.4?lerp(865,845,jump):lerp(845,567,smooth((t-3.4)/2)),y:lerp(353,393,jump)-Math.sin(jump*Math.PI)*28,walk:t>3.4?1:0,angle:0};
    });
    return home.map((p,i)=>{
      const delay=scene==='hug'&&i===1?1.7:scene==='sip'&&i===0?.8:0;
      const q=Math.max(0,t-delay);const jump=clamp((q-.45)/.7);
      let x=p.x,y=p.y-Math.abs(Math.sin(Math.min(q,.45)/.45*Math.PI))*5;
      if(q>.45){x=lerp(p.x,p.x+(i?-35:35),jump);y=lerp(353,393,jump)-Math.sin(jump*Math.PI)*48}
      const moving=clamp((q-1.15)/2.5);
      x=lerp(p.x+(i?-35:35),targets[i].x,smooth(moving));
      if(q<1.15)x=lerp(p.x,p.x+(i?-35:35),jump);
      if(q>1.15)y=393-Math.abs(Math.sin(q*12))*3*(moving<1?1:0);
      if(scene==='bench')y=lerp(y,402,smooth((t-3.4)/.8));
      let angle=0;
      if(scene==='dance'&&i===0&&q>.45&&q<1.15)angle=jump*TAU;
      if(scene==='dance'&&i===1&&q>1.2&&q<2.4)angle=Math.sin((q-1.2)/1.2*Math.PI)*.3;
      if(scene==='laugh'&&q>.7&&q<2.7){angle=(q-.7)/2*TAU*(i?-1:1);y-=Math.sin((q-.7)/2*Math.PI)*15}
      return {x,y,walk:q>1.15&&moving<1?1:0,angle};
    });
  }
  return targets.map((p,i)=>{
    const sign=i?-1:1;
    if(scene==='dance')return {x:p.x+Math.sin(t*1.5)*19,y:p.y-Math.abs(Math.sin(t*3))*5,walk:1,angle:Math.sin(t*1.5)*.09,depth:Math.sin(t*1.5+(i?Math.PI:0))*7};
    if(scene==='laugh')return {x:p.x+Math.sin(t*1.7+i)*8,y:p.y-Math.abs(Math.sin(t*4))*2,walk:0,angle:Math.sin(t*2+i)*.14*sign};
    return {...p,walk:0,angle:scene==='hug'?sign*.06:scene==='kiss'?sign*.085:0};
  });
}

function drawCharacter(p,female,t,index) {
  const scene=state.scene, active=state.mode==='loop', entering=state.mode==='enter', returning=state.mode==='return';
  const escort=returning&&index===0&&(['kiss','sip'].includes(scene)&&t<3.1||['hug','dance'].includes(scene)&&t<.45);
  const facing=returning?(index===0&&!escort?-1:1):(female?-1:1);
  const walk=p.walk?Math.sin(t*12):0;
  const skin=female?'#f0c5a5':'#c38d67',shade=female?'#dca98c':'#a76f50';
  ellipse(p.x,p.y+2,25,4,'#77647d18');
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle||0);ctx.scale(facing,1);
  const breathe=Math.sin(now*1.7+index)*.8;
  ctx.translate(0,breathe);
  // Hair behind the shoulders.
  if(female){ctx.beginPath();ctx.moveTo(-27,-112);ctx.bezierCurveTo(-41,-86,-29,-70,-34,-57);ctx.bezierCurveTo(-12,-48,15,-52,31,-62);ctx.bezierCurveTo(27,-84,37,-99,22,-116);ctx.fillStyle='#d5a653';ctx.fill();for(let i=0;i<4;i++)line([[-25+i*14,-93],[-29+i*15,-68]],'#efc778',3)}
  // Legs and shoes.
  const seated=active&&scene==='bench';
  const leg=(x,phase)=>{
    const swing=walk*phase;
    const ballet=female&&entering&&scene==='dance'&&t>1.2&&t<2.4&&phase===-1;
    if(seated)line([[x,-42],[x+15,-25],[x+16,-6]],female?skin:'#4f4b5d',female?8:12);
    else if(ballet)line([[x,-42],[x+25,-35],[x+35,-43]],skin,8);
    else line([[x,-42],[x+swing*7,-22],[x+swing*12,-7]],female?skin:'#4f4b5d',female?8:12);
    if(ballet){rounded(x+29,-46,16,7,4,'#8d72a1');return}
    const footX=seated?x+17:x+swing*12;
    rounded(footX-6,-9,18,8,4,female?'#8d72a1':'#efe9dc','#79707b');
    if(!female)line([[footX-2,-7],[footX+7,-7]],'#aaa1ac',1);
  };leg(-10,1);leg(10,-1);
  // Cream shirt or flared sunflower dress.
  if(female){shape([[-17,-84],[16,-84],[20,-60],[31,-32],[20,-27],[-9,-28],[-31,-34],[-20,-60]],'#9c80b4','#7a658e');shape([[0,-78],[5,-50],[19,-31],[28,-33],[17,-61],[14,-81]],'#ad92c2');line([[-19,-58],[19,-58]],'#7f6795',2);flower(-12,-69,5);flower(12,-43,7);flower(-17,-38,5.5);flower(9,-78,4);line([[-4,-56],[-8,-35]],'#c2a7d0',1.2)}
  else {shape([[-22,-87],[19,-87],[27,-73],[20,-66],[18,-39],[-19,-39],[-20,-65],[-29,-70]],'#efe8da','#b8ab9e');shape([[13,-82],[22,-73],[16,-66],[15,-43],[8,-41]],'#ddd4c4');line([[-16,-42],[15,-42]],'#cec2b1',1)}
  // Neck.
  rounded(-7,-97,14,15,4,skin);ctx.beginPath();ctx.arc(0,-89,8,0,Math.PI);ctx.strokeStyle=female?'#775d89':'#bcaf9d';ctx.lineWidth=2;ctx.stroke();
  let armL=[[-21,-78],[-26-walk*8,-58],[-23-walk*13,-43]],armR=[[20,-78],[26+walk*8,-59],[25+walk*13,-45]];
  if(active&&['hug','kiss'].includes(scene)){armR=[[18,-78],[30,-76],[42,-83]];armL=[[-19,-77],[3,-65],[36,-73]]}
  if(active&&scene==='dance'){armR=[[19,-78],[31,-76],[39,-69]];armL=[[-19,-78],[-29,-69],[-30,-50]]}
  if(active&&scene==='sip'){armR=[[19,-78],[26,-61],[32,-76]];armL=[[-20,-78],[-25,-62],[-12,-57]]}
  if(active&&scene==='bench'){armR=[[19,-78],[27,-61],[33,-47]];armL=[[-20,-78],[-24,-56],[-10,-43]]}
  if(active&&scene==='laugh'){armR=[[19,-78],[26,-61],[12,-56]];armL=[[-20,-78],[-23,-60],[-6,-56]]}
  if(entering&&t<.55){armR=[[19,-78],[32,-99],[29+Math.sin(t*20)*5,-116]]}
  if(entering&&scene==='dance'&&t<.5){armR=[[19,-78],[32,-99],[33,-120]];armL=[[-20,-78],[-32,-99],[-30,-121]]}
  if(entering&&scene==='dance'&&female&&t>1.2&&t<2.4){armR=[[19,-78],[30,-103],[16,-126]];armL=[[-20,-78],[-40,-83],[-53,-90]]}
  if(entering&&scene==='hug'&&!female&&t>2.6&&t<3.5){armR=[[19,-78],[33,-67],[43,-61]]}
  if(entering&&scene==='hug'&&female&&t>2.7&&t<3.5){armR=[[19,-78],[24,-64],[35,-61]]}
  if(returning&&scene==='kiss'&&!female&&t>2.35&&t<3.1){armR=[[19,-78],[30,-87],[39,-100]]}
  if(returning&&scene==='laugh'&&t<.5){armR=[[19,-78],[31,-101],[29+Math.sin(t*18)*6,-119]]}
  // A quick, playful parting pat, then both head home.
  if(returning&&['hug','dance'].includes(scene)&&!female&&t<.45)armR=[[19,-78],[33,-57],[44,-48]];
  for(const arm of [armL,armR]){line(arm,shade,7.5);line(arm,skin,6);ellipse(...arm[2],4,4.5,skin)}
  if(active&&scene==='sip'){rounded(25,-83,16,17,3,female?'#d5be8e':'#e7dad0','#a98f75');ctx.beginPath();ctx.arc(43,-76,4,-Math.PI/2,Math.PI/2);ctx.strokeStyle='#a98f75';ctx.lineWidth=1.5;ctx.stroke();line([[28,-87],[30,-92],[28,-96]],'#e8e0d2',1.5)}
  // Head: soft outline, oversized expressive anime eyes.
  ctx.save();ctx.translate(0,active&&scene==='laugh'?2:0);
  ellipse(0,-111,26,28,shade);ellipse(1,-113,26,27,skin);ellipse(-24,-108,5,7,skin);
  if(female){
    ctx.beginPath();ctx.moveTo(-28,-112);ctx.bezierCurveTo(-34,-143,-8,-150,15,-138);ctx.bezierCurveTo(34,-131,31,-109,26,-100);ctx.lineTo(19,-117);ctx.quadraticCurveTo(1,-116,-8,-132);ctx.quadraticCurveTo(-19,-119,-28,-112);ctx.fillStyle='#e6bd70';ctx.fill();
    ctx.beginPath();ctx.moveTo(-5,-138);ctx.bezierCurveTo(3,-125,14,-125,22,-119);ctx.strokeStyle='#f5d58f';ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke();line([[-25,-121],[-26,-102],[-23,-91]],'#edc97f',6);flower(-25,-111,5);
  }else{
    ctx.beginPath();ctx.moveTo(-26,-114);ctx.lineTo(-31,-128);ctx.lineTo(-22,-129);ctx.lineTo(-21,-139);ctx.lineTo(-8,-136);ctx.lineTo(1,-143);ctx.lineTo(8,-137);ctx.quadraticCurveTo(29,-139,28,-119);ctx.lineTo(20,-112);ctx.lineTo(17,-126);ctx.lineTo(9,-121);ctx.lineTo(2,-127);ctx.lineTo(-9,-119);ctx.lineTo(-21,-122);ctx.lineTo(-21,-109);ctx.fillStyle='#36303b';ctx.fill();
    // Backwards cap and the projecting back brim.
    ctx.beginPath();ctx.moveTo(-27,-129);ctx.quadraticCurveTo(-28,-153,-3,-153);ctx.quadraticCurveTo(21,-153,25,-135);ctx.lineTo(13,-134);ctx.quadraticCurveTo(1,-142,-12,-132);ctx.closePath();ctx.fillStyle='#655d76';ctx.fill();
    shape([[-25,-136],[-47,-129],[-47,-124],[-26,-125]],'#655d76','#4e465e');line([[-23,-136],[-13,-134]],'#9e92ac',3);rounded(-20,-140,8,5,1,'#b7a7bb');
  }
  const blink=Math.sin(now*.8+index*.9)>.997;
  const happy=active&&['hug','dance','laugh'].includes(scene);
  const closed=happy||blink||(active&&scene==='kiss');
  for(const x of [-8,12]){
    if(closed){ctx.beginPath();ctx.moveTo(x-4,-111);ctx.quadraticCurveTo(x,-116,x+4,-111);ctx.strokeStyle='#55404b';ctx.lineWidth=1.8;ctx.stroke()}
    else {ellipse(x,-113,4.5,6,'#fff8ed');ellipse(x+1,-112,3,4.5,female?'#8e744d':'#74533c');ellipse(x+1,-112,1.5,3,'#40333b');ellipse(x,-115,1.1,1.5,'#fff');line([[x-4,-118],[x+3,-119]],'#59414a',1.4)}
    if(female){line([[x-4,-116],[x-6,-118]],'#694853',1)}
  }
  line([[-12,-124],[-5,-125]],female?'#aa7e49':'#4a3540',1.4);line([[9,-125],[16,-123]],female?'#aa7e49':'#4a3540',1.4);
  ellipse(-14,-103,5,2.5,female?'#e99e9c88':'#c56b6880');ellipse(17,-103,5,2.5,female?'#e99e9c88':'#c56b6880');
  line([[4,-112],[6,-106],[3,-105]],shade,1);
  if(active&&scene==='kiss'){ellipse(13,-99,3,2,'#b16e70')}
  else if(active&&scene==='laugh'){ellipse(4,-99,7,6,'#8b5359');shape([[-1,-104],[9,-104],[8,-101],[0,-101]],'#fff7e9');ellipse(5,-96,4,2,'#da9796')}
  else{ctx.beginPath();ctx.moveTo(-2,-99);ctx.quadraticCurveTo(5,-93,11,-100);ctx.strokeStyle='#9c6262';ctx.lineWidth=1.5;ctx.stroke()}
  ctx.restore();ctx.restore();
}

function bench(x,y,alpha=1){ctx.save();ctx.globalAlpha=alpha;ellipse(x,y+5,88,6,'#7b637b12');line([[x-59,y-23],[x-59,y],[x-52,y]],'#8b7d83',6);line([[x+59,y-23],[x+59,y],[x+65,y]],'#8b7d83',6);for(let i=0;i<3;i++)rounded(x-75,y-73+i*12,150,9,3,'#bb997b','#aa8c74');rounded(x-79,y-29,158,10,3,'#c4a388','#a78b76');line([[x-79,y-45],[x-79,y-26]],'#8b7d83',4);line([[x+79,y-45],[x+79,y-26]],'#8b7d83',4);ctx.restore()}
function coffeeCart(x,y,alpha=1){ctx.save();ctx.globalAlpha=alpha;ellipse(x,y+5,63,5,'#7b637b12');rounded(x-47,y-57,94,49,3,'#c7ccb2','#a1a88e');rounded(x-52,y-63,104,8,2,'#e2d8bd','#bfb399');line([[x-42,y-64],[x-42,y-135],[x+42,y-135],[x+42,y-64]],'#a7ad91',3);rounded(x-50,y-137,100,26,4,'#f7e6b8','#bdb390');ctx.save();ctx.shadowColor='#e0b45d';ctx.shadowBlur=12;ctx.font='600 13px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillStyle='#aa8451';ctx.fillText('C O F F E E',x,y-120);ctx.restore();ellipse(x-30,y-6,6,6,'#8c887c');ellipse(x+30,y-6,6,6,'#8c887c');rounded(x-9,y-84,18,20,2,'#d4c4b0');rounded(x-13,y-87,26,4,2,'#a79783');heart(x,y-30,10,'#f4eee1');ctx.restore()}
function speech(x,y,text,fill){ctx.save();ctx.font='500 11px "DM Sans",sans-serif';const w=ctx.measureText(text).width+25;rounded(x-w/2,y-24,w,29,10,fill,'#d7c7d4');shape([[x-6,y+4],[x-10,y+12],[x+5,y+4]],fill);ctx.fillStyle='#816b88';ctx.textAlign='center';ctx.fillText(text,x,y-6);ctx.restore()}
function effects(t,ps){
  if(state.mode!=='loop')return;
  const scene=state.scene;
  if(scene==='hug'){
    ctx.save();ctx.globalCompositeOperation='screen';const g=ctx.createRadialGradient(550,305,5,550,305,100);g.addColorStop(0,'#fce3a44a');g.addColorStop(1,'#fce3a400');ctx.fillStyle=g;ctx.fillRect(440,200,220,210);ctx.restore();
  }
  if(['hug','kiss'].includes(scene)){
    for(let i=0;i<12;i++){const phase=(t*.18+i/12)%1;ctx.save();ctx.globalAlpha=Math.sin(phase*Math.PI)*.8;heart(550+Math.sin(i*2.4+phase*2)*65,300-phase*145,7+(i%3)*3,i%2?'#c69aaf':'#d8b9cb',Math.sin(t+i)*.2);ctx.restore()}
  }
  if(scene==='dance'){
    for(let i=0;i<14;i++){const phase=(t*.25+i/14)%1;ctx.save();ctx.globalAlpha=(1-phase)*.2;const a=i/14*TAU;ctx.translate(550+Math.cos(a)*75,395+Math.sin(a)*9);ctx.rotate(a+Math.PI/2);ellipse(-3,0,3,6,'#8c768f');ellipse(5,7,3,6,'#8c768f');ctx.restore()}
    for(let i=0;i<6;i++)sparkle(470+i*33,235+Math.sin(t*2+i)*20,3+Math.sin(t+i),i%2?'#b7a1c5':'#cfb77e');
    ctx.font='20px Georgia';ctx.fillStyle='#baa1c8';ctx.fillText('♪',460+Math.sin(t)*6,242);ctx.fillText('♫',635,226+Math.sin(t)*7);
    // Joined hands gently sway between them.
    line([[ps[0].x+32,ps[0].y-69],[550+Math.sin(t*1.5)*19,321],[ps[1].x-32,ps[1].y-69]],'#d1a07b',5);
  }
  if(scene==='laugh'){
    const alternate=Math.floor(t/2.4)%2;
    speech(ps[0].x-20,ps[0].y-164,alternate?'another joke…':'joke!','#f8f1e6');speech(ps[1].x+30,ps[1].y-170,alternate?'laughter!':'ha ha ha!','#f3e5f1');
    for(let i=0;i<3;i++)line([[ps[1].x+37+i*5,277+i*10],[ps[1].x+41+i*7,275+i*10]],'#c29bb9',1.4);
  }
  if(scene==='bench'){for(let i=0;i<3;i++){ctx.save();ctx.globalAlpha=.5;const x=740+i*27,y=153+Math.sin(i*2)*14;line([[x-5,y],[x,y+3],[x+5,y]],'#b897a0',1);ctx.restore()}heart(550,233+Math.sin(t)*3,9,'#d2a6b4')}
}

function render(timestamp){
  now=timestamp/1000;let t=(timestamp-state.since)/1000;
  if(state.mode==='enter'&&t>5.5){state.mode='loop';state.since=timestamp;t=0;caption.textContent=scenes.find(s=>s.id===state.scene).line;finishButton.innerHTML='One more little moment <span>↗</span>'}
  if(state.mode==='return'&&t>(['kiss','sip'].includes(state.scene)?6.7:3.6)){reset();t=0}
  const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==1100*dpr||canvas.height!==510*dpr){canvas.width=1100*dpr;canvas.height=510*dpr}ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineWidth=1;
  const progress=state.mode==='loop'?1:state.mode==='enter'?smooth(t/4):state.mode==='return'?1-smooth(t/3):0;
  background(now,state.scene,progress);
  const ps=positions(t);
  if(state.scene==='bench'){
    const x=state.mode==='enter'?lerp(235,550,smooth((t-.8)/2.8)):state.mode==='return'?lerp(550,235,smooth(t/2.7)):550;
    bench(x,394,state.mode==='return'?1-smooth((t-2)/.8):state.mode==='enter'?smooth((t-.4)/.5):1);
  }
  if(state.scene==='sip'){
    const x=state.mode==='enter'?lerp(865,550,smooth((t-.7)/3)):state.mode==='return'?lerp(550,865,smooth(t/2.7)):550;
    coffeeCart(x,394,state.mode==='return'?1-smooth((t-2)/.8):state.mode==='enter'?smooth((t-.5)/.5):1);
  }
  const order=ps[0].depth>ps[1].depth?[1,0]:[0,1];order.forEach(i=>drawCharacter(ps[i],i===1,t,i));effects(t,ps);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

if(receivedMoment){
  const articles={hug:'a hug',kiss:'a kiss',dance:'a dance',bench:'a quiet moment',sip:'a coffee moment',laugh:'a little laughter'};
  document.querySelector('#received-message').textContent=`Someone sent you ${articles[receivedMoment.id]}. ♡`;
  document.querySelector('#received').hidden=false;
  selectScene(receivedMoment.id);
}

// Read-only state is also useful to browser-based smoke checks.
window.getMomentState=()=>({mode:state.mode,scene:state.scene});
