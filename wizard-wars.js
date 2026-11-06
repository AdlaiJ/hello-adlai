import {setupControls} from './wizard-controls.js?v=controls';
import {SPELLS} from './wizard-spells.js?v=mana-value';
import {MAPS,makeTiles,createGame,campaignTiles,dungeonTiles} from './wizard-engine.js?v=void-abduction';

import {markChangedChunk,T} from './wizard-world.js?v=labyrinth-keepers';
import {openRoom} from './wizard-room.js?v=mana-value';
const $=id=>document.getElementById(id),spells=new Map(SPELLS.map(s=>[s.id,s])),canvas=$('stage');
let draw;
const modeButtons=document.querySelectorAll('#home .modes button');
modeButtons.forEach(button=>button.disabled=true);
try{const {makeRenderer}=await import('./wizard-3d.js?v=void-abduction');draw=makeRenderer(canvas).draw}
catch(error){document.querySelector('#home p').textContent='The 3D arena could not load. Check your connection and enable WebGL, then refresh.';throw error}

let mode='waves',page='',settings,room=null,host=false,code='',selected=[],locked=false,game=null,state=null,me=0,armed=false,yaw=0,angle=0,netClock=0,message='',messageUntil=0;
const seats=new Map(),sizes={'1v1':2,'1v1v1':3,'2v2':4,'3v3':6,'4v4':8,'Co-op 2':2,'Co-op 3':3,'Co-op 4':4};
const colors=['Blue','Red','Gold'];
const keys=new Set(),pressedActions=new Map();
let heldSpell=-1;
for(const map of MAPS)$('map').add(new Option(map,map));
const schools=[...new Set(SPELLS.map(s=>s.category))].sort();
for(const cat of schools)$('school').add(new Option(cat,cat));
function show(id){page=id;$('combatFeedback').hidden=id!=='hud';if(id!=='hud'&&windowAim)setWindowAim(false);if(id!=='hud'&&document.pointerLockElement===canvas)document.exitPointerLock();document.body.classList.toggle('playing',id==='hud');for(const x of ['home','setup','book','end','hud'])$(x).hidden=x!==id;document.querySelector('main').style.display=id==='hud'?'none':''}
function clean(){resetFeedback();heldSpell=-1;room?.stop();room=null;game=state=null;code='';locked=false;seats.clear();me=0;keys.clear();message='';messageUntil=0;yaw=0;angle=0;armed=false}
function setup(m){clean();mode=m;show('setup');$('map').parentElement.hidden=m==='campaign';$('formatLabel').hidden=m!=='multi';$('modeName').textContent={campaign:'Campaign · Eight stages',waves:'Singleplayer · Waves',multi:'Multiplayer · Room match',sandbox:'Sandbox · Training grounds'}[m];
 $('proceed').textContent=m==='multi'?'Create room':'Choose spells';$('joining').hidden=m!=='multi';$('setupStatus').textContent=m==='multi'?'The host sets the rules. Choose a match format and share the room word with your friends.':'Choose how many spells you want to bring.';$('join').disabled=$('proceed').disabled=false}
$('multiplayer').onclick=()=>setup('multi');$('waves').onclick=()=>setup('waves');$('sandbox').onclick=()=>setup('sandbox');
$('campaign').onclick=()=>{setup('campaign');$('count').value=6;$('mana').value=1000;$('setupStatus').textContent='Battle through eight stages: defeat the Crimson King, follow him through a portal, and confront the massive void entity. Health and mana refill between stages. The campaign chooses its own maps.'};
function home(){clean();show('home')}
$('coop').onclick=()=>{setup('multi');$('format').value='Co-op 2';$('count').value=6;$('mana').value=1000;$('map').parentElement.hidden=true;$('setupStatus').textContent='Choose 2–4 players, create a room, and share its word. Everyone chooses spells and locks in. Fallen allies return at the next stage; the host must stay connected.'};
$('format').onchange=()=>{$('map').parentElement.hidden=$('format').value.startsWith('Co-op')};
document.querySelectorAll('.back').forEach(b=>b.onclick=home);$('leave').onclick=home;
function readSettings(){const count=$('count').valueAsNumber,mana=$('mana').valueAsNumber;if(!Number.isInteger(count)||count<1||count>10||!Number.isInteger(mana)||mana<10||mana>5000){$('setupStatus').textContent='Choose 1–10 spells and 10–5000 mana.';return null}return {count,mana,format:$('format').value,map:$('map').value}}
function book(){selected=[];locked=false;$('school').value='All';$('spellSearch').value='';show('book');$('copy').hidden=!(host&&mode==='multi');$('roomLabel').textContent=mode==='multi'?settings.format+' room · '+code:mode==='waves'?'Singleplayer · Waves':mode==='campaign'?'Campaign · The Crimson King':'Sandbox';
 $('rules').textContent=settings.map+' · '+settings.mana+' mana · Choose '+settings.count+' spells. Selection order sets your number keys.';$('bookStatus').textContent='Regain 0.5% of your maximum mana every second, plus 10% every 10 seconds. F then a spell banks 5% of your pool per second. Storing half the cost halves both the mana due and the cast time. Fully stored spells cast instantly for free.';drawBook()}
const starterKits={
 'All-rounder':{tip:'Use Witchspark for quick shots.',order:'witchspark pocket-poultice thimble-ward fold-step glass-fan rampart foxstep north-star iron-choir crater-bell'},
 'Close combat':{tip:'Summon Glass Knife, then press its slot again to swing. Aim for the back.',order:'glass-knife foxstep thimble-ward pocket-poultice vault-kick undertow rime-axe iron-choir winter-ring smoke-skin'},
 'Keep your distance':{tip:'Pin an enemy with Root Needle to give yourself room to aim.',order:'root-needle witchspark north-star rampart fold-step glass-fan rime-owl lantern-well silver-skewer corner-pocket'}
};
function starterIds(kit){
 const affordable=spell=>spell.cost<=settings.mana;
 const fallback=SPELLS.filter(s=>!s.passwordProtected).filter(affordable).sort((a,b)=>a.cost-b.cost).map(s=>s.id);
 return [...new Set([...kit.order.split(' ').filter(id=>affordable(spells.get(id))),...fallback])].slice(0,settings.count);
}
function previewStarter(){
 const kit=starterKits[$('starterStyle').value],ids=starterIds(kit);
 $('starterTip').textContent=kit.tip;
 $('starterSlots').textContent=ids.map((id,i)=>slotLabel(i)+' · '+spells.get(id).name).join('   /   ');
 $('starterStyle').disabled=locked;
 const equipped=ids.length===selected.length&&ids.every((id,i)=>selected[i]===id);
 $('equipStarter').disabled=locked||equipped;
 $('equipStarter').textContent=equipped?'Equipped':'Equip loadout';
}
$('starterStyle').onchange=previewStarter;
$('equipStarter').onclick=()=>{if(locked)return;selected=starterIds(starterKits[$('starterStyle').value]);drawBook();$('bookStatus').textContent='Loadout equipped. Choose Lock in spells to play, or unselect a spell to swap it.'};
let requestedSecret=null;
function requestSecretSpell(id){requestedSecret=id;$('spellPassword').value='';$('passwordError').textContent='';$('passwordTitle').textContent='Equip '+spells.get(id).name;$('spellUnlock').showModal();$('spellPassword').focus()}
$('cancelUnlock').onclick=()=>{$('spellUnlock').close();requestedSecret=null};
$('unlockForm').onsubmit=e=>{e.preventDefault();if($('spellPassword').value!=='GANDALFTIME'){$('passwordError').textContent='Incorrect password. Try again.';return}
 if(page==='book'&&!locked&&requestedSecret&&!selected.includes(requestedSecret)&&selected.length<settings.count)selected.push(requestedSecret);
 $('spellUnlock').close();requestedSecret=null;$('spellPassword').value='';drawBook();
};
const searchText=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
function drawBook(){const focused=document.activeElement?.dataset?.spell;previewStarter();const list=$('cards');list.replaceChildren();
 const terms=searchText($('spellSearch').value).split(' ').filter(Boolean);let matches=0;
 $('clearSpellSearch').disabled=!$('spellSearch').value;
 $('grandToggle').setAttribute('aria-pressed',String($('school').value==='grand'));
 for(const school of schools){
  const filter=$('school').value;
  if(filter!=='All'&&filter!=='grand'&&filter!==school)continue;
  const entries=SPELLS.filter(spell=>spell.category===school&&(filter!=='grand'||spell.grand)&&terms.every(term=>searchText(spell.name+' '+spell.id+' '+spell.category+' '+spell.description).includes(term))),heading=document.createElement('h3');
  matches+=entries.length;if(!entries.length)continue;heading.className='schoolHeading';heading.textContent=school+' · '+entries.length;list.append(heading);
  for(const s of entries){
 const i=selected.indexOf(s.id),b=document.createElement('button');b.dataset.spell=s.id;b.setAttribute('aria-pressed',String(i>=0));b.disabled=locked||(i<0&&selected.length>=settings.count);
 const title=document.createElement('strong'),stats=document.createElement('small'),desc=document.createElement('span');title.textContent=(i>=0?'['+slotLabel(i)+'] ':'')+(s.passwordProtected?'🔒 ':'')+s.symbol+' '+s.name;stats.textContent=s.category+' · '+(s.channel?s.channel.mana+' mana/second · Hold to cast':s.cost+' mana · '+(s.time?s.time+'s':'Instant'));desc.textContent=s.description;b.append(title,stats,desc);b.onclick=()=>{if(i<0&&s.passwordProtected){requestSecretSpell(s.id);return}if(i<0)selected.push(s.id);else selected.splice(i,1);drawBook()};list.append(b)}
 }
 $('spellSearchResults').textContent=matches?matches+' spells shown': 'No spells match. Try another search or choose All schools.';
 $('selection').textContent=selected.length+' / '+settings.count+' bound';$('ready').disabled=locked||selected.length!==settings.count;
 if(focused){if(!$('ready').disabled)$('ready').focus();else [...list.querySelectorAll('button')].find(b=>b.dataset.spell===focused)?.focus()}}
$('spellSearch').oninput=()=>{drawBook();$('cards').scrollTop=0};
$('clearSpellSearch').onclick=()=>{$('spellSearch').value='';drawBook();$('spellSearch').focus()};
$('school').onchange=drawBook;
$('grandToggle').onclick=()=>{$('school').value=$('school').value==='grand'?'All':'grand';drawBook();$('cards').scrollTop=0};
function validIds(ids){return Array.isArray(ids)&&ids.length===settings.count&&new Set(ids).size===ids.length&&ids.every(id=>spells.has(id))}
function notify(text){message=text;messageUntil=performance.now()+1600}
function start(){heldSpell=-1;show('hud');keys.clear();armed=false;yaw=state.players[me].yaw;angle=0;netClock=0;
 canvas.tabIndex=-1;canvas.focus();
 $('practice').hidden=mode!=='sandbox';$('slots').replaceChildren();
 selected.forEach((id,i)=>{const b=document.createElement('button');if(spells.get(id).channel){
  b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);holdSpell(i)};
  b.onlostpointercapture=()=>releaseSpell(i);
  b.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();holdSpell(i)}};
  b.onkeyup=e=>{if(e.key===' '||e.key==='Enter')releaseSpell(i)};
  b.onblur=()=>releaseSpell(i);
 }else b.onclick=()=>act(i);b.title=spells.get(id).description;$('slots').append(b)});hud()}
function lobby(){
 const total=sizes[settings.format],joined=1+seats.size,ready=Number(locked)+[...seats.values()].filter(Boolean).length;
 const text=joined+' / '+total+' wizards joined · '+ready+' ready';
 $('bookStatus').textContent=text;room.send({t:'lobby',text});
 if(game||!locked||ready!==total)return;
 const loadouts=[selected,...Array.from({length:total-1},(_,i)=>seats.get(i+1))];
 game=createGame(settings,loadouts,settings.coop?'campaign':'multi');state=game.state;
 room.send({t:'start',state:game.snapshot(false)});start()
}
$('ready').onclick=()=>{if(locked||!validIds(selected))return;locked=true;drawBook();
 if(mode==='multi'){if(host)lobby();else room.send({t:'ready',ids:selected})}else{game=createGame(settings,[selected],mode);state=game.state;start()}};
function network(isHost,word=''){
 host=isHost;me=host?0:1;code=word;$('join').disabled=$('proceed').disabled=true;$('setupStatus').textContent='Contacting the room service…';
 room=openRoom(host,word,{code(c){code=c;book();lobby()},started:()=>!!game,
 status(message){if(page==='setup')$('setupStatus').textContent=message},
 connected(seat){if(host){seats.set(seat,null);room.send({t:'rules',settings,seat},seat);lobby()}},
 left(seat){if(!seats.delete(seat))return;if(game){game.state.players[seat].hp=0;game.state.players[seat].disconnected=true}else lobby()},
 error(msg){if(page==='end')return;setup('multi');$('setupStatus').textContent=msg},
 data(m,seat){
  if(host){
   if(!seats.has(seat))return;
   if(m.t==='ready'&&!game&&!seats.get(seat)&&validIds(m.ids)){seats.set(seat,m.ids);lobby();return}
   if(!game||game.state.over)return;
   if(m.t==='input')game.input(seat,m.move,m.jump===true,m.angle,m.strafe,m.yaw,m.channel);
   if(m.t==='blood')game.fireBlood(seat);
   if(m.t==='sword')game.fireSword(seat);
   if(m.t==='block')game.fireBlock(seat);
   if(m.t==='cast')game.command(seat,m.slot,m.store===true);
  }else if(m.t==='full'){setup('multi');$('setupStatus').textContent='That room is full or already playing.'}
  else if(m.t==='lobby'&&page==='book')$('bookStatus').textContent=m.text;
  else if(m.t==='rules'&&page==='setup'&&Object.hasOwn(sizes,m.settings?.format)&&Number.isInteger(m.seat)&&m.seat>0&&m.seat<sizes[m.settings.format]&&MAPS.includes(m.settings?.map)&&Number.isInteger(m.settings.count)&&m.settings.count>=1&&m.settings.count<=10&&Number.isInteger(m.settings.mana)&&m.settings.mana>=10&&m.settings.mana<=5000){settings=m.settings;me=m.seat;book()}
  else if(m.t==='start'&&locked&&page==='book'&&m.state?.map===settings.map){state={...m.state,tiles:makeTiles(settings.map),terrainVersion:0,changedChunks:new Map()};start()}
  else if(m.t==='frame'&&page==='hud'&&m.state&&Array.isArray(m.tiles)){
   if(settings.coop&&m.state.stage!==state.stage){state.tiles=campaignTiles(m.state.map,m.state.stage);state.changedChunks=new Map();state.terrainVersion++}
   if(m.state.dungeonSeed&&m.state.dungeonSeed!==state.dungeonSeed){state.tiles=dungeonTiles(m.state.dungeonSeed);state.changedChunks=new Map();state.terrainVersion++}
   for(const [i,v,boneYaw] of m.tiles){state.tiles[i]=v;if(Number.isFinite(boneYaw))(state.tiles.boneWalls??=new Map()).set(i,boneYaw);else state.tiles.boneWalls?.delete(i);markChangedChunk(state.changedChunks,i)}state={...m.state,tiles:state.tiles,changedChunks:state.changedChunks,terrainVersion:state.terrainVersion+Number(m.tiles.length>0)};if(state.over)finish()}
 }},isHost?sizes[settings.format]:2);
}
$('proceed').onclick=()=>{settings=readSettings();if(!settings)return;settings.coop=mode==='multi'&&settings.format.startsWith('Co-op');if(settings.coop)settings.map='Bellfall Keep';if(mode==='multi')network(true);else book()};
$('join').onclick=()=>{const word=$('word').value.trim().toLowerCase();if(!/^[a-z]{4,6}$/.test(word)){$('setupStatus').textContent='Enter the 4–6 letter room word.';return}network(false,word)};
$('copy').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('room',code);try{await navigator.clipboard.writeText(url.href);$('bookStatus').textContent='Invite link copied.'}catch{$('bookStatus').textContent='Share room word '+code}};
function holdSpell(i){
 if(armed){armed=false;notify('Hold to cast this spell. It uses mana per second.');return}
 heldSpell=i;
}
function releaseSpell(i){
 if(heldSpell!==i)return;heldSpell=-1;
 if(game)game.input(me,movement(),jumping(),angle,strafe(),yaw,-1);
 else room?.send({t:'input',move:0,jump:false,angle,strafe:0,yaw,channel:-1});
}
function act(i){if(page!=='hud'||!selected[i])return;if(spells.get(selected[i]).channel){holdSpell(i);return}heldSpell=-1;const store=armed;armed=false;const p=state.players[me],spell=spells.get(selected[i]);if(!store&&spell.id==="bottle-rocket"&&p.rocketSpent){notify("Land to recharge Bottle Rocket");return}if(!store&&!(spell.id==="skull-throne"&&p.onThrone)&&!(p.weapon?.id===spell.id&&p.weapon.strikes>0)&&p.mana+.0001<spell.cost-p.bank[i])notify('Need more mana for '+spell.name);
 if(game){game.input(me,movement(),jumping(),angle,strafe(),yaw,heldSpell);game.command(me,i,store)}else{room.send({t:'input',move:movement(),jump:jumping(),angle,strafe:strafe(),yaw,channel:heldSpell});room.send({t:'cast',slot:i,store})}}

let feedbackPrevious=null,hurtUntil=0,hitUntil=0,hitTotal=0,hurtTotal=0,lastHurt=0,lastHit=0;
function resetFeedback(){feedbackPrevious=null;hurtUntil=hitUntil=hitTotal=hurtTotal=0;$('hurtGlow').style.opacity=0;$('hurtText').textContent='';$('hitConfirm').style.opacity=0}
function combatFeedback(now){
 const p=state?.players[me];if(!p)return;
 const current=[p.damageTaken||0,p.shieldTaken||0,p.damageDealt||0,p.kills||0];
 if(feedbackPrevious&&current.every((v,i)=>v>=feedbackPrevious[i])){
  const hurt=current[0]-feedbackPrevious[0],shield=current[1]-feedbackPrevious[1],hit=current[2]-feedbackPrevious[2],kill=current[3]>feedbackPrevious[3];
  if(hurt+shield>0){
   if(now-lastHurt>600)hurtTotal=0;hurtTotal+=hurt+shield;lastHurt=now;hurtUntil=now+650;
   $('hurtText').textContent=(hurt>0?'HURT −':'SHIELD −')+Math.max(1,Math.round(hurtTotal));
   $('hurtText').style.color=hurt>0?'#ffb3bb':'#a8eaff';
   $('hurtGlow').style.boxShadow='inset 0 0 95px 25px '+(hurt>0?'#dc234e':'#32a9e5');
   $('hurtGlow').style.background=hurt>0?'radial-gradient(ellipse,transparent 45%,#b0002344)':'none';
  }
  if(hit>0){
   if(now-lastHit>600)hitTotal=0;hitTotal+=hit;lastHit=now;hitUntil=now+(kill?1100:700);
   $('hitAmount').textContent=(kill?'DEFEATED · ':'HIT · ')+Math.max(1,Math.round(hitTotal));
   $('hitConfirm').style.color=kill?'#ffca70':'#fff0a8';
  }
 }
 feedbackPrevious=current;
 $('hurtGlow').style.opacity=Math.max(0,(hurtUntil-now)/650)*.75;
 $('hurtText').style.opacity=Math.min(1,Math.max(0,(hurtUntil-now)/250));
 $('hitConfirm').style.opacity=Math.min(1,Math.max(0,(hitUntil-now)/250));
 const fraction=Math.max(0,Math.min(1,p.hp/p.maxHp));
 $('healthFill').style.width=(fraction*100)+'%';$('healthFill').style.background=fraction<.25?'#ff627a':'#69e0a5';
 const label='HP '+Math.ceil(p.hp)+' / '+p.maxHp;if($('healthLabel').textContent!==label)$('healthLabel').textContent=label;
}

function hud(){if(!state)return;const p=state.players[me];if(!p)return;
 $('vitals').textContent=colors[p.side]+' · HP '+Math.ceil(p.hp)+' / '+p.maxHp+' · Mana '+Math.floor(p.mana)+' / '+p.maxMana+(p.shield?' · Shield '+Math.ceil(p.shield):'');
 const boss=state.players.find(q=>q.boss&&q.hp>0);$('bossHealth').hidden=!boss;
 if(boss){$('bossHealth').textContent=(boss.voidBoss?'VOID SOVEREIGN ':'CRIMSON KING ')+Math.ceil(boss.hp)+' / '+boss.maxHp+(boss.phase===2?' · ENRAGED':'')+(boss.attackLabel?' · '+boss.attackLabel:'');$('bossHealth').style.background='linear-gradient(90deg,#a51b3b '+boss.hp/boss.maxHp*100+'%,#281e29 0)';$('bossHealth').style.padding='7px 14px';$('bossHealth').style.border='1px solid #ff7e95'}
 $('opponent').textContent=(mode==='campaign'||settings.coop)?'Stage '+state.stage+'/8 · '+state.stageName+(state.stage!==4&&state.stage!==8?' · Battle '+state.wave+'/2':''):mode==='waves'?'Wave '+state.wave:mode==='multi'?settings.format+' · '+(p.hp<=0?'Eliminated · ':'')+state.players.filter(q=>q.side!==p.side&&q.hp>0).length+' rivals alive':'Sandbox';
 if(state.dungeonSeed)$('opponent').textContent+=' · Iron Labyrinth · Hall '+String.fromCharCode(65+Math.floor(p.z/(16*T)))+(1+Math.floor(p.x/(20*T)));
 const rivals=state.players.filter(q=>q.side!==p.side&&q.hp>0);
 if(rivals.length){
  const distance=q=>Math.hypot(q.x-p.x,q.z-p.z),rival=rivals.reduce((a,b)=>distance(a)<distance(b)?a:b);
  const turn=Math.atan2(rival.z-p.z,rival.x-p.x)-yaw;
  const bearing=['ahead','ahead right','right','behind right','behind','behind left','left','ahead left'][(Math.round(turn/(Math.PI/4))%8+8)%8];
  $('opponent').textContent+=' · '+(rival.monster?'Monster ':'Rival ')+Math.round(distance(rival)/T)+' blocks '+bearing;
 }
 $('signal').textContent=state.cinematicText?state.cinematicText:state.time<state.arrivalUntil?'Safe arrival · Enemies attack in '+Math.ceil(state.arrivalUntil-state.time)+'s':settings.coop&&p.hp<=0?'Downed · Your allies can finish the stage to revive you':armed?'STORE · Choose a spell':p.channel>=0?'Channeling '+spells.get(p.ids[p.channel]).name:p.pending>=0?'Casting '+spells.get(p.ids[p.pending]).name+' · '+p.cast.toFixed(1)+'s':p.store>=0?'Storing '+spells.get(p.ids[p.store]).name+' · '+Math.floor(100*p.bank[p.store]/spells.get(p.ids[p.store]).cost)+'% charged':performance.now()<messageUntil?message:'Mana pulse in '+Math.ceil(10-state.time%10)+'s';
 selected.forEach((id,i)=>{const b=$('slots').children[i],s=spells.get(id);b.textContent=slotLabel(i)+' '+s.symbol+' '+s.name+' · '+Math.ceil(Math.max(0,s.cost-p.bank[i]))+(p.bank[i]>0?' ◈':'');if(p.weapon?.id===id&&p.weapon.strikes>0)b.textContent=slotLabel(i)+' Swing '+s.name+' · '+p.weapon.strikes+' left';if(id==='blood-arsenal'&&p.bloodAmmo)b.textContent=slotLabel(i)+' Stack Arsenal · '+p.bloodAmmo+'/30 · '+Math.ceil(Math.max(0,s.cost-p.bank[i]))+' mana';if(id==='skull-throne'&&p.onThrone)b.textContent=p.throneVolley>state.time?'Conjuring six swords…':controls.label('g')+' / click: six-sword volley';if(id==='quarry-volley'&&p.blocks?.length)b.textContent=slotLabel(i)+' Gather blocks · '+p.blocks.length+'/9 · '+Math.ceil(Math.max(0,s.cost-p.bank[i]))+' mana';if(s.channel)b.textContent=slotLabel(i)+' '+s.name+' · HOLD · '+s.channel.mana+' mana/s';b.title=s.description+' · Stored '+p.bank[i].toFixed(1)+' / '+s.cost})}
function finish(){show('end');$('result').textContent=state.over;$('resultInfo').textContent=mode==='waves'?'Reached wave '+state.wave+' in '+Math.floor(state.time)+' seconds.':settings.map+' · '+Math.floor(state.time)+' seconds';keys.clear()}
$('dummy').onclick=()=>{if(game&&game.state.players.length<24)game.spawn()};
$('refill').onclick=()=>{const p=state.players[0];p.hp=p.maxHp;p.mana=p.maxMana};$('restore').onclick=()=>{state.tiles=makeTiles(settings.map);state.dungeonSeed=0;state.zones=state.zones.filter(z=>!z.dungeonFixture);state.summons=state.summons.filter(f=>!f.dungeonPost);state.terrainVersion++};$('change').onclick=()=>{game=state=null;book()};
function movement(){return Number(keys.has('w'))-Number(keys.has('s'))}
function strafe(){return Number(keys.has('d'))-Number(keys.has('a'))}
function jumping(){return keys.has(' ')}
function turn(dx,dy,gain=controls.mouse){yaw+=dx*gain;angle=Math.max(-1.35,Math.min(1.35,angle+dy*gain))}
function fireHeld(){
 if(page!=='hud'||!state)return;const p=state.players[me];
 if(p.weapon?.strikes>0){const slot=selected.indexOf(p.weapon.id);if(slot>=0){act(slot);return}}
 const action=p.bloodAmmo?'blood':p.onThrone?'sword':p.blocks?.length?'block':null;
 if(!action){notify('Use a spell slot to cast. '+controls.label('g')+' fires held weapons or blocks.');return}
 if(game){game.input(me,movement(),jumping(),angle,strafe(),yaw,heldSpell);if(action==='blood')game.fireBlood(me);else if(action==='sword')game.fireSword(me);else game.fireBlock(me)}
 else{room.send({t:'input',move:movement(),jump:jumping(),angle,strafe:strafe(),yaw,channel:heldSpell});room.send({t:action})}
}
addEventListener('keydown',e=>{if(page!=='hud'||e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const raw=e.key.toLowerCase();if(controls.open)return;if(raw==='escape'&&windowAim){setWindowAim(false);return}const k=controls.action(raw);if(!k)return;
 if(e.target.closest?.('button,input,select')&&(raw===' '||raw==='enter'||raw.startsWith('arrow')))return;
 if(k===' '||k.startsWith('arrow'))e.preventDefault();if(e.repeat)return;pressedActions.set(e.code,k);keys.add(k);
 if(k==='g'){e.preventDefault();fireHeld();return}
 if(k==='r'){angle=0;return}
 if(k==='escape'&&windowAim){setWindowAim(false);return}
 if(k==='+'||k==='='||k==='-'){e.preventDefault();zoomBy(k==='-'?1:-1);return}
 if(k==='shift'){toggleShiftLock();return}
 if(k==='f')armed=!armed;else if(/^\d$/.test(k))act((Number(k)+9)%10);
});addEventListener('keyup',e=>{const k=pressedActions.get(e.code);pressedActions.delete(e.code);if(!k)return;keys.delete(k);if(/^\d$/.test(k))releaseSpell((Number(k)+9)%10)});
function clearHeld(){pressedActions.clear();keys.clear();releaseSpell(heldSpell)}
addEventListener('blur',clearHeld);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearHeld()});
document.querySelectorAll('[data-control]').forEach(b=>{b.onpointerdown=e=>{b.setPointerCapture(e.pointerId);keys.add(b.dataset.control)};b.onlostpointercapture=()=>keys.delete(b.dataset.control)});$('touchStore').onclick=()=>armed=!armed;
let drag=null;
const distances=[0,18,32,47,65,86,110,140,175];
let zoomLevel=4,cameraDistance=65;
function zoomBy(step){
 zoomLevel=Math.max(0,Math.min(distances.length-1,zoomLevel+step));
 $('zoomIn').disabled=zoomLevel===0;
 $('zoomOut').disabled=zoomLevel===distances.length-1;
}
$('zoomIn').onclick=()=>zoomBy(-1);
$('zoomOut').onclick=()=>zoomBy(1);
let wheelTravel=0,wheelTime=0;
canvas.addEventListener('wheel',e=>{
 if(page!=='hud'||e.ctrlKey||!e.deltaY)return;
 e.preventDefault();
 if(e.timeStamp-wheelTime>180||Math.sign(e.deltaY)!==Math.sign(wheelTravel))wheelTravel=0;
 wheelTime=e.timeStamp;
 wheelTravel+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?100:1);
 if(Math.abs(wheelTravel)>=32){zoomBy(Math.sign(wheelTravel));wheelTravel=0}
},{passive:false});
const lockButton=$('shiftLock');
let windowAim=false;
function setWindowAim(on){
 windowAim=on;drag=null;canvas.style.cursor=on?'none':'';
 lockButton.setAttribute('aria-pressed',String(on));
 lockButton.textContent=on?'Shift Lock: Window aim':'Shift Lock: Off';
}
function lockFailed(){
 if(page!=='hud'||document.pointerLockElement===canvas)return;
 setWindowAim(true);notify('Window aim active. Move the mouse over the arena. Esc releases.');
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
 if(page==='hud'&&!controls.open&&(document.pointerLockElement===canvas||(windowAim&&e.target===canvas)))turn(e.movementX*.004,e.movementY*.004);
});
canvas.onpointerdown=e=>{
 if(page==='hud'&&e.button===0){canvas.focus();if(state.players[me]?.weapon?.strikes>0||state.players[me]?.bloodAmmo||state.players[me]?.onThrone||state.players[me]?.blocks?.length)fireHeld()}
 if(page!=='hud'||windowAim||document.pointerLockElement===canvas)return;canvas.setPointerCapture(e.pointerId);drag=[e.clientX,e.clientY]};
canvas.onpointermove=e=>{if(!drag||page!=='hud'||windowAim||document.pointerLockElement===canvas)return;turn((e.clientX-drag[0])*.007,(e.clientY-drag[1])*.006);drag=[e.clientX,e.clientY]};
canvas.onlostpointercapture=()=>drag=null;
let prev=performance.now(),acc=0,uiClock=0;
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.1,(now-prev)/1000);prev=now;
 if(document.hidden&&(mode!=='multi'||page!=='hud'))return;
 if(controls.open&&page==='hud'&&mode!=='multi')return;
 if(page!=='hud'){draw(null,0,0,0,now/1000);return}
 turn((Number(keys.has('arrowright'))-Number(keys.has('arrowleft')))*dt*2.1,(Number(keys.has('arrowdown'))-Number(keys.has('arrowup')))*dt*1.4,controls.keyboard);
 if(game){game.input(me,movement(),jumping(),angle,strafe(),yaw,heldSpell);acc+=dt;while(acc>=1/60){game.tick(1/60);acc-=1/60}}
 netClock+=dt;if(mode==='multi'&&(netClock>=.05||state.over)){netClock=0;
  if(host){const tiles=[];for(const k of game.dirty){tiles.push(state.tiles.boneWalls?.has(k)?[k,state.tiles[k],state.tiles.boneWalls.get(k)]:[k,state.tiles[k]]);game.dirty.delete(k);if(tiles.length===160)break}room.send({t:'frame',state:game.snapshot(false),tiles})}
  else room.send({t:'input',move:movement(),jump:jumping(),angle,strafe:strafe(),yaw,channel:heldSpell})}
 if(!state||page!=='hud'||document.hidden)return;
 combatFeedback(now);
 cameraDistance+=(distances[zoomLevel]-cameraDistance)*(1-Math.exp(-14*dt));
 draw(state,me,state.cutscene?Math.atan2(state.cutscene.z-state.players[me].z,state.cutscene.x+95-state.players[me].x):yaw,state.cutscene?-.15:angle,now/1000,state.cutscene?140:cameraDistance);uiClock+=dt;if(uiClock>.1){hud();uiClock=0}if(state.over)finish();
}
window.addEventListener('pagehide',()=>room?.stop());
function slotLabel(i){return controls.label(String((i+1)%10))}
function refreshHints(){const key=id=>controls.label(id);$('controlHint').textContent=['w','a','s','d'].map(key).join('/')+' move · '+key(' ')+' jump · '+key('g')+' fire · '+key('f')+' store · '+key('r')+' level aim';if(page==='hud')hud()}
const controls=setupControls(()=>{clearHeld();setWindowAim(false);if(document.pointerLockElement===canvas)document.exitPointerLock()},refreshHints,()=>{if(page==='hud')canvas.focus()});
refreshHints();home();const invite=new URL(location.href).searchParams.get('room');if(invite&&/^[a-z]{4,6}$/.test(invite)){setup('multi');$('word').value=invite}
modeButtons.forEach(button=>button.disabled=false);
requestAnimationFrame(frame);

