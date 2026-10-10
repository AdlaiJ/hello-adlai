import { Chess } from './chess-engine.js';

export class Match {
  constructor() { this.round=1; this.revision=0; this.chess=new Chess(); this.resigned=null; this.votes=[]; }
  color(player) { return (player==='host')===(this.round%2===1)?'w':'b'; }
  ended() { return !!this.resigned || this.chess.isGameOver(); }
  apply(message,player) {
    if(!message || !['host','guest'].includes(player) || message.round!==this.round) return false;
    if(message.type==='rematch') {
      if(!this.ended() || this.votes.includes(player)) return false;
      this.votes.push(player);
      if(this.votes.length===2) { this.round++; this.chess.reset(); this.resigned=null; this.votes=[]; }
    } else {
      if(this.ended() || message.ply!==this.chess.history().length) return false;
      if(message.type==='resign') this.resigned=this.color(player);
      else if(message.type==='move') {
        if(this.chess.turn()!==this.color(player) || !/^[a-h][1-8]$/.test(message.from) || !/^[a-h][1-8]$/.test(message.to)) return false;
        if(message.promotion!==undefined && !['q','r','b','n'].includes(message.promotion)) return false;
        try { this.chess.move({from:message.from,to:message.to,promotion:message.promotion}); } catch { return false; }
      } else return false;
    }
    this.revision++; return true;
  }
  snapshot() { return {round:this.round,revision:this.revision,moves:this.chess.history(),resigned:this.resigned,votes:[...this.votes]}; }
  static restore(s) {
    if(!s || !Number.isSafeInteger(s.round)||s.round<1 || !Number.isSafeInteger(s.revision)||s.revision<0 || !Array.isArray(s.moves)||s.moves.length>2000 || ![null,'w','b'].includes(s.resigned) || !Array.isArray(s.votes)||s.votes.length>1 || s.votes.some(v=>!['host','guest'].includes(v))) throw Error('Invalid game state');
    const match=new Match();match.round=s.round;match.revision=s.revision;
    for(const move of s.moves) { if(typeof move!=='string'||move.length>12||match.chess.isGameOver()) throw Error('Invalid move history'); match.chess.move(move,{strict:true}); }
    match.resigned=s.resigned;match.votes=[...s.votes];
    if(match.votes.length&&!match.ended()) throw Error('Premature rematch');
    return match;
  }
}
