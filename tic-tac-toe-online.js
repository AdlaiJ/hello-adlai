/* Online friend mode. No accounts, saved messages, or persistent player data. */
(()=>{
 const style=document.createElement('style');style.textContent='[hidden]{display:none!important}#onlineLobby{padding:16px;border:1px solid #425071;border-radius:14px;margin-bottom:18px}#onlineLobby h2{margin-top:0;font-size:22px}#roomCode:focus-visible{outline:3px solid #ffdc89;outline-offset:3px}';document.head.append(style);
 const panel=document.createElement('section');
 panel.innerHTML=`<div class="actions"><button id="onlineToggle">Play an online friend</button></div><div id="onlineLobby" hidden><h2>Play on different devices</h2><p>Create a room and send its invite link to your friend. You are X; your friend is O. Keep both pages open.</p><div class="actions"><button id="createRoom">Create room</button><button id="leaveRoom">Back to bots</button></div><label for="roomCode">Room code or invite link</label><input id="roomCode" maxlength="250" autocomplete="off" spellcheck="false" style="width:100%;padding:12px;background:#1a243b;color:white;border:1px solid #425071;border-radius:10px"><div class="actions"><button id="joinRoom">Join room</button><button id="copyInvite" disabled>Copy invite</button></div><p id="onlineStatus" role="status" aria-live="polite">Create a room or enter your friend's code.</p><p class="note">Online play uses PeerJS Cloud to connect your browsers. Only share your code with your friend. Some school, work, or mobile networks may block direct connections. Rooms close when either player leaves.</p></div>`;
 document.querySelector('.settings').before(panel);
 const el=id=>document.getElementById(id);
 let active=false,host=false,peer=null,conn=null,connected=false,epoch=0,timeout=null,code='',round=1,pending=false;
 let state={board:Array(9).fill(''),turn:'X',round:1};
 let totals={wins:0,draws:0,losses:0};
 const oldClicks=cells.map(c=>c.onclick),oldNew=el('newRound').onclick,oldReset=el('resetScore').onclick;
 const say=t=>el('onlineStatus').textContent=t;
 const result=()=>TicTacToe.result(state.board);
 const firstPlayer=r=>r%2===1?'X':'O';
 function draw(){
  const r=result(),me=host?'X':'O';
  cells.forEach((c,i)=>{c.textContent=state.board[i];c.className='cell'+(state.board[i]==='O'?' o':'')+(r?.line.includes(i)?' win':'');c.disabled=!connected||pending||!!r||state.turn!==me||!!state.board[i];c.setAttribute('aria-label',`Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${state.board[i]||'empty'}`)});
  el('status').textContent=!connected?'Waiting for connection…':r?(r.winner==='draw'?"It's a draw!":r.winner===me?'You win!':'Your friend wins!'):`${state.turn===me?'Your':'Your friend’s'} turn · ${state.turn}`;
  for(const key of Object.keys(totals))el(key).textContent=totals[key];
  el('newRound').disabled=!connected||!r||pending;
  el('newRound').textContent='Play again';
  el('hint').textContent=`Online friend · Round ${round}: ${firstPlayer(round)} goes first. The starting player switches every round. Both players can request a rematch.`;
 }
 function send(data){if(conn?.open){try{conn.send(data);return true}catch{}}disconnect('Connection lost. Create or join a new room.');return false}
 function scoreEnd(){const r=result();if(r)totals[r.winner==='draw'?'draws':r.winner===(host?'X':'O')?'wins':'losses']++}
 function acceptMove(i,player,r){
  if(!connected||r!==round||!Number.isInteger(i)||i<0||i>8||result()||state.turn!==player||state.board[i])return;
  state.board[i]=player;state.turn=TicTacToe.other(player);scoreEnd();send({type:'state',state});draw();
 }
 function cleanup(){epoch++;clearTimeout(timeout);connected=false;pending=false;const p=peer;peer=null;conn=null;if(p)p.destroy();el('copyInvite').disabled=true;}
 function disconnect(message){cleanup();say(message);if(active)draw();}
 function enable(){if(active)return;active=true;clearTimeout(timer);timer=null;finished=true;el('onlineLobby').hidden=false;el('onlineToggle').hidden=true;document.querySelector('.settings').hidden=true;el('hint').textContent='Online friend · X goes first. Both players can request a new round after the game ends.';el('resetScore').hidden=true;document.querySelector('.scores div:last-child span').textContent='Friend';document.querySelector('main > .note').hidden=true;cells.forEach((c,i)=>c.onclick=()=>{if(c.disabled)return;if(host)acceptMove(i,'X',round);else{pending=true;draw();send({type:'move',index:i,round})}});el('newRound').onclick=()=>{if(!connected||!result()||pending)return;if(host)newRound();else{pending=true;draw();send({type:'rematch',round})}};draw()}
 function newRound(){round++;state={board:Array(9).fill(''),turn:firstPlayer(round),round};send({type:'state',state});draw()}
 function validState(s){return s&&Number.isInteger(s.round)&&s.round>0&&Array.isArray(s.board)&&s.board.length===9&&s.board.every(v=>['','X','O'].includes(v))&&['X','O'].includes(s.turn)}
 function attach(c,token){
  conn=c;
  c.on('open',()=>{if(token!==epoch)return;clearTimeout(timeout);connected=true;pending=false;say(`Connected! You are ${host?'X':'O'}.`);if(host)send({type:'state',state});draw()});
  c.on('data',m=>{if(token!==epoch||!connected||!m||typeof m!=='object')return;
   if(host){if(m.type==='move')acceptMove(m.index,'O',m.round);else if(m.type==='rematch'&&m.round===round&&result())newRound()}
   else if(m.type==='state'&&validState(m.state)){
    const s=m.state,previous=result();
    // Only accept the next legal X/O placement, a clean rematch, or initial sync.
    const changed=s.board.map((v,i)=>v!==state.board[i]?i:-1).filter(i=>i>=0);
    const clean=s.round===round+1&&previous&&s.board.every(v=>!v)&&s.turn===firstPlayer(s.round);
    const step=s.round===round&&!previous&&changed.length===1&&!state.board[changed[0]]&&s.board[changed[0]]===state.turn&&s.turn===TicTacToe.other(state.turn);
    const same=s.round===round&&changed.length===0&&s.turn===state.turn;
    if(!clean&&!step&&!same)return;
    state={board:s.board.slice(),turn:s.turn,round:s.round};round=s.round;pending=false;if(step)scoreEnd();draw();
   }
  });
  c.on('close',()=>{if(token===epoch)disconnect('Your friend disconnected. Create or join a new room to play again.')});
  c.on('error',()=>{if(token===epoch)disconnect('Could not connect. Try another network or create a new room.')});
 }
 let loading;
 function library(){if(window.Peer)return Promise.resolve();if(!loading)loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';s.onload=resolve;s.onerror=()=>{s.remove();loading=null;reject(Error('load'))};document.head.append(s)});return loading}
 const roomWords='acorn amber apple arrow atlas autumn badge bamboo banana basket beach beacon berry birch bloom blossom breeze bridge brook bubble cactus candle canyon castle cedar cherry cloud clover cobalt comet coral cosmic cotton crane creek crown daisy dawn delta desert dragon dream drift eagle earth ember falcon feather fern field flame flight flower forest fossil frost galaxy garden gentle glade globe golden grape grove harbor hazel honey island ivory jacket jasper jewel jungle kitten lagoon lantern lemon lilac lotus lunar mango maple marble meadow melon meteor mint moon moss mountain nectar night noble ocean olive opal orbit orchid otter panda peach pearl pebble pepper petal pigeon planet plume pocket pollen pond prism purple quartz rabbit raven reef ribbon ripple river robin rocket rose ruby saddle safari sage satin seal shadow shell silver sky snow solar spark spice spirit spring spruce square star stone storm stream stripe sugar summit sunset swift temple tiger timber torch trail tulip turtle valley velvet violet walnut water whale willow winter wonder yellow zebra'.split(' ').filter(w=>w.length>=4&&w.length<=6);
 function makeRoomCode(used){
  const available=roomWords.filter(w=>!used.includes(w));
  const limit=Math.floor(4294967296/available.length)*available.length;let random;
  do{random=crypto.getRandomValues(new Uint32Array(1))[0]}while(random>=limit);
  return available[random%available.length];
 }
 async function connect(isHost,joinCode='',used=[]){
  enable();cleanup();host=isHost;round=1;state={board:Array(9).fill(''),turn:'X',round};totals={wins:0,draws:0,losses:0};const token=epoch;say('Connecting…');draw();
  timeout=setTimeout(()=>{if(token===epoch)disconnect('Connection timed out. Check the code and try again; your network may block online play.')},25000);
  try{await library();if(token!==epoch)return;
   code=isHost?makeRoomCode(used):joinCode;
   if(isHost)used.push(code);
   peer=new Peer(isHost?'adlai-ttt-'+code:undefined,{secure:true,debug:0});
   peer.on('open',()=>{if(token!==epoch)return;if(isHost){clearTimeout(timeout);el('roomCode').value=code;el('copyInvite').disabled=false;say('Room ready! Share the invite or code. Waiting for your friend…')}else attach(peer.connect('adlai-ttt-'+code,{reliable:true,serialization:'json'}),token)});
   peer.on('connection',c=>{if(token!==epoch||!host||conn){c.on('open',()=>c.close());return}attach(c,token);timeout=setTimeout(()=>{if(token===epoch&&!connected)disconnect('Your friend could not connect. Create a new room and retry.')},25000)});
   peer.on('error',e=>{if(token!==epoch)return;if(isHost&&e.type==='unavailable-id'){if(used.length<12){connect(true,'',used);return}disconnect('Those room words are busy. Please try Create room again.');return}disconnect(e.type==='peer-unavailable'?'Room not found. Ask your friend to keep their room open and check the code.':'Online service unavailable. Try again or use a different network.')});
   peer.on('disconnected',()=>{if(token===epoch&&!connected)disconnect('Room service disconnected. Please create or join again.')});
  }catch{if(token===epoch)disconnect('Online play could not load. Check your internet connection and try again.')}
 }
 el('onlineToggle').onclick=enable;
 el('createRoom').onclick=()=>connect(true);
 el('roomCode').setAttribute('autocapitalize','none');
 el('roomCode').setAttribute('placeholder','4–6 letter word, like maple');
 el('joinRoom').onclick=()=>{let v=el('roomCode').value.trim();try{if(v.includes('://'))v=new URL(v).searchParams.get('room')||''}catch{}v=v.toLowerCase();if(!/^[a-z]{4,6}$/.test(v)){say('Enter a 4–6 letter room word, or paste an invite link.');return}el('roomCode').value=v;connect(false,v)};
 el('copyInvite').onclick=async()=>{const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('room',code);try{await navigator.clipboard.writeText(u.href);say('Invite copied! Send it to your friend.')}catch{el('roomCode').value=u.href;el('roomCode').select();say('Copy the selected invite link and send it to your friend.')}};
 el('leaveRoom').onclick=()=>{cleanup();active=false;el('onlineLobby').hidden=true;el('onlineToggle').hidden=false;document.querySelector('.settings').hidden=false;el('resetScore').hidden=false;el('resetScore').onclick=oldReset;el('newRound').disabled=false;el('newRound').textContent='New round';el('newRound').onclick=oldNew;cells.forEach((c,i)=>c.onclick=oldClicks[i]);document.querySelector('.scores div:last-child span').textContent='Bot';document.querySelector('main > .note').hidden=false;const u=new URL(location.href);u.searchParams.delete('room');history.replaceState(null,'',u);start()};
 window.addEventListener('pagehide',cleanup);
 const invite=new URL(location.href).searchParams.get('room');if(invite){enable();el('roomCode').value=invite;say('Your friend invited you! Press Join room to play as O.')}
})();
