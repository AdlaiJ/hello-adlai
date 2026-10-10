import { Match } from './chess-match.js';
const $=id=>document.getElementById(id);
const words='acorn amber apple arrow atlas badge bamboo banana basket beach beacon berry birch bloom breeze bridge brook bubble cactus candle canyon castle cedar cherry cloud clover cobalt comet coral cosmic cotton crane creek crown daisy dawn delta desert dragon dream drift eagle earth ember falcon fern field flame flight flower forest fossil frost galaxy garden gentle glade globe golden grape grove harbor hazel honey island ivory jacket jasper jewel jungle kitten lagoon lemon lilac lotus lunar mango maple marble meadow melon meteor mint moon moss nectar night noble ocean olive opal orbit orchid otter panda peach pearl pebble pepper petal pigeon planet plume pocket pollen pond prism purple quartz rabbit raven reef ribbon ripple river robin rocket rose ruby saddle safari sage satin seal shadow shell silver snow solar spark spice spirit spring spruce square star stone storm stream stripe sugar summit sunset swift temple tiger timber torch trail tulip turtle valley velvet violet walnut water whale willow winter wonder yellow zebra'.split(' ');
const names={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'},symbols={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
let match=new Match(),mode='idle',role='host',ready=false,flipped=false,selected=null,promotion=null,pending=false;
let peer=null,connection=null,generation=0,deadline=null,replyTimer=null,room='',loadingPeer;
let lastPeerSeen=0,lastBeat=0;
const colorName=c=>c==='w'?'White':'Black';
const me=()=>match.color(role);
const active=()=>mode==='local'||(mode==='online'&&ready);
const myTurn=()=>active()&&!pending&&!match.ended()&&(mode==='local'||match.chess.turn()===me());
function message(s){$('connection').textContent=s;}
function ending(){
 if(match.resigned)return `${colorName(match.resigned==='w'?'b':'w')} wins by resignation.`;
 if(match.chess.isCheckmate())return `${colorName(match.chess.turn()==='w'?'b':'w')} wins by checkmate!`;
 if(match.chess.isStalemate())return 'Draw — stalemate.';
 if(match.chess.isInsufficientMaterial())return 'Draw — insufficient material.';
 if(match.chess.isThreefoldRepetition())return 'Draw — threefold repetition.';
 if(match.chess.isDraw())return 'Draw — 50-move rule.';
 return '';
}
function draw(){
 const focus=document.activeElement?.dataset?.square;
 const legal=selected&&myTurn()?match.chess.moves({square:selected,verbose:true}):[];
 const last=match.chess.history({verbose:true}).at(-1),frag=document.createDocumentFragment();
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const file=flipped?7-col:col,rank=flipped?row+1:8-row,square=String.fromCharCode(97+file)+rank,piece=match.chess.get(square);
  const button=document.createElement('button');button.dataset.square=square;
  const possible=legal.find(m=>m.to===square);
  button.className='square'+((file+rank)%2===1?' dark':'')+(selected===square?' selected':'')+(possible?' legal':'')+(possible?.captured?' capture':'')+([last?.from,last?.to].includes(square)?' last':'')+(piece?.type==='k'&&piece.color===match.chess.turn()&&match.chess.isCheck()?' check':'');
  button.disabled=!myTurn();button.setAttribute('aria-label',`${square}: ${piece?colorName(piece.color)+' '+names[piece.type]:'empty'}${possible?', legal move':''}`);button.setAttribute('aria-pressed',String(selected===square));
  if(piece){const span=document.createElement('span');span.className='piece '+(piece.color==='w'?'whitePiece':'blackPiece');span.textContent=symbols[piece.type];span.setAttribute('aria-hidden','true');button.append(span)}
  if(row===7||col===0){const tag=document.createElement('span');tag.className='coord';tag.textContent=square;button.append(tag)}
  button.onclick=()=>select(square);frag.append(button);
 }
 $('board').replaceChildren(frag);
 if(focus)$('board').querySelector(`[data-square="${focus}"]`)?.focus({preventScroll:true});
 $('identity').textContent=mode==='local'?`Same device · Round ${match.round}`:mode==='online'?`You are ${colorName(me())} · Round ${match.round}`:'Choose a game';
 $('status').textContent=ending()||(!active()?(mode==='online'?'Waiting for a connection…':'Create or join a room to start.'):pending?'Sending your move…':`${colorName(match.chess.turn())} to move${match.chess.isCheck()?' — CHECK!':''}${mode==='online'?(match.chess.turn()===me()?' · Your turn':' · Friend’s turn'):''}`);
 $('resign').disabled=!active()||match.ended()||pending;
 $('rematch').disabled=!active()||!match.ended()||pending||match.votes.includes(role);
 $('rematch').textContent=match.votes.includes(role)?'Waiting for friend…':match.votes.length?'Accept rematch':'Request rematch';
 $('create').disabled=mode!=='idle';$('join').disabled=mode!=='idle';$('local').disabled=mode!=='idle';$('roomCode').readOnly=mode!=='idle';$('leave').hidden=mode==='idle';$('flip').disabled=mode==='idle';
 const history=match.chess.history();$('moves').textContent=history.length?history.map((move,i)=>i%2===0?`${Math.floor(i/2)+1}. ${move}`:move+'\n').join(' '):'Your moves will appear here.';$('moves').scrollTop=$('moves').scrollHeight;
}
function clearSelection(){selected=null;promotion=null;if($('promotion').open)$('promotion').close();}
function select(square){
 if(!myTurn())return;
 const piece=match.chess.get(square);
 if(selected===square){selected=null;draw();return}
 if(selected){const candidates=match.chess.moves({square:selected,verbose:true}).filter(m=>m.to===square);
  if(candidates.length){if(candidates.some(m=>m.promotion)){promotion={from:selected,to:square};$('promotion').showModal();return}act({type:'move',from:selected,to:square});return}
 }
 selected=piece?.color===match.chess.turn()?square:null;draw();
}
function send(data){if(!connection?.open)return false;try{connection.send(data);return true}catch{return false}}
function stopConnection(){generation++;clearTimeout(deadline);clearTimeout(replyTimer);const old=peer;peer=null;connection=null;ready=false;pending=false;if(old)old.destroy();$('copy').disabled=true;clearSelection();}
function lost(text){stopConnection();message(text+' Leave this game to create or join a new room.');draw();}
function sendState(){if(!send({type:'state',version:1,state:match.snapshot()}))lost('Connection lost.');}
function act(action){
 const request={...action,round:match.round,ply:match.chess.history().length};
 if(!active()||pending)return;
 clearSelection();
 if(mode==='local'){
  const actor=match.chess.turn()===match.color('host')?'host':'guest';
  if(action.type==='rematch'){match.apply(request,'host');match.apply(request,'guest');}
  else match.apply(request,actor);
 }else if(role==='host'){if(match.apply(request,'host'))sendState();}
 else{pending=true;if(!send({type:'action',version:1,action:request})){lost('Connection lost.');return}replyTimer=setTimeout(()=>lost('Your friend stopped responding.'),12000);}
 if(mode==='online')flipped=me()==='b';draw();
}
function acceptState(s){
 try{
  if(ready&&(s.round<match.round||s.round>match.round+1||s.revision<match.revision))throw Error('Stale state');
  const next=Match.restore(s);
  if(!ready&&(next.round!==1||next.chess.history().length))throw Error('Room already started');
  match=next;ready=true;pending=false;clearTimeout(deadline);clearTimeout(replyTimer);clearSelection();flipped=me()==='b';message(`Connected · Room: ${room}. Share only with your friend.`);draw();
 }catch{lost('The games could not stay in sync.')}
}
function attach(c,token){
 connection=c;
 c.on('open',()=>{if(token!==generation)return;lastPeerSeen=Date.now();if(!send({type:'hello',version:1}))lost('Connection lost.')});
 c.on('data',data=>{
  if(token!==generation||!data||typeof data!=='object')return;
  if(data.version!==1){lost('Your friend has an older game version. Both refresh.');return}
  lastPeerSeen=Date.now();
  if(data.type==='ping'){send({type:'pong',version:1});return}
  if(data.type==='pong')return;
  if(data.type==='hello'){if(role==='host'&&!ready){ready=true;clearTimeout(deadline);message(`Connected · Room: ${room}. You start as White.`);sendState();draw()}return}
  if(role==='guest'&&data.type==='state')acceptState(data.state);
  else if(role==='host'&&ready&&data.type==='action'){
   const oldRound=match.round;
   if(match.apply(data.action,'guest')){clearSelection();if(oldRound!==match.round)flipped=me()==='b';}
   sendState();draw();
  }
 });
 c.on('close',()=>{if(token===generation)lost('Your friend disconnected.')});
 c.on('error',()=>{if(token===generation)lost('Could not connect to your friend.')});
}
function loadPeer(){
 if(window.Peer)return Promise.resolve();
 if(!loadingPeer)loadingPeer=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';script.onload=resolve;script.onerror=()=>{loadingPeer=null;script.remove();reject(Error('load'))};document.head.append(script)});
 return loadingPeer;
}
function randomWord(used){const available=words.filter(w=>!used.includes(w));let n;const limit=Math.floor(4294967296/available.length)*available.length;do{n=crypto.getRandomValues(new Uint32Array(1))[0]}while(n>=limit);return available[n%available.length]}
async function connect(host,joinWord='',used=[]){
 stopConnection();const token=generation;mode='online';role=host?'host':'guest';match=new Match();flipped=!host;room='';message('Connecting to the room service…');draw();
 deadline=setTimeout(()=>{if(token===generation)lost('Connection timed out. Check the room word or try another network.')},25000);
 try{
  await loadPeer();if(token!==generation)return;
  room=host?randomWord(used):joinWord;if(host)used.push(room);
  peer=new Peer(host?'adlai-chess-'+room:undefined,{secure:true,debug:0});
  peer.on('open',()=>{if(token!==generation)return;
   if(host){clearTimeout(deadline);$('roomCode').value=room;$('copy').disabled=false;message(`Room ready: ${room}. Send the word or invite to your friend.`)}
   else attach(peer.connect('adlai-chess-'+room,{reliable:true,serialization:'json'}),token);
  });
  peer.on('connection',c=>{if(token!==generation||!host||connection){c.on('open',()=>c.close());return}attach(c,token);deadline=setTimeout(()=>{if(token===generation&&!ready)lost('Your friend could not connect.')},25000)});
  peer.on('error',error=>{if(token!==generation)return;if(host&&error.type==='unavailable-id'&&used.length<12){connect(true,'',used);return}lost(error.type==='peer-unavailable'?'Room not found. Ask your friend to keep their page open.':error.type==='unavailable-id'?'Those room words are busy.':'Online service unavailable. Please try again or use another network.')});
  peer.on('disconnected',()=>{if(token===generation&&!ready)lost('Room service disconnected.')});
 }catch{if(token===generation)lost('Online play could not load. Check your internet connection.')}
}
$('create').onclick=()=>connect(true);
$('join').onclick=()=>{let value=$('roomCode').value.trim();try{if(value.includes('://'))value=new URL(value).searchParams.get('room')||''}catch{value=''}value=value.toLowerCase();if(!/^[a-z]{4,6}$/.test(value)){message('Enter a 4–6 letter room word or an invite link.');return}$('roomCode').value=value;connect(false,value)};
$('copy').onclick=async()=>{const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('room',room);try{await navigator.clipboard.writeText(url.href);message('Invite copied! Send it to your friend.')}catch{$('roomCode').value=url.href;$('roomCode').select();message('Copy the selected invite link and send it to your friend.')}};
$('local').onclick=()=>{stopConnection();mode='local';match=new Match();role='host';flipped=false;message('Take turns on this device. No internet connection is needed.');draw()};
$('leave').onclick=()=>{if(active()&&!match.ended()&&!confirm('Leave this game? Your current match will end.'))return;stopConnection();mode='idle';match=new Match();flipped=false;room='';$('roomCode').value='';const url=new URL(location.href);url.searchParams.delete('room');history.replaceState(null,'',url);message('Create a room or enter your friend’s word.');draw()};
$('resign').onclick=()=>{if(confirm('Resign this game? Your opponent will win.'))act({type:'resign'})};
$('rematch').onclick=()=>act({type:'rematch'});
$('flip').onclick=()=>{flipped=!flipped;draw()};
$('cancelPromotion').onclick=()=>{promotion=null;$('promotion').close()};
$('promotion').addEventListener('cancel',()=>{promotion=null});
document.querySelectorAll('[data-piece]').forEach(button=>button.onclick=()=>{if(promotion)act({type:'move',...promotion,promotion:button.dataset.piece})});
window.addEventListener('pagehide',stopConnection);
setInterval(()=>{if(mode!=='online'||!ready)return;const now=Date.now();if(now-lastPeerSeen>90000){lost('Your friend stopped responding.');return}if(now-lastBeat>10000){lastBeat=now;send({type:'ping',version:1})}},5000);
$('loadingError').hidden=true;draw();
const invite=new URL(location.href).searchParams.get('room');if(invite){$('roomCode').value=invite;message('Your friend invited you. Press Join room to play.');}
