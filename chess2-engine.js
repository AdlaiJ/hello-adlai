// Original Chess 2 v2.4 rules. Independent rules implementation; no official art.
export const ARMIES={classic:'Classic',nemesis:'Nemesis',empowered:'Empowered',reaper:'Reaper',kings:'Two Kings',animals:'Animals'};
export const ARMY_HELP={classic:'Standard pieces; the only army that can castle.',nemesis:'An untouchable queen threatens kings. Pawns can also step toward an enemy king.',empowered:'Adjacent rooks, bishops and knights share their native moves. The queen moves one square.',reaper:'The queen teleports, except to the enemy back rank, and cannot take kings. Ghost rooks teleport without capturing.',kings:'Two warrior kings, an optional extra king move each turn, and a whirlwind attack. Both kings must cross to invade.',animals:'Wild horses take friendly pieces; tigers pounce and return; elephants rampage; the queen moves like a rook or knight.'};
export const other=c=>c==='w'?'b':'w';
const xy=s=>[s.charCodeAt(0)-97,Number(s[1])-1],sq=(x,y)=>String.fromCharCode(97+x)+(y+1),inside=(x,y)=>x>=0&&x<8&&y>=0&&y<8;
const dirs=[[1,0],[-1,0],[0,1],[0,-1]],diags=[[1,1],[1,-1],[-1,1],[-1,-1]],steps=[...dirs,...diags],knights=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
const distance=(a,b)=>Math.max(...xy(a).map((v,i)=>Math.abs(v-xy(b)[i])));
const clone=x=>JSON.parse(JSON.stringify(x));
export async function seal(value,salt,context){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([context,value,salt])))),x=>x.toString(16).padStart(2,'0')).join('')}
export class Chess2 {
 constructor(locked={}) {this.board={};this.armies={w:null,b:null};this.locked=locked;this.turn='w';this.kingTurn=false;this.phase='army';this.commit={};this.reveal={};this.stones={w:3,b:3};this.rights={w:{k:true,q:true},b:{k:true,q:true}};this.ep=null;this.ply=0;this.half=0;this.log=[];this.result=null;this.duel=null;this.sequence=0;this.repeats={};this.last=null;}
 setup(w,b){if(!ARMIES[w]||!ARMIES[b])throw Error('army');this.armies={w,b};this.board={};for(const c of ['w','b']){const back=c==='w'?0:7,pawn=c==='w'?1:6;for(let x=0;x<8;x++){this.board[sq(x,back)]={c,t:'rnbqkbnr'[x]==='q'&&this.armies[c]==='kings'?'k':'rnbqkbnr'[x]};this.board[sq(x,pawn)]={c,t:'p'}}}this.phase='move';this.recordPosition();}
 kings(c){return Object.keys(this.board).filter(s=>this.board[s].c===c&&this.board[s].t==='k')}
 special(p,type,army){return p?.t===type&&this.armies[p.c]===army}
 canTake(from,to,threat=false){const p=this.board[from],q=this.board[to];if(!p||!q)return false;
  if(this.special(q,'r','reaper'))return false;
  if(this.special(q,'q','nemesis')&&p.t!=='k')return false;
  if(this.special(q,'r','animals')&&distance(from,to)>2)return false;
  if(this.special(p,'q','nemesis'))return q.c!==p.c&&q.t==='k'&&threat;
  if(this.special(p,'q','reaper')&&q.t==='k')return false;
  if(q.t==='k'&&!threat)return false;
  if(q.c===p.c)return q.t!=='k'&&this.armies[p.c]==='animals'&&['r','n'].includes(p.t);
  return true;
 }
 pseudo(from,threat=false){const p=this.board[from];if(!p)return [];const [x,y]=xy(from),a=this.armies[p.c],moves=[];
  const add=(to,extra={})=>{const q=this.board[to];if(!q||this.canTake(from,to,threat))moves.push({from,to,captures:q?[to]:[],...extra})};
  const ray=(vectors,max=7)=>{for(const [dx,dy] of vectors)for(let n=1;n<=max;n++){const nx=x+n*dx,ny=y+n*dy;if(!inside(nx,ny))break;const to=sq(nx,ny);add(to);if(this.board[to])break}};
  const leap=vectors=>{for(const [dx,dy] of vectors)if(inside(x+dx,y+dy))add(sq(x+dx,y+dy))};
  if(p.t==='p'){
   const dy=p.c==='w'?1:-1;
   for(const dx of [-1,1])if(inside(x+dx,y+dy)){const to=sq(x+dx,y+dy);if(this.board[to]&&this.canTake(from,to,threat))add(to);else if(!threat&&this.ep?.to===to&&this.ep.color!==p.c&&this.board[this.ep.pawn]?.t==='p')moves.push({from,to,captures:[this.ep.pawn],ep:true})}
   if(!threat&&inside(x,y+dy)&&!this.board[sq(x,y+dy)]){add(sq(x,y+dy));if(a!=='nemesis'&&y===(p.c==='w'?1:6)&&!this.board[sq(x,y+2*dy)])add(sq(x,y+2*dy),{double:true})}
   if(!threat&&a==='nemesis')for(const king of this.kings(other(p.c))){const [kx,ky]=xy(king);for(const [dx,dy2] of steps){const nx=x+dx,ny=y+dy2;if(inside(nx,ny)&&nx>=Math.min(x,kx)&&nx<=Math.max(x,kx)&&ny>=Math.min(y,ky)&&ny<=Math.max(y,ky)&&!this.board[sq(nx,ny)])add(sq(nx,ny))}}
  }else if(a==='reaper'&&['q','r'].includes(p.t)){
   if(!threat)for(let nx=0;nx<8;nx++)for(let ny=0;ny<8;ny++){const to=sq(nx,ny);if(to===from||(p.t==='q'&&ny===(p.c==='w'?7:0)))continue;if(p.t==='r'){if(!this.board[to])add(to)}else add(to)}
  }else if(p.t==='k'){
   leap(steps);
   if(!threat&&a==='kings'&&!this.kings(p.c).some(k=>k!==from&&distance(from,k)===1)){
    const captures=Object.keys(this.board).filter(s=>s!==from&&distance(from,s)===1&&!this.special(this.board[s],'r','reaper'));
    if(captures.length&&!captures.some(s=>this.board[s].t==='k'))moves.push({from,to:from,captures,whirlwind:true});
   }
  }else if(a==='animals'&&p.t==='r'){
   for(const [dx,dy] of dirs){const path=[];let blocked=false;for(let n=1;n<=3;n++){if(!inside(x+n*dx,y+n*dy))break;path.push(sq(x+n*dx,y+n*dy))}
    let captured=false;const caps=[];
    for(const to of path){if(this.board[to]){if(!this.canTake(from,to,threat)){blocked=true;break}captured=true;caps.push(to)}if(!captured)add(to)}
    if(captured&&!blocked)moves.push({from,to:path.at(-1),captures:caps,rampage:true,path});
   }
  }else if(a==='animals'&&p.t==='b'){ray(diags,2);for(const m of moves)if(m.captures.length)m.tiger=true;
  }else if(a==='animals'&&p.t==='q'){ray(dirs);leap(knights);
  }else if(a==='empowered'&&p.t==='q'){leap(steps);
  }else{
   const powers=new Set([p.t]);if(a==='empowered'&&['r','b','n'].includes(p.t))for(const [dx,dy] of dirs){const q=inside(x+dx,y+dy)?this.board[sq(x+dx,y+dy)]:null;if(q?.c===p.c&&['r','b','n'].includes(q.t))powers.add(q.t)}
   if(powers.has('q')||powers.has('r'))ray(dirs);if(powers.has('q')||powers.has('b'))ray(diags);if(powers.has('n'))leap(knights);
  }
  const unique=[...new Map(moves.map(m=>[m.to+(m.whirlwind?'!':''),m])).values()];
  if(threat)return unique;
  return unique.flatMap(m=>p.t==='p'&&xy(m.to)[1]===(p.c==='w'?7:0)?(a==='kings'?['r','b','n']:['q','r','b','n']).map(promotion=>({...m,promotion})):m);
 }
 checked(c){const kings=this.kings(c);if(kings.length!==(this.armies[c]==='kings'?2:1))return true;for(const from of Object.keys(this.board))if(this.board[from].c!==c&&this.pseudo(from,true).some(m=>m.captures.some(s=>kings.includes(s))))return true;return false}
 simulated(m){const state=this.board;this.board=clone(state);const p=this.board[m.from];for(const s of m.captures)delete this.board[s];delete this.board[m.from];this.board[m.tiger||m.whirlwind?m.from:m.to]={...p,t:m.promotion||p.t};if(m.castle){this.board[m.rookTo]=this.board[m.rookFrom];delete this.board[m.rookFrom]}return state;}
 legal(from){if(this.phase!=='move'||this.result)return [];const p=this.board[from];if(!p||p.c!==this.turn||(this.kingTurn&&p.t!=='k'))return [];
  const candidates=this.pseudo(from);const rank=p.c==='w'?'1':'8';
  if(p.t==='k'&&this.armies[p.c]==='classic'&&from==='e'+rank&&!this.checked(p.c))for(const side of ['k','q']){
   const rookFrom=(side==='k'?'h':'a')+rank,pass=(side==='k'?['f','g']:['d','c']),empty=side==='k'?['f','g']:['d','c','b'];
   if(!this.rights[p.c][side]||this.board[rookFrom]?.t!=='r'||this.board[rookFrom]?.c!==p.c||empty.some(f=>this.board[f+rank]))continue;
   const safe=pass.every(f=>{const old=this.simulated({from,to:f+rank,captures:[]});const yes=!this.checked(p.c);this.board=old;return yes});
   if(safe)candidates.push({from,to:pass[1]+rank,captures:[],castle:true,rookFrom,rookTo:pass[0]+rank});
  }
  return candidates.filter(m=>{const old=this.simulated(m);const valid=!this.checked(p.c);this.board=old;return valid});
 }
 allLegal(){return Object.keys(this.board).flatMap(s=>this.legal(s))}
 key(){return JSON.stringify([Object.entries(this.board).sort(),this.turn,this.kingTurn,this.rights,this.ep,this.stones])}
 recordPosition(){if(this.result)return;const key=this.key();this.repeats[key]=(this.repeats[key]||0)+1;if(this.repeats[key]>=3)this.result={winner:null,reason:'threefold repetition'};if(this.half>=100&&!this.kingTurn)this.result={winner:null,reason:'50-move rule'};}
 revoke(square,p){const rank=p.c==='w'?'1':'8';if(p.t==='k')this.rights[p.c]={k:false,q:false};if(square==='a'+rank)this.rights[p.c].q=false;if(square==='h'+rank)this.rights[p.c].k=false;}
 remove(square,captor){const p=this.board[square];if(!p)return;this.revoke(square,p);if(p.t==='p'&&p.c!==captor)this.stones[captor]=Math.min(6,this.stones[captor]+1);delete this.board[square];}
 finish(){const t=this.transaction,c=t.piece.c;this.last={from:t.move.from,to:t.move.to};this.log.push(`${c==='w'?'White':'Black'}: ${t.move.whirlwind?'whirlwind '+t.move.from:t.move.from+'–'+t.move.to+(t.move.promotion?'='+t.move.promotion.toUpperCase():'')}${t.lost?' (lost in duel)':''}`);this.ply++;this.phase='move';this.duel=null;this.transaction=null;
  if(this.checked(c)){this.result={winner:other(c),reason:'duel exposed the king'};return}
  const invaded=this.kings(c).every(s=>c==='w'?xy(s)[1]>=4:xy(s)[1]<=3);
  if(invaded){this.result={winner:c,reason:'midline invasion'};return}
  this.half=t.piece.t==='p'||t.move.captures.length?0:this.half+(this.kingTurn?0:1);
  if(this.armies[c]==='kings'&&!this.kingTurn){this.kingTurn=true;}
  else{this.kingTurn=false;this.turn=other(c);}
  // No legal moves is a loss, whether in check or not. Extra king turns may be skipped.
  if(!this.kingTurn&&!this.allLegal().length)this.result={winner:other(this.turn),reason:this.checked(this.turn)?'checkmate':'no legal moves'};
  this.recordPosition();
 }
 nextCapture(){const t=this.transaction;if(!t)return;
  while(t.index<t.move.captures.length){const target=t.move.captures[t.index],q=this.board[target];if(!q){t.index++;continue}
   const ranks={p:1,n:2,b:2,r:3,q:4,k:9},cost=ranks[t.piece.t]>ranks[q.t]?1:0;
   if(q.c!==t.piece.c&&t.piece.t!=='k'&&q.t!=='k'&&this.stones[q.c]>0&&this.stones[q.c]>=cost&&(this.stones[t.piece.c]>0||this.stones[q.c]>cost)){this.phase='offer';this.duel={id:++this.sequence,attacker:t.piece.c,defender:q.c,target,cost,commit:{},reveal:{}};return}
   this.remove(target,t.piece.c);t.index++;
  }
  const m=t.move;delete this.board[m.from];this.board[m.tiger||m.whirlwind?m.from:m.to]={...t.piece,t:m.promotion||t.piece.t};
  if(m.castle){this.board[m.rookTo]=this.board[m.rookFrom];delete this.board[m.rookFrom];}
  this.finish();
 }
 resolveDuel(){const d=this.duel,t=this.transaction,ab=d.reveal[d.attacker].value,db=d.reveal[d.defender].value;
  this.stones[d.attacker]-=ab;this.stones[d.defender]-=db;
  this.log.push(`Duel: ${ab} vs ${db} — ${db>ab?'defender wins; both pieces fall':'attacker wins'}.`);
  this.remove(d.target,d.attacker);t.index++;
  if(db>ab){this.remove(t.move.from,d.defender);t.lost=true;this.finish();return}
  if(ab===0&&db===0){this.phase='bluff';return}
  this.nextCapture();
 }
 async apply(a,c,context=''){
  if(!a||!['w','b'].includes(c)||this.result)return false;
  if(a.type==='resign'){this.result={winner:other(c),reason:'resignation'};return true}
  if(this.phase==='army'){
   if(a.type==='armyCommit'&&!this.commit[c]&&/^[a-f0-9]{64}$/.test(a.hash)){this.commit[c]=a.hash;return true}
   if(a.type==='armyReveal'&&this.commit.w&&this.commit.b&&!this.reveal[c]&&ARMIES[a.value]&&(!this.locked[c]||this.locked[c]===a.value)&&typeof a.salt==='string'&&a.salt.length===32&&await seal(a.value,a.salt,context+'army')===this.commit[c]){
    this.reveal[c]={value:a.value};if(this.reveal.w&&this.reveal.b)this.setup(this.reveal.w.value,this.reveal.b.value);return true;
   }return false;
  }
  if(this.phase==='move'){
   if(c!==this.turn||a.ply!==this.ply)return false;
   if(a.type==='skip'&&this.kingTurn){this.kingTurn=false;this.turn=other(c);this.ply++;this.log.push(`${c==='w'?'White':'Black'}: extra king turn skipped`);if(!this.allLegal().length)this.result={winner:c,reason:this.checked(this.turn)?'checkmate':'no legal moves'};this.recordPosition();return true}
   if(a.type!=='move'||typeof a.from!=='string'||typeof a.to!=='string')return false;
   const move=this.legal(a.from).find(m=>m.to===a.to&&(m.promotion||null)===(a.promotion||null)&&!!m.whirlwind===!!a.whirlwind);if(!move)return false;
   const piece=clone(this.board[a.from]);this.revoke(a.from,piece);
   if(!this.kingTurn)this.ep=move.double?{to:sq(xy(move.from)[0],(xy(move.from)[1]+xy(move.to)[1])/2),pawn:move.to,color:c}:null;
   this.transaction={move:clone(move),piece,index:0,lost:false};this.nextCapture();return true;
  }
  const d=this.duel;if(!d||a.duel!==d.id)return false;
  if(this.phase==='offer'&&c===d.defender&&a.type==='duelChoice'){
   if(a.accept===false){this.remove(d.target,d.attacker);this.transaction.index++;this.nextCapture();return true}
   if(a.accept!==true)return false;this.stones[c]-=d.cost;
   // No bidding is possible against an empty purse: a one-stone bid wins automatically.
   if(this.stones[d.attacker]===0){if(this.stones[c]<1){this.stones[c]+=d.cost;return false}d.reveal={[d.attacker]:{value:0},[c]:{value:1}};this.resolveDuel();return true}
   if(this.stones[c]===0){d.reveal={[d.attacker]:{value:1},[c]:{value:0}};this.resolveDuel();return true}
   this.phase='bid';return true;
  }
  if(this.phase==='bid'){
   if(a.type==='bidCommit'&&!d.commit[c]&&/^[a-f0-9]{64}$/.test(a.hash)){d.commit[c]=a.hash;return true}
   if(a.type==='bidReveal'&&d.commit.w&&d.commit.b&&!d.reveal[c]&&Number.isInteger(a.value)&&a.value>=0&&a.value<=Math.min(2,this.stones[c])&&typeof a.salt==='string'&&a.salt.length===32&&await seal(a.value,a.salt,context+'duel'+d.id)===d.commit[c]){d.reveal[c]={value:a.value};if(d.reveal.w&&d.reveal.b)this.resolveDuel();return true}return false;
  }
  if(this.phase==='bluff'&&c===d.attacker&&a.type==='bluff'&&['gain','drain'].includes(a.choice)){if(a.choice==='gain')this.stones[c]=Math.min(6,this.stones[c]+1);else this.stones[d.defender]=Math.max(0,this.stones[d.defender]-1);this.nextCapture();return true}
  return false;
 }
}

export class Match2 {
 constructor(){this.round=1;this.revision=0;this.game=new Chess2();this.votes=[];this.events=[];}
 color(player){return (player==='host')===(this.round%2===1)?'w':'b'}
 async apply(action,player){if(!action||!['host','guest'].includes(player)||action.round!==this.round)return false;
  if(action.type==='rematch'){if(!this.game.result||this.votes.includes(player))return false;this.votes.push(player);if(this.votes.length===2){const winner=this.game.result.winner,army=winner?this.game.armies[winner]:null;this.round++;this.game=new Chess2(winner?{[other(winner)]:army}:{});this.votes=[];}}
  else if(!await this.game.apply(action,this.color(player),'round'+this.round+':'))return false;
  this.revision++;this.events.push({action:clone(action),player});return true;
 }
 snapshot(){return {events:clone(this.events),revision:this.revision}}
 static async restore(snapshot){if(!snapshot||!Array.isArray(snapshot.events)||snapshot.events.length>6000||snapshot.revision!==snapshot.events.length)throw Error('Invalid history');const match=new Match2();for(const e of snapshot.events)if(!await match.apply(e.action,e.player))throw Error('Invalid action');return match;}
}
