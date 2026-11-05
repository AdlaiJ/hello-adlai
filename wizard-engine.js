import {bloodWeapons,SPELLS,spellRadius,SUMMON_KINDS} from './wizard-spells.js?v=refill-spells';
import {W,H,D,T,makeTiles,markChangedChunk} from './wizard-world.js?v=refill-spells';
export {MAPS,makeTiles} from './wizard-world.js?v=refill-spells';
const byId=new Map(SPELLS.map(s=>[s.id,s]));
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const midX=W*T/2,midZ=D*T/2;
export function createGame(settings,loadouts,mode){
 const s={map:settings.map,tiles:makeTiles(settings.map),players:[],summons:[],changedChunks:new Map(),shots:[],effects:[],zones:[],time:0,wave:0,over:'',mode};
 const dirty=new Set();s.terrainVersion=0;
 let activeSpell=null;
 const inputs=[],maxMana=settings.mana;let waveWait=0,nextSummon=0;
 function actor(side,x,ids,bot=false){
  const p={outfit:Math.floor(Math.random()*16),side,x,y:320,z:midZ,vz:0,yaw:side?Math.PI:0,vx:0,vy:0,hp:100,maxHp:100,mana:maxMana,maxMana,shield:0,aim:0,ids:[...ids],bank:ids.map(()=>0),store:-1,cast:0,pending:-1,statuses:{},bot,ground:false,brain:1};
  inputs.push({strafe:0,move:0,jump:false});s.players.push(p);return p;
 }
 if(mode==='multi'){
  loadouts.forEach((ids,i)=>{
   const free=settings.format==='1v1v1',side=free?i:i%2;
   const theta=free?Math.PI+i*2*Math.PI/3:side?0:Math.PI;
   const p=actor(side,midX+300*Math.cos(theta),ids);
   p.z=midZ+(free?300*Math.sin(theta):(Math.floor(i/2)-(loadouts.length/2-1)/2)*70);
   p.yaw=Math.atan2(midZ-p.z,midX-p.x);
  });
 }else actor(0,midX-300,loadouts[0]);
 function fx(x,y,r,color,kind='burst',z=midZ,yaw=0,pitch=0,duration=.45){s.effects.push({x,y,z,r,color,kind:kind==='ring'&&activeSpell?activeSpell:kind,yaw,pitch,life:duration,maxLife:duration})}
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
  if(p.hp===0&&p.statuses.crowned>0){p.hp=1;p.statuses.crowned=0;api.status(p,'phased',1);fx(p.x,p.y-12,48,'#ffdd75','burst',p.z)}
  if(p.kind&&n>spent)fx(p.x,p.y-10,p.hp===0?21:6,p.hp===0?'#ffbb66':'#fff2c5','burst',p.z);
  if(n>spent)p.lastInjury=(p.lastInjury||0)+1;
  if(spent&&p.statuses.capacitor>0)p.mana=Math.min(p.maxMana,p.mana+spent);
  if(spent&&p.statuses.polar>0)for(const q of enemies(p))if(Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<=spellRadius(72))api.status(q,'slow',2);
 }
 const enemies=p=>s.players.concat(s.summons).filter(q=>q.side!==p.side&&q.hp>0);
 function tileDamage(x,y,r,n,z){
  for(let d=clamp(Math.floor((z-r)/T),0,D-1);d<=clamp(Math.floor((z+r)/T),0,D-1);d++)
  for(let j=clamp(Math.floor((y-r)/T),0,H-1);j<=clamp(Math.floor((y+r)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-r)/T),0,W-1);i<=clamp(Math.floor((x+r)/T),0,W-1);i++){
    if(Math.hypot(i*T+6-x,j*T+6-y,d*T+6-z)<=r+8){const k=(d*H+j)*W+i;const hp=Math.max(0,(s.tiles[k]&127)-n);setBlock(k,hp>0?(s.tiles[k]&128)+hp:0)}
   }
 }
 const api={now:()=>s.time,allies:p=>s.summons.filter(f=>f.owner===p&&f.hp>0),enemies,fx:(x,y,r,...args)=>fx(x,y,spellRadius(r),...args),summon,heal:(p,n)=>{p.hp=Math.min(p.maxHp,p.hp+n)},status:(p,key,seconds)=>{p.statuses[key]=Math.max(seconds,p.statuses[key]||0)},
  blink:move,hurt:damage,cutTerrain:tileDamage,
  clearLine(p,q){
   const dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z,steps=Math.ceil(Math.hypot(dx,dy,dz)/5);
   for(let i=1;i<steps;i++)if(solid(p.x+dx*i/steps,p.y-12+dy*i/steps,p.z+dz*i/steps))return false;
   return true;
  },
  raiseThrone(p){
   const floor=api.surface(p.x,p.z,p.y-2);
   if(floor===null||blocked(p.x,floor-24,p.z))return;
   s.zones=s.zones.filter(z=>!(z.style==='throne'&&z.p===p));
   const rivers=[];
   for(let arm=0;arm<4;arm++){
    const angle=p.yaw+arm*Math.PI/2;
    for(let i=1;i<=9;i++){
     const reach=20+i*10.5,bend=7*Math.sin(i*.7+arm);
     const x=p.x+reach*Math.cos(angle)-bend*Math.sin(angle),z=p.z+reach*Math.sin(angle)+bend*Math.cos(angle);
     const y=api.surface(x,z,floor-24);
     if(y!==null)rivers.push({x,y,z});
    }
   }
   api.zone(p,p.x,floor,20,18,1,(w,owner)=>{
    for(const q of w.enemies(owner))if(rivers.some(tile=>Math.abs(q.y-tile.y)<16&&Math.hypot(q.x-tile.x,q.z-tile.z)<11.5))damage(q,6);
   },'#ac1537',p.z,'throne');
   Object.assign(s.zones.at(-1),{yaw:p.yaw,rivers});
   p.y=floor-24;p.vy=0;p.ground=true;p.onThrone=true;
  },
  liftBlocks(p){
   const candidates=[];
   const cx=Math.floor((p.x+30*Math.cos(p.yaw))/T),cz=Math.floor((p.z+30*Math.sin(p.yaw))/T);
   for(let x=Math.max(0,cx-4);x<=Math.min(W-1,cx+4);x++){
    for(let z=Math.max(0,cz-4);z<=Math.min(D-1,cz+4);z++){
     const bx=(x+.5)*T,bz=(z+.5)*T;
     const top=api.surface(bx,bz,p.y-48);
     if(top===null)continue;
     candidates.push({x:bx,y:top+T/2,z:bz,distance:Math.hypot(x-cx,z-cz,(top-p.y)/T)});
    }
   }
   const held=p.blocks||[];
   const gathered=candidates.sort((a,b)=>a.distance-b.distance).slice(0,Math.max(0,9-held.length));
   for(const block of gathered)setBlock(index(block.x,block.y,block.z),0);
   p.blocks=[...held,...gathered];
   p.liftedAt=s.time;
  },
  spike:(owner,x,y,z)=>s.zones.push({p:owner,x,y,z,r:spellRadius(28),life:14,hp:18,style:'spikes',color:'#f3dfa7'}),
  occupants:()=>s.players.concat(s.summons).filter(q=>q.hp>0),
  surface:(x,z,y)=>{for(let j=clamp(Math.floor(y/T),0,H-1);j<H;j++)if(solid(x,j*T,z)&&!solid(x,j*T-1,z))return j*T;return null},
  bone:(x,y,z)=>{if(x<0||x>=W*T||z<0||z>=D*T||y<0||y>=H*T||solid(x,y,z))return;
   if(!s.players.some(q=>q.hp>0&&Math.abs(q.x-x)<17&&Math.abs(q.z-z)<17&&Math.abs(q.y-12-y)<24))setBlock(index(x,y,z),186)},
  build:(p,x,y,w,h,z=p.z)=>{
   const depth=24,halfX=(Math.abs(Math.cos(p.yaw))*w+Math.abs(Math.sin(p.yaw))*depth)/2,halfZ=(Math.abs(Math.sin(p.yaw))*w+Math.abs(Math.cos(p.yaw))*depth)/2;
   for(let d=clamp(Math.floor((z-halfZ)/T),0,D-1);d<=clamp(Math.floor((z+halfZ)/T),0,D-1);d++)
   for(let j=clamp(Math.floor((y-h/2)/T),0,H-1);j<=clamp(Math.floor((y+h/2)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-halfX)/T),0,W-1);i<=clamp(Math.floor((x+halfX)/T),0,W-1);i++){
    if(!s.players.some(q=>q.hp>0&&Math.abs(q.x-i*T-6)<14&&Math.abs(q.y-12-j*T-6)<22&&Math.abs(q.z-d*T-6)<14))setBlock((d*H+j)*W+i,26)}},
  zone:(p,x,y,r,duration,interval,cb,color,z=p.z,style)=>{
   const zone={p,x,y,z,r:spellRadius(r),life:duration,interval,tick:interval,cb,color,style:style||activeSpell,spellId:activeSpell};
   s.zones.push(zone);return zone;
  },
  area:(p,x,y,r,n,color,z=p.z)=>{r=spellRadius(r);fx(x,y,r,color,'burst',z);tileDamage(x,y,r,n,z);for(const trap of s.zones){
    if(trap.style==='spikes'&&Math.hypot(trap.x-x,trap.y-12-y,trap.z-z)<=r+spellRadius(12))trap.hp-=n;
   }for(const q of enemies(p))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<=r+9)damage(q,n)},
  bolt:(p,angle,o,origin)=>{
   const spellId=activeSpell;
   if(spellId){
    o={...o};
    for(const key of ['onHit','onExpire'])if(o[key]){
     const callback=o[key];
     o[key]=(...args)=>{const previous=activeSpell;activeSpell=spellId;try{return callback(...args)}finally{activeSpell=previous}};
    }
   }
   const yaw=p.yaw+(o.yawOffset||0),dx=Math.cos(angle)*Math.cos(yaw),dz=Math.cos(angle)*Math.sin(yaw),dy=Math.sin(angle);
   s.shots.push({p,style:p.kind?(o.style||'familiar-'+p.kind):o.style,x:origin?.x??p.x+dx*10,y:origin?.y??p.y-14+dy*10,z:origin?.z??p.z+dz*10,vx:dx*o.speed,vy:dy*o.speed,vz:dz*o.speed,life:4,color:'#ffd76d',...o,r:spellRadius(o.r??3),hit:new Set()})}
 };
 function summon(owner,kind,duration=12){
  const familiar=!SUMMON_KINDS.has(kind);
  const active=s.summons.filter(f=>f.owner===owner&&f.familiar&&f.hp>0);
  if(familiar&&active.length>=3)s.summons.splice(s.summons.indexOf(active[0]),1);
  const f={id:++nextSummon,kind,familiar,owner,side:owner.side,x:owner.x,y:owner.y,z:owner.z,hp:28,maxHp:28,
   shield:0,statuses:{},vx:0,vy:0,vz:0,yaw:owner.yaw,time:0,duration,pulse:.35};
  if(kind==='purple-wurm'){f.hp=f.maxHp=220;f.burrowFloor=api.surface(f.x,f.z,0)??440;f.digClock=0;f.erupted=false}
  if(kind==='void-entity'){f.hp=f.maxHp=85;f.attackCycle=0}
  if(kind==='imp-furnace'){f.hp=f.maxHp=90;f.pulse=1;f.spawned=0}
  if(kind==='fire-imp'){f.hp=f.maxHp=16;f.leap=0}
  move(f,Math.cos(owner.yaw)*20,-12,Math.sin(owner.yaw)*20);s.summons.push(f);return f;
 }
 function stepWurm(f,foe,dt){
  const phase=f.time%5;
  const target=foe||{x:f.owner.x+110*Math.cos(f.time*.5),z:f.owner.z+110*Math.sin(f.time*.5)};
  const dx=target.x-f.x,dz=target.z-f.z,d=Math.hypot(dx,dz);
  const speed=(f.statuses.root>0?0:f.statuses.slow>0?75:170)*dt;
  const step=Math.min(d,phase<3.3?speed:speed*.2);
  if(d>1){f.yaw=Math.atan2(dz,dx);f.x=clamp(f.x+dx/d*step,30,W*T-30);f.z=clamp(f.z+dz/d*step,30,D*T-30)}
  // Preserve a usable depth when the tunnel has removed the local floor.
  const ground=api.surface(f.x,f.z,0);
  if(ground!==null&&ground<520)f.burrowFloor=ground;
  const rise=phase<3.3?0:Math.sin((phase-3.3)/1.7*Math.PI);
  f.y=clamp(f.burrowFloor+26-rise*90,35,520);
  f.digClock-=dt;
  if(f.digClock<=0){
   f.digClock=.12;tileDamage(f.x,f.y-12,32,100,f.z);
   fx(f.x,f.burrowFloor-2,16,'#ad87bb','burst',f.z);
  }
  if(phase<3.3)f.erupted=false;
  else if(!f.erupted){
   f.erupted=true;
   if(!(f.statuses.silence>0)){
    api.area(f,f.x,f.burrowFloor-12,65,32,'#c27cf0',f.z);
    for(const q of enemies(f))if(Math.hypot(q.x-f.x,q.z-f.z)<73&&Math.abs(q.y-f.burrowFloor)<90){q.vy=-310;q.ground=false}
   }
  }
  if(rise>.5&&foe&&f.pulse<=0&&!(f.statuses.silence>0)&&Math.hypot(foe.x-f.x,foe.y-f.y,foe.z-f.z)<65&&api.clearLine(f,foe)){
   damage(foe,24);f.pulse=1.2;
  }
 }
 function stepFamiliars(dt){
  s.summons=s.summons.filter(f=>f.hp>0&&f.time<f.duration&&f.owner.hp>0);
  for(const f of s.summons){
   f.time+=dt;f.pulse-=dt;
   for(const k of Object.keys(f.statuses))f.statuses[k]=Math.max(0,f.statuses[k]-dt);
   if(f.statuses.burn>0)damage(f,dt*6);
   if(f.hp<=0)continue;
   const dist=q=>Math.hypot(q.x-f.x,q.y-f.y,q.z-f.z);
   if(f.familiar&&dist(f.owner)>120){
    f.x=f.owner.x;f.y=f.owner.y;f.z=f.owner.z;f.vx=f.vy=f.vz=0;
   }
   const foe=enemies(f).reduce((best,q)=>!best||dist(q)<dist(best)?q:best,null);
   if(f.kind==='purple-wurm'){stepWurm(f,foe,dt);continue}
   if(f.kind==='imp-furnace'){
    f.vy=Math.min(440,f.vy+900*dt);move(f,0,f.vy*dt,0);
    if(f.y>550){f.hp=0;continue}
    if(f.pulse<=0&&f.spawned<8&&!(f.statuses.silence>0)){
     f.pulse=2;f.spawned++;
     const imp=summon(f.owner,'fire-imp',12),angle=f.spawned*2.4;
     imp.x=f.x+Math.cos(angle)*22;imp.z=f.z+Math.sin(angle)*22;imp.y=f.y-8;imp.vy=-150;
     fx(f.x,f.y-15,18,'#ff9b32','fire-imp',f.z);
    }
    continue;
   }
   if(f.kind==='fire-imp'){
    f.leap=Math.max(0,f.leap-dt);
    const dx=foe?foe.x-f.x:0,dz=foe?foe.z-f.z:0,d=Math.hypot(dx,dz);
    const speed=f.statuses.root>0?0:f.statuses.slow>0?70:155;
    if(foe&&d>1){f.yaw=Math.atan2(dz,dx);f.vx=dx/d*speed;f.vz=dz/d*speed}
    else f.vx=f.vz=0;
    if(foe&&d<85&&f.ground&&f.leap<=0&&speed&&!(f.statuses.silence>0)){
     f.vy=-260;f.leap=.8;f.attackAt=f.time;
    }
    const ox=f.x,oz=f.z;
    f.vy=Math.min(440,f.vy+900*dt);f.ground=false;move(f,f.vx*dt,f.vy*dt,f.vz*dt);
    if(speed&&foe&&f.ground&&Math.hypot(f.x-ox,f.z-oz)<dt*10)f.vy=-240;
    f.walkSpeed=Math.hypot(f.x-ox,f.z-oz)/dt;
    if(foe&&dist(foe)<24&&!(f.statuses.silence>0)){
     api.area(f,f.x,f.y-8,36,18,'#ff983e',f.z);fx(f.x,f.y-8,36,'#ff983e','fire-imp',f.z);f.hp=0;
    }
    if(f.y>550)f.hp=0;
    continue;
   }
   const support=f.kind==='medic'||f.kind==='bastion';
   const chasing=!support&&foe&&dist(foe)<400;
   const target=chasing&&!f.familiar?foe:f.owner,dx=target.x-f.x,dz=target.z-f.z,d=Math.hypot(dx,dz);
   const contact=f.kind==='squire'||f.kind==='wraith';
   const hold=chasing&&!f.familiar?(contact?14:f.kind==='archer'?165:105):22;
   const grounded=f.kind==='squire'||f.kind==='archer';
   const speed=f.statuses.root>0?0:f.statuses.slow>0?65:125;
   const approach=Math.min(Math.max(0,d-hold)*3,speed)/Math.max(1,d);
   let desiredX=dx*approach,desiredZ=dz*approach;
   // Keep the front ranks and support creatures from stacking in one spot.
   for(const other of s.summons){
    if(other===f||other.hp<=0||other.side!==f.side)continue;
    const sx=f.x-other.x,sz=f.z-other.z,separation=Math.hypot(sx,sz);
    if(separation<23){
     const angle=f.id*2.4;
     desiredX+=(separation? sx/separation:Math.cos(angle))*(23-separation)*3;
     desiredZ+=(separation? sz/separation:Math.sin(angle))*(23-separation)*3;
    }
   }
   const length=Math.hypot(desiredX,desiredZ),limit=length?Math.min(1,speed/length):0;
   const blend=1-Math.exp(-9*dt);
   f.vx+=(desiredX*limit-f.vx)*blend;f.vz+=(desiredZ*limit-f.vz)*blend;
   if(!speed)f.vx=f.vz=0;
   const oldX=f.x,oldZ=f.z;
   if(grounded){
    f.vy=Math.min(440,f.vy+900*dt);f.ground=false;
    move(f,f.vx*dt,f.vy*dt,f.vz*dt);
    if(speed&&d>hold+5&&Math.hypot(f.x-oldX,f.z-oldZ)<dt*12&&f.ground){
     const side=f.id%2?1:-1;
     move(f,-Math.sin(f.yaw)*side*speed*dt,0,Math.cos(f.yaw)*side*speed*dt);
     f.vy=-190;
    }
    if(f.y>550)f.hp=0;
   }else move(f,f.vx*dt,clamp(target.y-12-f.y,-speed*dt,speed*dt),f.vz*dt);
   f.walkSpeed=Math.hypot(f.x-oldX,f.z-oldZ)/dt;
   if(d>1){
    const bearing=Math.atan2(dz,dx),delta=Math.atan2(Math.sin(bearing-f.yaw),Math.cos(bearing-f.yaw));
    f.yaw+=delta*(1-Math.exp(-8*dt));
   }
   if(f.pulse>0||f.statuses.silence>0)continue;
   f.pulse=1.5;
   if(support&&dist(f.owner)<spellRadius(110)){
    if(f.kind==='medic')api.heal(f.owner,5);else f.owner.shield=Math.min(100,f.owner.shield+5);
    fx(f.x,f.y-10,16,f.kind==='medic'?'#79ff99':'#dab1ff','ring',f.z);
   }else if(chasing){
    const pitch=Math.atan2(foe.y-f.y,Math.max(1,Math.hypot(foe.x-f.x,foe.z-f.z)));
    f.yaw=Math.atan2(foe.z-f.z,foe.x-f.x);f.attackAt=f.time;
    if(f.kind==='void-entity'){
     const attack=f.attackCycle++%4;f.pulse=2.4;
     if(attack===0){
      for(const yawOffset of [-.16,0,.16])api.bolt(f,pitch,{style:'void-orb',speed:210,damage:9,r:5,yawOffset,color:'#a38aff',onHit:(a,o,q)=>{if(q)a.status(q,'slow',1.5)}});
     }else if(attack===1){
      fx(f.x,f.y-12,23,'#dfbcff','void-eye-beam',f.z,f.yaw,pitch);
      api.bolt(f,pitch,{style:'void-eye-beam',speed:650,life:1.1,damage:26,pierce:3,r:5,color:'#dfbcff'});
     }else if(attack===2){
      // Lunge toward the target before sweeping the nearby space.
      const reach=Math.min(70,Math.max(0,dist(foe)-45));
      move(f,Math.cos(f.yaw)*reach,0,Math.sin(f.yaw)*reach);
      fx(f.x,f.y-12,65,'#bf79f2','void-tentacle-lash',f.z,f.yaw,0);
      for(const q of enemies(f))if(dist(q)<78&&api.clearLine(f,q)){
       damage(q,22);api.status(q,'root',.8);
       const away=Math.max(1,Math.hypot(q.x-f.x,q.z-f.z));
       move(q,(q.x-f.x)/away*22,-8,(q.z-f.z)/away*22);
      }
     }else{
      const center={x:foe.x,y:foe.y-12,z:foe.z};let pulses=0;
      api.zone(f,center.x,center.y,76,1.85,.3,(w,o,x,y,z)=>{
       if(o.hp<=0||o.owner.hp<=0||o.statuses.silence>0)return;
       for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<85&&w.clearLine({x,y:y+12,z},q)){
        w.blink(q,(x-q.x)*.15,0,(z-q.z)*.15);
       }
       if(++pulses===6)w.area(o,x,y,76,30,'#b183ff',z);
      },'#9563df',center.z,'void-gravity-burst');
     }
    }else if(contact){
     if(dist(foe)>32){f.pulse=.1;continue}
     const blockedStrike=[.25,.5,.75].some(t=>solid(f.x+dx*t,f.y-12+(foe.y-f.y)*t,f.z+dz*t));
     if(blockedStrike)continue;
     const before=foe.hp;
     damage(foe,f.kind==='squire'?11:8);
     if(f.kind==='wraith')api.heal(f.owner,Math.max(0,before-foe.hp));else f.pulse=.85;
     fx(foe.x,foe.y-12,12,f.kind==='wraith'?'#8fffe1':'#d3e4a8','ring',foe.z);
    }else if(f.kind==='archer')api.bolt(f,pitch,{speed:365,damage:13,pierce:1,r:3,color:'#cfadff'});
    else if(f.kind==='burrow'&&dist(foe)<40)api.area(f,f.x+Math.cos(f.yaw)*15,f.y-7,23,12,'#e3a669',f.z+Math.sin(f.yaw)*15);
    else if(f.kind==='storm'){for(const yawOffset of [-.09,0,.09])api.bolt(f,pitch,{speed:310,damage:4,r:2,yawOffset,color:'#ffe784'})}
    else if(f.kind==='frost')api.bolt(f,pitch,{speed:265,damage:6,r:3,color:'#86e9ff',onHit:(a,c,q)=>{if(q){if(c.statuses.court>0&&q.statuses.slow>0)a.status(q,'root',1);a.status(q,'slow',2)}}});
    else if(f.kind==='ember')api.bolt(f,pitch,{speed:240,damage:6,blast:18,r:4,color:'#ff894e'});
   }
  }
 }
 function fireSword(index){
  const p=s.players[index];
  if(!p?.onThrone||!s.zones.some(z=>z.style==='throne'&&z.p===p&&z.life>0)||p.hp<=0||s.over||p.cast>0||p.statuses.silence>0||p.swordReady>s.time)return false;
  api.bolt(p,p.aim,{style:'skull-throne',speed:390,damage:26,r:4,color:'#fc274b'});
  p.swordReady=s.time+.32;return true;
 }
 function fireBlood(index){
  const p=s.players[index];
  if(!p?.bloodAmmo||s.over||p.hp<=0||p.cast>0||p.statuses.silence>0)return false;
  const weapon=bloodWeapons[(6-p.bloodAmmo)%bloodWeapons.length];
  api.bolt(p,p.aim,{...weapon,color:'#da1741'});p.bloodAmmo--;return true;
 }
 function fireBlock(index){
  const p=s.players[index];
  if(!p?.blocks?.length||s.over||p.hp<=0||p.cast>0||p.statuses.silence>0)return false;
  p.blocks.pop();
  api.bolt(p,p.aim,{style:'quarry-volley',speed:355,r:5,damage:17,color:'#bf9e72'});
  return true;
 }
 function castSpell(spell,p){
  const previous=activeSpell;activeSpell=spell.id;
  try{spell.cast(api,p,p.aim)}finally{activeSpell=previous}
 }
 function command(index,slot,store=false){
  const p=s.players[index],spell=p&&byId.get(p.ids[slot]);
  if(!Number.isInteger(slot)||!spell||s.over||p.hp<=0||p.cast>0||p.statuses.silence>0)return false;
  if(spell.channel)return false;
  if(store){p.store=p.store===slot||p.bank[slot]>=spell.cost?-1:slot;return true}
  if(spell.id==='bottle-rocket'&&p.rocketSpent)return false;
  if(spell.id==='skull-throne'&&p.onThrone)return fireSword(index);
  const held=p.weapon;
  if(held?.id===spell.id&&held.until>s.time&&held.strikes>0){
   if(s.time<held.ready)return false;
   const {reach,arc,damage:power,delay,trait}=spell.melee;
   held.strikes--;held.ready=s.time+delay;held.swing=s.time;p.store=-1;
   if(trait==='lunge')move(p,24*Math.cos(p.yaw),0,24*Math.sin(p.yaw));
   for(const q of enemies(p).concat(s.zones.filter(z=>z.style==="spikes"&&z.hp>0))){
    const dx=q.x-p.x,dz=q.z-p.z,dy=q.y-p.y;
    if(Math.hypot(dx,dy,dz)>reach||Math.abs(dy)>28)continue;
    const angle=Math.atan2(dz,dx)-p.yaw;
    if(Math.cos(angle)<Math.cos(arc/2))continue;
    const steps=Math.ceil(Math.hypot(dx,dy,dz)/5);
    let covered=false;
    for(let i=1;i<steps;i++)if(solid(p.x+dx*i/steps,p.y-12+dy*i/steps,p.z+dz*i/steps)){covered=true;break}
    if(covered)continue;
    if(q.style==="spikes"){q.hp-=power;fx(q.x,q.y-12,12,q.color,"burst",q.z);continue}
    const behind=dx*Math.cos(q.yaw)+dz*Math.sin(q.yaw)>Math.hypot(dx,dz)*.5;
    const before=q.hp;damage(q,trait==='backstab'&&behind?power*3:power);
    if(trait==='drain'&&q.hp<before)api.heal(p,8);
    if(trait==='slow'||trait==='burn')api.status(q,trait,2);
    fx(q.x,q.y-12,12,'#ffd691','burst',q.z);
   }
   return true;
  }
  if(held?.id===spell.id&&s.time<held.ready)return false;
  const price=Math.max(0,spell.cost-p.bank[slot]);if(p.mana+.00001<price)return false;
  p.castDuration=spell.cost>0?spell.time*price/spell.cost:spell.time;
  p.store=-1;p.mana=Math.max(0,p.mana-price);p.bank[slot]=0;p.pending=slot;p.castVisual=spell.id;p.castStarted=s.time;p.cast=Math.max(.016,p.castDuration);return true;
 }
 function input(i,forward,jump,pitch,strafe=0,yaw=0,channel=-1){
  const p=s.players[i];if(!p||![forward,pitch,strafe,yaw].every(Number.isFinite))return;
  const wanted=Number.isInteger(channel)&&byId.get(p.ids[channel])?.channel?channel:-1;
  if(wanted!==p.channelRequested){p.channelBlocked=false;p.channelClock=0}
  p.channelRequested=wanted;p.channelUntil=s.time+.4;
  const len=Math.max(1,Math.hypot(forward,strafe));
  inputs[i]={move:(Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/len,strafe:(Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/len,jump:!!jump};
  p.yaw=yaw;p.aim=clamp(pitch,-1.45,1.45);
 }
 function spawn(){
  const pool=SPELLS.filter(sp=>['glass-fan','north-star','corner-pocket','root-needle'].includes(sp.id)&&sp.cost<=maxMana);
  const wizard=s.players[0],bearing=wizard.yaw+(Math.random()-.5)*1.8,range=mode==='sandbox'?150:340+Math.random()*110;
  const p=actor(1,clamp(wizard.x+range*Math.cos(bearing),18,W*T-18),['witchspark',...pool.slice(0,Math.min(4,s.wave)).map(v=>v.id)],true);
  if(mode==='waves')p.monster=['ember','burrow','wraith','bastion'][(s.players.length+s.wave)%4];
  p.z=clamp(wizard.z+range*Math.sin(bearing),18,D*T-18);
  p.y=120;
  while(p.y<480&&!blocked(p.x,p.y+4,p.z))p.y+=4;
  p.hp=p.maxHp=mode==='sandbox'?150:44+8*s.wave;return p;
 }
 function startWave(){s.wave++;for(let i=0;i<Math.min(1+Math.floor(s.wave/2),6);i++)spawn();waveWait=0}
 if(mode==='waves')startWave();
 function tick(dt){
  if(s.over)return;
  const previousSecond=Math.floor(s.time+1e-8);
  s.time+=dt;
  const second=Math.floor(s.time+1e-8);
  const pulses=Math.floor(second/10)-Math.floor(previousSecond/10);
  const manaFraction=(second-previousSecond)*.005+pulses*.1;
  for(const [i,p] of s.players.entries()){
   if(p.hp<=0)continue;const st=p.statuses;
   if(p.weapon&&(s.time>=p.weapon.until||(!p.weapon.strikes&&s.time>=p.weapon.ready)))p.weapon=null;
   for(const k of Object.keys(st))st[k]=Math.max(0,st[k]-dt);
   if(st.regen>0)api.heal(p,5*dt);if(st.burn>0)damage(p,6*dt);
   if(manaFraction)p.mana=Math.min(p.maxMana,p.mana+p.maxMana*manaFraction);
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
   const previousY=p.y;
   p.ground=false;p.vy=Math.min(560,p.vy+720*dt);move(p,p.vx*dt,p.vy*dt,p.vz*dt);
   p.onThrone=false;
   for(const z of s.zones){
    if(z.style!=='throne'||Math.hypot(p.x-z.x,p.z-z.z)>19)continue;
    const seat=z.y-24;
    if(p.vy>=0&&previousY<=seat+.1&&p.y>=seat){
     p.y=seat;p.vy=0;p.ground=true;p.onThrone=z.p===p;break;
    }
   }
   if(p.y>580){damage(p,22);p.x=midX+(p.side?300:-300);p.z=midZ;p.y=40;p.vy=0}
   if(p.rocketSpent&&p.ground)p.rocketSpent=false;
   p.channel=-1;
   const stream=byId.get(p.ids[p.channelRequested]);
   if(stream?.channel&&p.channelUntil>s.time&&!p.channelBlocked&&p.hp>0&&p.cast<=0&&!(st.silence>0)){
    p.store=-1;p.channelClock=(p.channelClock||0)-dt;
    if(p.channelClock<=0){
     const price=stream.channel.mana*stream.channel.interval;
     if(p.mana+.00001<price)p.channelBlocked=true;
     else{p.mana=Math.max(0,p.mana-price);castSpell(stream,p);p.channelClock+=stream.channel.interval}
    }
    if(!p.channelBlocked)p.channel=p.channelRequested;
   }
   if(p.pending>=0){p.cast=Math.max(0,p.cast-dt);if(!p.cast){const sp=byId.get(p.ids[p.pending]);p.pending=-1;fx(p.x,p.y-14,14,'#ffdc94','cast',p.z);castSpell(sp,p)}}
  }
  stepFamiliars(dt);
  const targetsBySide=new Map();
  for(const b of [...s.shots]){
   if(!targetsBySide.has(b.p.side))targetsBySide.set(b.p.side,enemies(b.p));
   const candidates=targetsBySide.get(b.p.side);
   if(b.homing){const distance=q=>Math.hypot(q.x-b.x,q.y-12-b.y,q.z-b.z),t=candidates.reduce((best,q)=>q.hp>0&&(!best||distance(q)<distance(best))?q:best,null);
    if(t){const blend=1-Math.exp(-b.homing*dt),f=b.speed/Math.max(1,distance(t));
     b.vx+=((t.x-b.x)*f-b.vx)*blend;b.vy+=((t.y-12-b.y)*f-b.vy)*blend;b.vz+=((t.z-b.z)*f-b.vz)*blend}}
   b.life-=dt;b.vy+=(b.gravity||0)*dt;
   const n=Math.max(1,Math.ceil(Math.hypot(b.vx,b.vy,b.vz)*dt/4));
   for(let i=0;i<n&&!b.dead;i++){
    const ox=b.x,oy=b.y,oz=b.z;b.z+=b.vz*dt/n;b.x+=b.vx*dt/n;b.y+=b.vy*dt/n;
    const target=candidates.find(q=>{
     const size=q.kind==='purple-wurm'?30:8,reach=size+b.r;
     return q.hp>0&&Math.abs(q.y-13-b.y)<size+6+b.r&&(q.x-b.x)**2+(q.z-b.z)**2<reach*reach&&!b.hit.has(q);
    });
    if(b.terrainPierce)tileDamage(b.x,b.y,Math.max(8,b.r),200,b.z);
    const wall=!b.terrainPierce&&solid(b.x,b.y,b.z),hitX=wall&&solid(b.x,oy,oz),hitZ=wall&&solid(ox,oy,b.z);
    if(!wall&&!target&&!(b.impactY!==undefined&&oy<b.impactY&&b.y>=b.impactY)){
     const spike=s.zones.find(t=>t.style==='spikes'&&t.hp>0&&Math.hypot(t.x-b.x,t.z-b.z)<spellRadius(16)+b.r&&b.y>=t.y-t.r-b.r&&b.y<=t.y+b.r);
     if(!spike)continue;
     spike.hp-=b.damage||0;b.dead=true;
     if(b.blast)api.area(b.p,b.x,b.y,b.blast,b.damage||0,b.color,b.z);
     b.onHit?.(api,b.p,null,b.x,b.y,b.z);fx(b.x,b.y,12,b.color,'burst',b.z);continue;
    }
    if(target?.statuses.prism>0){
     target.statuses.prism=0;target.shield=Math.min(100,target.shield+Math.min(45,b.damage||0));
     fx(b.x,b.y,26,'#f7aaff','burst',b.z);b.dead=true;continue;
    }
    if(target?.statuses.reflect>0){b.p=target;b.vx*=-1;b.vy*=-1;b.vz*=-1;b.hit.clear();break}
    if(target){damage(target,b.damage||0);b.hit.add(target)}else tileDamage(b.x,b.y,5,b.damage||0,b.z);
    if(b.blast)api.area(b.p,b.x,b.y,b.blast,b.damage||0,b.color,b.z);
    b.onHit?.(api,b.p,target||null,b.x,b.y,b.z);fx(b.x,b.y,10,b.color,'burst',b.z);
    if(wall&&b.bounces>0){b.bounces--;if(hitX)b.vx*=-1;else if(hitZ)b.vz*=-1;else b.vy*=-1;b.x=ox;b.y=oy;b.z=oz;break}
    if(target&&b.pierce>0){b.pierce--;continue}b.dead=true;
   }
   if(!b.dead&&(b.life<=0||b.x<0||b.x>W*T||b.y>550||b.y< -150||b.z<0||b.z>D*T)){b.onExpire?.(api,b.p,b.x,b.y,b.z);b.dead=true}
  }
  s.shots=s.shots.filter(v=>!v.dead);for(const z of s.zones){z.life-=dt;
   if(z.style==='spikes'){
    if(z.hp<=0||!solid(z.x,z.y+1,z.z)){z.life=0;fx(z.x,z.y-9,16,z.color,'burst',z.z);continue}
    const victim=api.occupants().find(q=>Math.hypot(q.x-z.x,q.z-z.z)<=spellRadius(24)&&q.y>=z.y-spellRadius(26)&&q.y<=z.y+5);
    if(victim){z.life=0;if(victim.side===z.p.side){victim.vy=-440;victim.ground=false}
     else{damage(victim,26);api.status(victim,'root',1.7)}
     fx(z.x,z.y-8,30,z.color,'burst',z.z)}
    continue;
   }
   if(z.style==='tornado'){
    z.x+=z.vx*dt;z.z+=z.vz*dt;
    if(z.x<20||z.x>W*T-20||z.z<20||z.z>D*T-20){z.life=0;continue}
    const ground=api.surface(z.x,z.z,0);
    if(ground!==null)z.y=ground;
   }
   z.tick-=dt;if(z.tick<=0){const previous=activeSpell;activeSpell=z.spellId;
    try{z.cb(api,z.p,z.x,z.y,z.z)}finally{activeSpell=previous}
    z.tick+=z.interval}}
  s.zones=s.zones.filter(z=>z.life>0);for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
  if(mode==='multi'){
   const alive=new Set(s.players.filter(p=>p.hp>0).map(p=>p.side));
   if(alive.size<=1)s.over=alive.size?['Blue','Red','Gold'][[...alive][0]]+(loadouts.length>3?' team wins':' wizard wins'):'Draw';
  }else if(s.players[0].hp<=0)s.over='The tower falls';
  else if(mode==='waves'&&!enemies(s.players[0]).length){waveWait+=dt;if(waveWait>2){s.players.splice(1);inputs.splice(1);startWave()}}
 }
 function snapshot(includeTiles=true){return {time:s.time,map:s.map,wave:s.wave,over:s.over,summons:s.summons.map(({id,kind,familiar,side,x,y,z,time,hp,maxHp,yaw,walkSpeed,attackAt})=>({id,kind,familiar,side,x,y,z,time,hp,maxHp,yaw,walkSpeed,attackAt})),players:s.players.map(({brain,...p})=>p),shots:s.shots.map(({style,x,y,z,r,color,vx,vy,vz})=>({style,x,y,z,r,color,vx,vy,vz})),effects:s.effects,zones:s.zones.map(({x,y,z,r,color,style,hp,yaw,rivers,life})=>({x,y,z,r,color,style,hp,yaw,rivers,life})),...(includeTiles?{tiles:s.tiles}:{})}}
 return {dirty,state:s,command,fireBlood,fireSword,fireBlock,input,tick,snapshot,spawn};
}
