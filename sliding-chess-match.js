// Sliding 2x2 chess tiles, inspired by xkcd #3139. House rules are documented in the UI.
import { Chess2 } from './chess2-engine.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const xy=s=>[s.charCodeAt(0)-97,Number(s[1])-1];
const square=(x,y)=>String.fromCharCode(97+x)+(y+1);
const tileAt=s=>{const [x,y]=xy(s);return Math.floor(y/2)*4+Math.floor(x/2)};
const opposite=c=>c==='w'?'b':'w';
class Board extends Chess2 {
 constructor(){super();this.setup('classic','classic');this.tiles=Array.from({length:16},(_,i)=>i===6?null:i);this.result=null;}
 exists(s){return this.tiles[tileAt(s)]!==null;}
 clearPath(from,to){const [x,y]=xy(from),[tx,ty]=xy(to),dx=Math.sign(tx-x),dy=Math.sign(ty-y);if(dx&&dy&&Math.abs(tx-x)!==Math.abs(ty-y))return true;for(let a=x+dx,b=y+dy;a!==tx||b!==ty;a+=dx,b+=dy)if(!this.exists(square(a,b)))return false;return this.exists(to);}
 pseudo(from,threat=false){return super.pseudo(from,threat).filter(m=>this.exists(m.to)&&(!(this.board[from].t==='p'&&m.double&&this.board[from].moved))&&(this.board[from].t==='n'||this.clearPath(from,m.to)));}
 legal(from){return super.legal(from).filter(m=>!m.castle||(this.clearPath(m.from,m.to)&&this.clearPath(m.rookFrom,m.rookTo)));}
 adjacent(){const hole=this.tiles.indexOf(null);return this.tiles.map((v,i)=>i).filter(i=>this.tiles[i]!==null&&Math.abs(i%4-hole%4)+Math.abs(Math.floor(i/4)-Math.floor(hole/4))===1);}
 shifted(tile){const hole=this.tiles.indexOf(null),dx=(hole%4-tile%4)*2,dy=(Math.floor(hole/4)-Math.floor(tile/4))*2;const board=copy(this.board);for(const s of Object.keys(this.board))if(tileAt(s)===tile)delete board[s];for(const [s,p] of Object.entries(this.board))if(tileAt(s)===tile){const [x,y]=xy(s);board[square(x+dx,y+dy)]={...p,moved:true};if(p.t==='p'&&y+dy===(p.c==='w'?7:0))board[square(x+dx,y+dy)].t='q';}const tiles=[...this.tiles];tiles[hole]=tiles[tile];tiles[tile]=null;return {board,tiles};}
 legalSlides(){if(this.result)return [];return this.adjacent().filter(tile=>{const oldBoard=this.board,oldTiles=this.tiles,next=this.shifted(tile);this.board=next.board;this.tiles=next.tiles;const safe=!this.checked(this.turn);this.board=oldBoard;this.tiles=oldTiles;return safe;});}
}
export class SlidingChess {
 constructor(){this.reset();}
 reset(){this.g=new Board();this.entries=[];this.repeats={};this.half=0;this.reason=null;this.record();}
 turn(){return this.g.turn;}
 get(s){const p=this.g.board[s];return p?{type:p.t,color:p.c}:undefined;}
 exists(s){return this.g.exists(s);}
 tileAt(s){return tileAt(s);}
 tileId(s){return this.g.tiles[tileAt(s)];}
 slides(){return this.reason?[]:this.g.legalSlides();}
 history(options={}){return options.verbose?copy(this.entries):this.entries.map(e=>e.san);}
 moves({square:from,verbose=false}={}){if(this.reason)return [];const moves=from?this.g.legal(from):this.g.allLegal();return moves.map(m=>verbose?{...copy(m),captured:m.captures.length?this.g.board[m.captures[0]]?.t:undefined}:m.from+'-'+m.to);}
 isCheck(){return this.g.checked(this.g.turn);}
 isCheckmate(){return this.reason==='checkmate';}
 isStalemate(){return this.reason==='stalemate';}
 isInsufficientMaterial(){return false;} // Tile transport can make orthodox material tests misleading.
 isThreefoldRepetition(){return this.reason==='threefold repetition';}
 isDraw(){return !!this.reason&&this.reason!=='checkmate';}
 isGameOver(){return !!this.reason;}
 key(){return JSON.stringify([Object.entries(this.g.board).sort().map(([s,p])=>[s,p.c,p.t,p.t==='p'?!!p.moved:false]),this.g.tiles,this.turn(),this.g.rights,this.g.ep]);}
 fen(){return this.key();}
 record(){const key=this.key();this.repeats[key]=(this.repeats[key]||0)+1;}
 finish(entry,resetClock){this.entries.push(entry);this.half=resetClock?0:this.half+1;this.g.turn=opposite(this.turn());this.record();if(!this.g.allLegal().length&&!this.g.legalSlides().length)this.reason=this.isCheck()?'checkmate':'stalemate';else if(this.repeats[this.key()]>=3)this.reason='threefold repetition';else if(this.half>=100)this.reason='50-move rule';}
 move(action){if(this.reason)throw Error('Game ended');const m=this.g.legal(action.from).find(m=>m.to===action.to&&(m.promotion||null)===(action.promotion||null));if(!m)throw Error('Illegal move');const p=this.g.board[m.from];this.g.revoke(m.from,p);for(const s of m.captures)this.g.remove(s,p.c);delete this.g.board[m.from];this.g.board[m.to]={...p,t:m.promotion||p.t,moved:true};if(m.castle){this.g.board[m.rookTo]={...this.g.board[m.rookFrom],moved:true};delete this.g.board[m.rookFrom];}const [x,y]=xy(m.from);this.g.ep=m.double?{to:square(x,(y+xy(m.to)[1])/2),pawn:m.to,color:p.c}:null;this.finish({type:'move',from:m.from,to:m.to,promotion:m.promotion,san:m.from+(m.captures.length?'×':'–')+m.to+(m.promotion?'='+m.promotion.toUpperCase():'')},p.t==='p'||!!m.captures.length);}
 slide(tile){if(!Number.isInteger(tile)||!this.slides().includes(tile))throw Error('Illegal tile slide');const hole=this.g.tiles.indexOf(null);const contents=Object.entries(this.g.board).filter(([s])=>tileAt(s)===tile);for(const [s,p] of contents)this.g.revoke(s,p);const next=this.g.shifted(tile);this.g.board=next.board;this.g.tiles=next.tiles;this.g.ep=null;const label=i=>String.fromCharCode(65+i%4)+(Math.floor(i/4)+1);this.finish({type:'slide',tile,fromTile:tile,toTile:hole,san:'Tile '+label(tile)+' → '+label(hole)},contents.some(([,p])=>p.t==='p'));}
}
export class Match {
 constructor(){this.round=1;this.revision=0;this.chess=new SlidingChess();this.resigned=null;this.votes=[];}
 color(player){return (player==='host')===(this.round%2===1)?'w':'b';}
 ended(){return !!this.resigned||this.chess.isGameOver();}
 apply(m,player){if(!m||!['host','guest'].includes(player)||m.round!==this.round)return false;
  if(m.type==='rematch'){if(!this.ended()||this.votes.includes(player))return false;this.votes.push(player);if(this.votes.length===2){this.round++;this.chess.reset();this.resigned=null;this.votes=[];}}
  else{if(this.ended()||m.ply!==this.chess.history().length)return false;if(m.type==='resign')this.resigned=this.color(player);else{if(this.chess.turn()!==this.color(player))return false;try{if(m.type==='move'&&/^[a-h][1-8]$/.test(m.from)&&/^[a-h][1-8]$/.test(m.to))this.chess.move(m);else if(m.type==='slide')this.chess.slide(m.tile);else return false;}catch{return false;}}}this.revision++;return true;}
 snapshot(){return {round:this.round,revision:this.revision,moves:this.chess.history({verbose:true}),resigned:this.resigned,votes:[...this.votes]};}
 static restore(s){if(!s||!Number.isSafeInteger(s.round)||s.round<1||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.moves)||s.moves.length>2000||![null,'w','b'].includes(s.resigned)||!Array.isArray(s.votes)||s.votes.length>1||s.votes.some(v=>!['host','guest'].includes(v)))throw Error('Invalid snapshot');const m=new Match();m.round=s.round;m.revision=s.revision;for(const entry of s.moves){if(entry.type==='slide')m.chess.slide(entry.tile);else if(entry.type==='move')m.chess.move(entry);else throw Error('Invalid action');}m.resigned=s.resigned;m.votes=[...s.votes];if(m.votes.length&&!m.ended())throw Error('Premature rematch');return m;}
}
