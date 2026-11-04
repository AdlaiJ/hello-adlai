import {SPELLS} from './wizard-spells.js';
import {W,H,D,T,makeTiles,markChangedChunk} from './wizard-world.js';
export {MAPS,makeTiles} from './wizard-world.js';
const byId=new Map(SPELLS.map(s=>[s.id,s]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const midX=W*T/2,midZ=D*T/2;
export function createGame(settings,loadouts,mode){
 const s={map:settings.map,tiles:makeTiles(settings.map),players:[],summons:[],changedChunks:new Map(),shots:[],effects:[],zones:[],time:0,wave:0,over:'',mode};
 const dirty=new Set();s.terrainVersion=0;
 const inputs=[],maxMana=settings.mana;let regen=0,waveWait=0,nextSummon=0;
 function actor(side,x,ids,bot=false){
  const p={side,x,y:320,z:midZ,vz:0,yaw:side?Math.PI:0,vx:0,vy:0,hp:100,maxHp:100,mana:maxMana,maxMana,shield:0,aim:0,ids:[...ids],bank:ids.map(()=>0),store:-1,cast:0,pending:-1,castingAngle:0,statuses:{},bot,ground:false,brain:1};
  inputs.push({strafe:0,move:0,jump:false});s.players.push(p);return p;
 }
 actor(0,midX-300,loadouts[0]);
 if(mode==='multi')actor(1,midX+300,loadouts[1]);
 function fx(x,y,r,color,kind='burst',z=midZ){s.effects.push({x,y,z,r,color,kind,life:.45,maxLife:.45})}
 const index=(x,y,z)=>Math.floor(x/T)+W*(Math.floor(y/T)+H*Math.floor(z/T));
 function solid(x,y,z){return x>=0&&x<W*T&&y>=0&&y<540&&z>=0&&z<D*T&&s.tiles[index(x,y,z)]>0}
 function setBlock(k,hp){if(s.tiles[k]===hp)return;s.tiles[k]=hp;s.terrainVersion++;markChangedChunk(s.changedChunks,k);if(mode==='multi')dirty.add(k)}
 function blocked(x,y,z){for(const dx of [-5,5])for(const dz of [-5,5])for(const dy of [-1,-12,-24])if(solid(x+dx,y+dy,z+dz))return true;return false}
 function move(p,dx,dy,dz=0){
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))/4));
  for(let i=0;i<n;i++){
   const x=clamp(p.x+dx/n,8,W*T-8);if(!blocked(x,p.y,p.z))p.x=x;else p.vx=0;
   const z=clamp(p.z+dz/n,8,D*T-8);if(!blocked(p.x,p.y,z))p.z=z;else p.vz=0;
   const y=Math.max(24,p.y+dy/n);if(!blocked(p.x,y,p.z))p.y=y;else{if(dy>0)p.ground=true;p.vy=0}
  }
 }
 function damage(p,n){
  if(p.hp<=0||p.statuses.phased>0||n<=0)return;
  n*=p.statuses.armor>0?.5:1;
  const spent=Math.min(n,p.shield);p.shield-=spent;p.hp=Math.max(0,p.hp-n+spent);
 }
 const enemies=p=>s.players.concat(s.summons).filter(q=>q.side!==p.side&&q.hp>0);
 function tileDamage(x,y,r,n,z){
  for(let d=clamp(Math.floor((z-r)/T),0,D-1);d<=clamp(Math.floor((z+r)/T),0,D-1);d++)
  for(let j=clamp(Math.floor((y-r)/T),0,H-1);j<=clamp(Math.floor((y+r)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-r)/T),0,W-1);i<=clamp(Math.floor((x+r)/T),0,W-1);i++){
    if(Math.hypot(i*T+6-x,j*T+6-y,d*T+6-z)<=r+8){const k=(d*H+j)*W+i;setBlock(k,Math.max(0,s.tiles[k]-n))}
   }
 }
 const api={enemies,fx,summon,heal:(p,n)=>{p.hp=Math.min(p.maxHp,p.hp+n)},status:(p,key,seconds)=>{p.statuses[key]=Math.max(seconds,p.statuses[key]||0)},
  blink:move,
  build:(p,x,y,w,h,z=p.z)=>{
   const depth=24,halfX=(Math.abs(Math.cos(p.yaw))*w+Math.abs(Math.sin(p.yaw))*depth)/2,halfZ=(Math.abs(Math.sin(p.yaw))*w+Math.abs(Math.cos(p.yaw))*depth)/2;
   for(let d=clamp(Math.floor((z-halfZ)/T),0,D-1);d<=clamp(Math.floor((z+halfZ)/T),0,D-1);d++)
   for(let j=clamp(Math.floor((y-h/2)/T),0,H-1);j<=clamp(Math.floor((y+h/2)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-halfX)/T),0,W-1);i<=clamp(Math.floor((x+halfX)/T),0,W-1);i++){
    if(!s.players.some(q=>q.hp>0&&Math.abs(q.x-i*T-6)<14&&Math.abs(q.y-12-j*T-6)<22&&Math.abs(q.z-d*T-6)<14))setBlock((d*H+j)*W+i,26)}},
  zone:(p,x,y,r,duration,interval,cb,color,z=p.z)=>s.zones.push({p,x,y,z,r,life:duration,interval,tick:interval,cb,color}),
  area:(p,x,y,r,n,color,z=p.z)=>{fx(x,y,r,color,'burst',z);tileDamage(x,y,r,n,z);for(const q of enemies(p))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<=r+9)damage(q,n)},
  bolt:(p,angle,o)=>{const yaw=p.yaw+(o.yawOffset||0),dx=Math.cos(angle)*Math.cos(yaw),dz=Math.cos(angle)*Math.sin(yaw),dy=Math.sin(angle);
   s.shots.push({p,x:p.x+dx*10,y:p.y-14+dy*10,z:p.z+dz*10,vx:dx*o.speed,vy:dy*o.speed,vz:dz*o.speed,r:3,life:4,color:'#ffd76d',...o,hit:new Set()})}
 };
 function summon(owner,kind){
  const active=s.summons.filter(f=>f.owner===owner);
  if(active.length>=3)s.summons.splice(s.summons.indexOf(active[0]),1);
  const f={id:++nextSummon,kind,owner,side:owner.side,x:owner.x,y:owner.y,z:owner.z,hp:28,maxHp:28,
   shield:0,statuses:{},vx:0,vy:0,vz:0,yaw:owner.yaw,time:0,pulse:.35};
  move(f,Math.cos(owner.yaw)*20,-12,Math.sin(owner.yaw)*20);s.summons.push(f);
 }
 function stepFamiliars(dt){
  s.summons=s.summons.filter(f=>f.hp>0&&f.time<12&&f.owner.hp>0);
  for(const f of s.summons){
   f.time+=dt;f.pulse-=dt;
   for(const k of Object.keys(f.statuses))f.statuses[k]=Math.max(0,f.statuses[k]-dt);
   if(f.statuses.burn>0)damage(f,dt*6);
   const dist=q=>Math.hypot(q.x-f.x,q.y-f.y,q.z-f.z);
   const foe=enemies(f).reduce((best,q)=>!best||dist(q)<dist(best)?q:best,null);
   const support=f.kind==='medic'||f.kind==='bastion',chasing=!support&&foe&&dist(foe)<400;
   const target=chasing?foe:f.owner,dx=target.x-f.x,dz=target.z-f.z,d=Math.hypot(dx,dz);
   const hold=chasing?(f.kind==='burrow'?14:105):22;
   const speed=(f.statuses.root>0?0:f.statuses.slow>0?65:125)*dt;
   const approach=Math.min(Math.max(0,d-hold),speed)/Math.max(1,d);
   move(f,dx*approach,clamp(target.y-12-f.y,-speed,speed),dz*approach);
   f.yaw=Math.atan2(dz,dx);
   if(f.pulse>0||f.statuses.silence>0)continue;
   f.pulse=1.5;
   if(support&&dist(f.owner)<110){
    if(f.kind==='medic')api.heal(f.owner,5);else f.owner.shield=Math.min(100,f.owner.shield+5);
    fx(f.x,f.y-10,16,f.kind==='medic'?'#79ff99':'#dab1ff','ring',f.z);
   }else if(chasing){
    const pitch=Math.atan2(foe.y-f.y,Math.max(1,d));
    if(f.kind==='burrow')api.area(f,f.x+Math.cos(f.yaw)*15,f.y-7,23,12,'#e3a669',f.z+Math.sin(f.yaw)*15);
    else if(f.kind==='storm'){for(const yawOffset of [-.09,0,.09])api.bolt(f,pitch,{speed:310,damage:4,r:2,yawOffset,color:'#ffe784'})}
    else if(f.kind==='frost')api.bolt(f,pitch,{speed:265,damage:6,r:3,color:'#86e9ff',onHit:(a,c,q)=>{if(q)a.status(q,'slow',2)}});
    else api.bolt(f,pitch,{speed:240,damage:6,blast:18,r:4,color:'#ff894e'});
   }
  }
 }
 function command(index,slot,store=false){
  const p=s.players[index],spell=p&&byId.get(p.ids[slot]);
  if(!Number.isInteger(slot)||!spell||s.over||p.hp<=0||p.cast>0||p.statuses.silence>0)return false;
  if(store){p.store=p.store===slot||p.bank[slot]>=spell.cost?-1:slot;return true}
  const price=Math.max(0,spell.cost-p.bank[slot]);if(p.mana+.00001<price)return false;
  p.store=-1;p.mana=Math.max(0,p.mana-price);p.bank[slot]=0;p.pending=slot;p.castingAngle=p.aim;p.castYaw=p.yaw;p.cast=Math.max(.016,spell.time);return true;
 }
 function input(i,forward,jump,pitch,strafe=0,yaw=0){
  const p=s.players[i];if(!p||![forward,pitch,strafe,yaw].every(Number.isFinite))return;
  const len=Math.max(1,Math.hypot(forward,strafe));
  inputs[i]={move:(Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/len,strafe:(Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/len,jump:!!jump};
  p.yaw=yaw;p.aim=clamp(pitch,-1.45,1.45);
 }
 function spawn(){
  const pool=SPELLS.filter(sp=>['glass-fan','north-star','corner-pocket','root-needle'].includes(sp.id)&&sp.cost<=maxMana);
  const wizard=s.players[0],bearing=wizard.yaw+(Math.random()-.5)*1.8,range=mode==='sandbox'?150:340+Math.random()*110;
  const p=actor(1,clamp(wizard.x+range*Math.cos(bearing),18,W*T-18),[SPELLS[0].id,...pool.slice(0,Math.min(4,s.wave)).map(v=>v.id)],true);
  p.z=clamp(wizard.z+range*Math.sin(bearing),18,D*T-18);
  p.y=120;
  while(p.y<480&&!blocked(p.x,p.y+4,p.z))p.y+=4;
  p.hp=p.maxHp=mode==='sandbox'?150:44+8*s.wave;return p;
 }
 function startWave(){s.wave++;for(let i=0;i<Math.min(1+Math.floor(s.wave/2),6);i++)spawn();waveWait=0}
 if(mode==='waves')startWave();
 function tick(dt){
  if(s.over)return;s.time+=dt;regen+=dt;
  const pulse=regen>=10;if(pulse)regen-=10;
  for(const [i,p] of s.players.entries()){
   if(p.hp<=0)continue;const st=p.statuses;
   for(const k of Object.keys(st))st[k]=Math.max(0,st[k]-dt);
   if(st.regen>0)api.heal(p,5*dt);if(st.burn>0)damage(p,6*dt);
   if(pulse)p.mana=Math.min(p.maxMana,p.mana+p.maxMana/10);
   if(p.store>=0&&!(st.silence>0)){
    const slot=p.store,cost=byId.get(p.ids[slot]).cost,deposit=Math.min(p.mana,p.maxMana/20*dt,cost-p.bank[slot]);
    p.mana-=deposit;p.bank[slot]+=deposit;if(p.bank[slot]>=cost-.00001){p.bank[slot]=cost;p.store=-1}
   }
   if(p.bot){
    const q=s.players[0],dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z,dist=Math.hypot(dx,dz),active=mode!=='sandbox';
    input(i,active&&dist>170?1:0,active&&p.ground&&(Math.hypot(p.vx,p.vz)<30||dy< -25),Math.atan2(dy,dist),active?.35*Math.sin(s.time+i):0,Math.atan2(dz,dx));
    p.brain-=dt;if(mode!=='sandbox'&&p.brain<=0){p.brain=1.2+Math.random()*1.2;const options=p.ids.map((id,k)=>byId.get(id).cost<=p.mana?k:-1).filter(k=>k>=0);if(options.length)command(i,options[Math.floor(Math.random()*options.length)])}
   }
   const drive=inputs[i],speed=140*(st.haste>0?1.65:1)*(st.slow>0?.45:1);
   p.vx+=(drive.move*speed-p.vx)*(1-Math.exp(-7*dt));p.vz+=(drive.strafe*speed-p.vz)*(1-Math.exp(-7*dt));if(st.root>0)p.vx=p.vz=0;
   if(p.ground&&drive.jump&&!(st.root>0)){p.vy=st.leap>0?-440:-300;p.ground=false}
   p.ground=false;p.vy=Math.min(560,p.vy+720*dt);move(p,p.vx*dt,p.vy*dt,p.vz*dt);
   if(p.y>580){damage(p,22);p.x=midX+(p.side?300:-300);p.z=midZ;p.y=40;p.vy=0}
   if(p.pending>=0){p.cast=Math.max(0,p.cast-dt);if(!p.cast){const sp=byId.get(p.ids[p.pending]);p.pending=-1;fx(p.x,p.y-14,14,'#ffdc94','cast',p.z);const look=p.yaw;p.yaw=p.castYaw;sp.cast(api,p,p.castingAngle);p.yaw=look}}
  }
  stepFamiliars(dt);
  for(const b of [...s.shots]){
   if(b.homing){const distance=q=>Math.hypot(q.x-b.x,q.y-12-b.y,q.z-b.z),t=enemies(b.p).sort((a,c)=>distance(a)-distance(c))[0];
    if(t){const blend=1-Math.exp(-b.homing*dt),f=b.speed/Math.max(1,distance(t));
     b.vx+=((t.x-b.x)*f-b.vx)*blend;b.vy+=((t.y-12-b.y)*f-b.vy)*blend;b.vz+=((t.z-b.z)*f-b.vz)*blend}}
   b.life-=dt;b.vy+=(b.gravity||0)*dt;
   const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy,b.vz)*dt/4));
   for(let i=0;i<n&&!b.dead;i++){
    const ox=b.x,oy=b.y,oz=b.z;b.z+=b.vz*dt/n;b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;
    const target=enemies(b.p).find(q=>!b.hit.has(q)&&Math.hypot(q.x-b.x,q.z-b.z)<8+b.r&&Math.abs(q.y-13-b.y)<14+b.r);
    const wall=solid(b.x,b.y,b.z),hitX=wall&&solid(b.x,oy,oz),hitZ=wall&&solid(ox,oy,b.z);
    if(!target&&!wall)continue;
    if(target?.statuses.reflect>0){b.p=target;b.vx*=-1;b.vy*=-1;b.vz*=-1;b.hit.clear();break}
    if(target){damage(target,b.damage||0);b.hit.add(target)}else tileDamage(b.x,b.y,5,b.damage||0,b.z);
    if(b.blast)api.area(b.p,b.x,b.y,b.blast,b.damage||0,b.color,b.z);
    b.onHit?.(api,b.p,target||null,b.x,b.y,b.z);fx(b.x,b.y,10,b.color,'burst',b.z);
    if(wall&&b.bounces>0){b.bounces--;if(hitX)b.vx*=-1;else if(hitZ)b.vz*=-1;else b.vy*=-1;b.x=ox;b.y=oy;b.z=oz;break}
    if(target&&b.pierce>0){b.pierce--;continue}b.dead=true;
   }
   if(!b.dead&&(b.life<=0||b.x<0||b.x>W*T||b.y>550||b.y< -150||b.z<0||b.z>D*T)){b.onExpire?.(api,b.p,b.x,b.y,b.z);b.dead=true}
  }
  s.shots=s.shots.filter(v=>!v.dead);for(const z of s.zones){z.life-=dt;z.tick-=dt;if(z.tick<=0){z.cb(api,z.p,z.x,z.y,z.z);z.tick+=z.interval}}
  s.zones=s.zones.filter(z=>z.life>0);for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
  if(s.players[0].hp<=0)s.over=mode==='multi'?'Red wizard wins':'The tower falls';
  else if(mode==='multi'&&s.players[1].hp<=0)s.over='Blue wizard wins';
  else if(mode==='waves'&&!enemies(s.players[0]).length){waveWait+=dt;if(waveWait>2){s.players.splice(1);inputs.splice(1);startWave()}}
 }
 function snapshot(includeTiles=true){return {time:s.time,map:s.map,wave:s.wave,over:s.over,summons:s.summons.map(({id,kind,side,x,y,z,time})=>({id,kind,side,x,y,z,time})),players:s.players.map(({brain,castingAngle,...p})=>p),shots:s.shots.map(({x,y,z,r,color,vx,vy})=>({x,y,z,r,color,vx,vy})),effects:s.effects,zones:s.zones.map(({x,y,z,r,color})=>({x,y,z,r,color})),...(includeTiles?{tiles:s.tiles}:{})}}
 return {dirty,state:s,command,input,tick,snapshot,spawn};
}
