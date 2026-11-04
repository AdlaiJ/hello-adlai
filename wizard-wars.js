import {SPELLS} from './wizard-spells.js';
import {MAPS,makeTiles,createGame} from './wizard-engine.js';

import {markChangedChunk,T} from './wizard-world.js';
import {openRoom} from './wizard-room.js';
const $=id=>document.getElementById(id),spells=new Map(SPELLS.map(s=>[s.id,s])),canvas=$('stage');
let draw;
const modeButtons=document.querySelectorAll('#home .modes button');
modeButtons.forEach(button=>button.disabled=true);
try{const {makeRenderer}=await import('./wizard-3d.js');draw=makeRenderer(canvas).draw}
catch(error){document.querySelector('#home p').textContent='The 3D arena could not load. Check your connection and enable WebGL, then refresh.';throw error}

let mode='waves',page='',settings,room=null,host=false,connected=false,code='',selected=[],locked=false,other=null,game=null,state=null,me=0,armed=false,yaw=0,angle=0,netClock=0,message='',messageUntil=0;
const keys=new Set();
for(const map of MAPS)$('map').add(new Option(map,map));
const schools=[...new Set(SPELLS.map(s=>s.category))].sort();
for(const cat of schools)$('school').add(new Option(cat,cat));
function show(id){page=id;if(id!=='hud'&&windowAim)setWindowAim(false);if(id!=='hud'&&document.pointerLockElement===canvas)document.exitPointerLock();document.body.classList.toggle('playing',id==='hud');for(const x of ['home','setup','book','end','hud'])$(x).hidden=x!==id;document.querySelector('main').style.display=id==='hud'?'none':''}
function clean(){room?.stop();room=null;game=state=null;code='';connected=locked=false;other=null;me=0;keys.clear();message='';messageUntil=0;yaw=0;angle=0;armed=false}
function setup(m){clean();mode=m;show('setup');$('modeName').textContent={waves:'Singleplayer · Waves',multi:'Multiplayer · Two wizards',sandbox:'Sandbox · Training grounds'}[m];
 $('proceed').textContent=m==='multi'?'Create room':'Choose spells';$('joining').hidden=m!=='multi';$('setupStatus').textContent=m==='multi'?'The host sets the rules. Share the room word with one friend.':'Choose how many spells you want to bring.';$('join').disabled=$('proceed').disabled=false}
$('multiplayer').onclick=()=>setup('multi');$('waves').onclick=()=>setup('waves');$('sandbox').onclick=()=>setup('sandbox');
function home(){clean();show('home')}
document.querySelectorAll('.back').forEach(b=>b.onclick=home);$('leave').onclick=home;
function readSettings(){const count=$('count').valueAsNumber,mana=$('mana').valueAsNumber;if(!Number.isInteger(count)||count<1||count>10||!Number.isInteger(mana)||mana<10||mana>5000){$('setupStatus').textContent='Choose 1–10 spells and 10–5000 mana.';return null}return {count,mana,map:$('map').value}}
function book(){selected=[];locked=false;$('school').value='All';show('book');$('copy').hidden=!(host&&mode==='multi');$('roomLabel').textContent=mode==='multi'?'Duel room · '+code:mode==='waves'?'Singleplayer · Waves':'Sandbox';
 $('rules').textContent=settings.map+' · '+settings.mana+' mana · Choose '+settings.count+' spells. Selection order sets your number keys.';$('bookStatus').textContent='Every 10 seconds, regain 10% mana. F then a spell banks 5% of your pool per second. Cast early for a discount or fully charge for a free cast.';drawBook()}
function drawBook(){const list=$('cards');list.replaceChildren();
 $('grandToggle').setAttribute('aria-pressed',String($('school').value==='grand'));
 for(const school of schools){
  const filter=$('school').value;
  if(filter!=='All'&&filter!=='grand'&&filter!==school)continue;
  const entries=SPELLS.filter(spell=>spell.category===school&&(filter!=='grand'||spell.cost>=50)),heading=document.createElement('h3');
  if(!entries.length)continue;heading.className='schoolHeading';heading.textContent=school+' · '+entries.length;list.append(heading);
  for(const s of entries){
 const i=selected.indexOf(s.id),b=document.createElement('button');b.setAttribute('aria-pressed',String(i>=0));b.disabled=locked||(i<0&&selected.length>=settings.count);
 const title=document.createElement('strong'),stats=document.createElement('small'),desc=document.createElement('span');title.textContent=(i>=0?'['+((i+1)%10)+'] ':'')+s.symbol+' '+s.name;stats.textContent=s.category+' · '+s.cost+' mana · '+(s.time?s.time+'s':'Instant');desc.textContent=s.description;b.append(title,stats,desc);b.onclick=()=>{if(i<0)selected.push(s.id);else selected.splice(i,1);drawBook()};list.append(b)}
 }
 $('selection').textContent=selected.length+' / '+settings.count+' bound';$('ready').disabled=locked||selected.length!==settings.count}
$('school').onchange=drawBook;
$('grandToggle').onclick=()=>{$('school').value=$('school').value==='grand'?'All':'grand';drawBook();$('cards').scrollTop=0};
function validIds(ids){return Array.isArray(ids)&&ids.length===settings.count&&new Set(ids).size===ids.length&&ids.every(id=>spells.has(id))}
function notify(text){message=text;messageUntil=performance.now()+1600}
function start(){show('hud');keys.clear();armed=false;yaw=me?Math.PI:0;angle=0;netClock=0;
 $('practice').hidden=mode!=='sandbox';$('slots').replaceChildren();
 selected.forEach((id,i)=>{const b=document.createElement('button');b.onclick=()=>act(i);b.title=spells.get(id).description;$('slots').append(b)});hud()}
function tryStart(){if(!host||!connected||!locked||!other||game)return;game=createGame(settings,[selected,other],'multi');state=game.state;room.send({t:'start',state:game.snapshot(false)});start()}
$('ready').onclick=()=>{if(!validIds(selected))return;locked=true;drawBook();
 if(mode==='multi'){if(!host)room.send({t:'ready',ids:selected});$('bookStatus').textContent='Spellbook locked. Waiting for the other wizard…';tryStart()}else{game=createGame(settings,[selected],mode);state=game.state;start()}};
function network(isHost,word=''){
 host=isHost;me=host?0:1;code=word;$('join').disabled=$('proceed').disabled=true;$('setupStatus').textContent='Contacting the room service…';
 room=openRoom(host,word,{code(c){code=c;book()},connected(){connected=true;if(host){room.send({t:'rules',settings});$('bookStatus').textContent=locked?'Friend connected. Waiting for their spellbook…':'Your friend joined. Bind your spells and lock in.'}},
 error(msg){if(page==='end')return;setup('multi');$('setupStatus').textContent=msg},
 data(m){
  if(host){
   if(m.t==='ready'&&!other&&validIds(m.ids)){other=m.ids;tryStart();if(!game)$('bookStatus').textContent='Your friend is ready. Lock in your own spellbook to start.'}
   if(!game||game.state.over)return;
   if(m.t==='input')game.input(1,m.move,m.jump===true,m.angle,m.strafe,m.yaw);
   if(m.t==='cast')game.command(1,m.slot,m.store===true);
  }else if(m.t==='rules'&&page==='setup'&&MAPS.includes(m.settings?.map)&&Number.isInteger(m.settings.count)&&m.settings.count>=1&&m.settings.count<=10&&Number.isInteger(m.settings.mana)&&m.settings.mana>=10&&m.settings.mana<=5000){settings=m.settings;book()}
  else if(m.t==='start'&&locked&&page==='book'&&m.state?.map===settings.map){state={...m.state,tiles:makeTiles(settings.map),terrainVersion:0,changedChunks:new Map()};start()}
  else if(m.t==='frame'&&page==='hud'&&m.state&&Array.isArray(m.tiles)){for(const [i,v] of m.tiles){state.tiles[i]=v;markChangedChunk(state.changedChunks,i)}state={...m.state,tiles:state.tiles,changedChunks:state.changedChunks,terrainVersion:state.terrainVersion+Number(m.tiles.length>0)};if(state.over)finish()}
 }});
}
$('proceed').onclick=()=>{settings=readSettings();if(!settings)return;if(mode==='multi')network(true);else book()};
$('join').onclick=()=>{const word=$('word').value.trim().toLowerCase();if(!/^[a-z]{4,6}$/.test(word)){$('setupStatus').textContent='Enter the 4–6 letter room word.';return}network(false,word)};
$('copy').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('room',code);try{await navigator.clipboard.writeText(url.href);$('bookStatus').textContent='Invite link copied.'}catch{$('bookStatus').textContent='Share room word '+code}};
function act(i){if(page!=='hud'||!selected[i])return;const store=armed;armed=false;const p=state.players[me],spell=spells.get(selected[i]);if(!store&&!(p.weapon?.id===spell.id&&p.weapon.strikes>0)&&p.mana+.0001<spell.cost-p.bank[i])notify('Need more mana for '+spell.name);
 if(game){game.input(me,movement(),jumping(),angle,strafe(),yaw);game.command(me,i,store)}else{room.send({t:'input',move:movement(),jump:jumping(),angle,strafe:strafe(),yaw});room.send({t:'cast',slot:i,store})}}
function hud(){if(!state)return;const p=state.players[me];if(!p)return;
 $('vitals').textContent=(me?'Red':'Blue')+' · HP '+Math.ceil(p.hp)+' / '+p.maxHp+' · Mana '+Math.floor(p.mana)+' / '+p.maxMana+(p.shield?' · Shield '+Math.ceil(p.shield):'');
 $('opponent').textContent=mode==='waves'?'Wave '+state.wave:mode==='multi'?'Rival HP '+Math.ceil(state.players[1-me].hp):'Sandbox';
 const rivals=state.players.filter(q=>q.side!==p.side&&q.hp>0);
 if(rivals.length){
  const distance=q=>Math.hypot(q.x-p.x,q.z-p.z),rival=rivals.reduce((a,b)=>distance(a)<distance(b)?a:b);
  const turn=Math.atan2(rival.z-p.z,rival.x-p.x)-yaw;
  const bearing=['ahead','ahead right','right','behind right','behind','behind left','left','ahead left'][(Math.round(turn/(Math.PI/4))%8+8)%8];
  $('opponent').textContent+=' · Rival '+Math.round(distance(rival)/T)+' blocks '+bearing;
 }
 $('signal').textContent=armed?'STORE · Choose a spell':p.pending>=0?'Casting '+spells.get(p.ids[p.pending]).name+' · '+p.cast.toFixed(1)+'s':p.store>=0?'Storing mana in '+spells.get(p.ids[p.store]).name:performance.now()<messageUntil?message:'Mana pulse in '+Math.ceil(10-state.time%10)+'s';
 selected.forEach((id,i)=>{const b=$('slots').children[i],s=spells.get(id);b.textContent=((i+1)%10)+' '+s.symbol+' '+s.name+' · '+Math.ceil(Math.max(0,s.cost-p.bank[i]))+(p.bank[i]>0?' ◈':'');if(p.weapon?.id===id&&p.weapon.strikes>0)b.textContent=((i+1)%10)+' Swing '+s.name+' · '+p.weapon.strikes+' left';b.title=s.description+' · Stored '+p.bank[i].toFixed(1)+' / '+s.cost})}
function finish(){show('end');$('result').textContent=state.over;$('resultInfo').textContent=mode==='waves'?'Reached wave '+state.wave+' in '+Math.floor(state.time)+' seconds.':settings.map+' · '+Math.floor(state.time)+' seconds';keys.clear()}
$('dummy').onclick=()=>{if(game&&game.state.players.length<24)game.spawn()};
$('refill').onclick=()=>{const p=state.players[0];p.hp=p.maxHp;p.mana=p.maxMana};$('restore').onclick=()=>{state.tiles=makeTiles(settings.map);state.terrainVersion++};$('change').onclick=()=>{game=state=null;book()};
function movement(){return Number(keys.has('w'))-Number(keys.has('s'))}
function strafe(){return Number(keys.has('d'))-Number(keys.has('a'))}
function jumping(){return keys.has(' ')}
function turn(dx,dy){yaw+=dx;angle=Math.max(-1.35,Math.min(1.35,angle+dy))}
addEventListener('keydown',e=>{if(page!=='hud'||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k===' '||k.startsWith('arrow'))e.preventDefault();keys.add(k);if(e.repeat)return;
 if(k==='escape'&&windowAim){setWindowAim(false);return}
 if(k==='shift'){toggleShiftLock();return}
 if(k==='f')armed=!armed;else if(/^\d$/.test(k))act((Number(k)+9)%10);
});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-control]').forEach(b=>{b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.control)};b.onlostpointercapture=()=>keys.delete(b.dataset.control)});$('touchStore').onclick=()=>armed=!armed;
let drag=null;
const lockButton=$('shiftLock');
let windowAim=false;
function setWindowAim(on){
 windowAim=on;drag=null;canvas.style.cursor=on?'none':'';
 lockButton.setAttribute('aria-pressed',String(on));
 lockButton.textContent=on?'Shift Lock: Window aim':'Shift Lock: Off';
}
function lockFailed(){
 if(page!=='hud'||document.pointerLockElement===canvas)return;
 setWindowAim(true);notify('Window aim active. Move the mouse over the arena. Shift or Esc releases.');
}
async function toggleShiftLock(){
 if(page!=='hud')return;
 if(windowAim){setWindowAim(false);return}
 if(document.pointerLockElement===canvas){document.exitPointerLock();return}
 try{await canvas.requestPointerLock()}catch{lockFailed()}
}
lockButton.onclick=toggleShiftLock;
document.addEventListener('pointerlockerror',lockFailed);
document.addEventListener('pointerlockchange',()=>{
 const locked=document.pointerLockElement===canvas;
 if(locked&&page!=='hud'){document.exitPointerLock();return}
 setWindowAim(false);lockButton.setAttribute('aria-pressed',String(locked));
 lockButton.textContent=locked?'Shift Lock: On':'Shift Lock: Off';
});
document.addEventListener('mousemove',e=>{
 if(page==='hud'&&(document.pointerLockElement===canvas||(windowAim&&e.target===canvas)))turn(e.movementX*.004,e.movementY*.004);
});
canvas.onpointerdown=e=>{if(page!=='hud'||windowAim||document.pointerLockElement===canvas)return;canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY]};
canvas.onpointermove=e=>{if(!drag||page!=='hud'||windowAim||document.pointerLockElement===canvas)return;turn((e.clientX-drag[0])*.007,(e.clientY-drag[1])*.006);drag=[e.clientX,e.clientY]};
canvas.onlostpointercapture=()=>drag=null;
let prev=performance.now(),acc=0,uiClock=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.1,(now-prev)/1000);prev=now;
 if(page!=='hud'){draw(null,0,0,0,now/1000);return}
 turn((Number(keys.has('arrowright'))-Number(keys.has('arrowleft')))*dt*2.1,(Number(keys.has('arrowdown'))-Number(keys.has('arrowup')))*dt*1.4);
 if(game){game.input(me,movement(),jumping(),angle,strafe(),yaw);acc+=dt;while(acc>=1/60){game.tick(1/60);acc-=1/60}}
 netClock+=dt;if(mode==='multi'&&(netClock>=.05||state.over)){netClock=0;
  if(host){const tiles=[];for(const k of game.dirty){tiles.push([k,state.tiles[k]]);game.dirty.delete(k);if(tiles.length===160)break}room.send({t:'frame',state:game.snapshot(false),tiles})}
  else room.send({t:'input',move:movement(),jump:jumping(),angle,strafe:strafe(),yaw})}
 if(!state||page!=='hud')return;
 draw(state,me,yaw,angle,now/1000);uiClock+=dt;if(uiClock>.1){hud();uiClock=0}if(state.over)finish();
}
window.addEventListener('pagehide',()=>room?.stop());
home();const invite=new URL(location.href).searchParams.get('room');if(invite&&/^[a-z]{4,6}$/.test(invite)){setup('multi');$('word').value=invite}
modeButtons.forEach(button=>button.disabled=false);
requestAnimationFrame(frame);

