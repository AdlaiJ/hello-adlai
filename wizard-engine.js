import {SPELLS} from './wizard-spells.js';
export const MAPS=['Bellfall Keep','Ember Quarry','Frostglass Bridge'];
const byId=new Map(SPELLS.map(s=>[s.id,s]));
const W=80,H=45,T=12,clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function makeTiles(map){
 const a=new Uint8Array(W*H*32),m=MAPS.indexOf(map);
 for(let z=0;z<32;z++)for(let x=0;x<W;x++){
  const floor=m===1?36+Math.round(2*Math.sin(x*.14)*Math.cos(z*.23)):38;
  const put=(y,hp)=>{a[x+W*(y+H*z)]=hp};
  for(let y=floor;y<H;y++)put(y,22);
  const dx=Math.abs(x-39.5),dz=Math.abs(z-15.5);
  if(m===0){const tower=(Math.abs(dx-18)<2&&Math.abs(dz-9)<2);
   if(tower||(Math.abs(dx-18)<1&&dz>3&&dz<10)||(Math.abs(dz-9)<1&&dx<18&&dx>3))
    for(let y=floor-(tower?10:5);y<floor;y++)put(y,30);
  }else if(m===1){const mound=Math.max(0,7-Math.abs(dx-10)*.8-Math.abs(dz-6)*1.3);
   for(let y=floor-Math.floor(mound);y<floor;y++)put(y,18);
  }else if(dx<23&&dz<4){put(32,16);if((x%12===0&&dz>2)||dx>18)for(let y=33;y<floor;y++)put(y,24)}
 }
 return a;
}
export function createGame(settings,loadouts,mode){
 const s={map:settings.map,tiles:makeTiles(settings.map),players:[],shots:[],effects:[],zones:[],time:0,wave:0,over:'',mode};
 const dirty=new Set();s.terrainVersion=0;
 const inputs=[],maxMana=settings.mana;let regen=0,waveWait=0;
 function actor(side,x,ids,bot=false){
  const p={side,x,y:320,z:bot?70+Math.random()*240:192,vz:0,yaw:side?Math.PI:0,vx:0,vy:0,hp:100,maxHp:100,mana:maxMana,maxMana,shield:0,aim:0,ids:[...ids],bank:ids.map(()=>0),store:-1,cast:0,pending:-1,castingAngle:0,statuses:{},bot,ground:false,brain:1};
  inputs.push({strafe:0,move:0,jump:false});s.players.push(p);return p;
 }
 actor(0,125,loadouts[0]);
 if(mode==='multi')actor(1,835,loadouts[1]);
 function fx(x,y,r,color,kind='burst',z=192){s.effects.push({x,y,z,r,color,kind,life:.45,maxLife:.45})}
 const index=(x,y,z)=>Math.floor(x/T)+W*(Math.floor(y/T)+H*Math.floor(z/T));
 function solid(x,y,z){return x>=0&&x<960&&y>=0&&y<540&&z>=0&&z<384&&s.tiles[index(x,y,z)]>0}
 function setBlock(k,hp){if(s.tiles[k]===hp)return;s.tiles[k]=hp;s.terrainVersion++;if(mode==='multi')dirty.add(k)}
 function blocked(x,y,z){for(const dx of [-5,5])for(const dz of [-5,5])for(const dy of [-1,-12,-24])if(solid(x+dx,y+dy,z+dz))return true;return false}
 function move(p,dx,dy,dz=0){
  const n=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))/4));
  for(let i=0;i<n;i++){
   const x=clamp(p.x+dx/n,8,952);if(!blocked(x,p.y,p.z))p.x=x;else p.vx=0;
   const z=clamp(p.z+dz/n,8,376);if(!blocked(p.x,p.y,z))p.z=z;else p.vz=0;
   const y=Math.max(24,p.y+dy/n);if(!blocked(p.x,y,p.z))p.y=y;else{if(dy>0)p.ground=true;p.vy=0}
  }
 }
 function damage(p,n){
  if(p.hp<=0||p.statuses.phased>0||n<=0)return;
  n*=p.statuses.armor>0?.5:1;
  const spent=Math.min(n,p.shield);p.shield-=spent;p.hp=Math.max(0,p.hp-n+spent);
 }
 const enemies=p=>s.players.filter(q=>q.side!==p.side&&q.hp>0);
 function tileDamage(x,y,r,n,z){
  for(let d=clamp(Math.floor((z-r)/T),0,31);d<=clamp(Math.floor((z+r)/T),0,31);d++)
  for(let j=clamp(Math.floor((y-r)/T),0,H-1);j<=clamp(Math.floor((y+r)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-r)/T),0,W-1);i<=clamp(Math.floor((x+r)/T),0,W-1);i++){
    if(Math.hypot(i*T+6-x,j*T+6-y,d*T+6-z)<=r+8){const k=(d*H+j)*W+i;setBlock(k,Math.max(0,s.tiles[k]-n))}
   }
 }
 const api={enemies,fx,heal:(p,n)=>{p.hp=Math.min(p.maxHp,p.hp+n)},status:(p,key,seconds)=>{p.statuses[key]=Math.max(seconds,p.statuses[key]||0)},
  blink:move,
  build:(p,x,y,w,h,z=p.z)=>{
   const depth=24,halfX=(Math.abs(Math.cos(p.yaw))*w+Math.abs(Math.sin(p.yaw))*depth)/2,halfZ=(Math.abs(Math.sin(p.yaw))*w+Math.abs(Math.cos(p.yaw))*depth)/2;
   for(let d=clamp(Math.floor((z-halfZ)/T),0,31);d<=clamp(Math.floor((z+halfZ)/T),0,31);d++)
   for(let j=clamp(Math.floor((y-h/2)/T),0,H-1);j<=clamp(Math.floor((y+h/2)/T),0,H-1);j++)
   for(let i=clamp(Math.floor((x-halfX)/T),0,W-1);i<=clamp(Math.floor((x+halfX)/T),0,W-1);i++){
    if(!s.players.some(q=>q.hp>0&&Math.abs(q.x-i*T-6)<14&&Math.abs(q.y-12-j*T-6)<22&&Math.abs(q.z-d*T-6)<14))setBlock((d*H+j)*W+i,26)}},
  zone:(p,x,y,r,duration,interval,cb,color,z=p.z)=>s.zones.push({p,x,y,z,r,life:duration,interval,tick:interval,cb,color}),
  area:(p,x,y,r,n,color,z=p.z)=>{fx(x,y,r,color,'burst',z);tileDamage(x,y,r,n,z);for(const q of enemies(p))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<=r+9)damage(q,n)},
  bolt:(p,angle,o)=>{const yaw=p.yaw+(o.yawOffset||0),dx=Math.cos(angle)*Math.cos(yaw),dz=Math.cos(angle)*Math.sin(yaw),dy=Math.sin(angle);
   s.shots.push({p,x:p.x+dx*10,y:p.y-14+dy*10,z:p.z+dz*10,vx:dx*o.speed,vy:dy*o.speed,vz:dz*o.speed,r:3,life:4,color:'#ffd76d',...o,hit:new Set()})}
 };
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
  const pool=SPELLS.filter(sp=>sp.category==='Ranged'&&sp.cost<=maxMana);
  const p=actor(1,630+Math.random()*240,[SPELLS[0].id,...pool.slice(0,Math.min(4,s.wave)).map(v=>v.id)],true);
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
   if(p.y>580){damage(p,22);p.x=p.side?830:125;p.y=40;p.vy=0}
   if(p.pending>=0){p.cast=Math.max(0,p.cast-dt);if(!p.cast){const sp=byId.get(p.ids[p.pending]);p.pending=-1;fx(p.x,p.y-14,14,'#ffdc94','cast',p.z);const look=p.yaw;p.yaw=p.castYaw;sp.cast(api,p,p.castingAngle);p.yaw=look}}
  }
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
   if(!b.dead&&(b.life<=0||b.x<0||b.x>960||b.y>550||b.y< -150||b.z<0||b.z>384)){b.onExpire?.(api,b.p,b.x,b.y,b.z);b.dead=true}
  }
  s.shots=s.shots.filter(v=>!v.dead);for(const z of s.zones){z.life-=dt;z.tick-=dt;if(z.tick<=0){z.cb(api,z.p,z.x,z.y,z.z);z.tick+=z.interval}}
  s.zones=s.zones.filter(z=>z.life>0);for(const e of s.effects)e.life-=dt;s.effects=s.effects.filter(e=>e.life>0);
  if(s.players[0].hp<=0)s.over=mode==='multi'?'Red wizard wins':'The tower falls';
  else if(mode==='multi'&&s.players[1].hp<=0)s.over='Blue wizard wins';
  else if(mode==='waves'&&!enemies(s.players[0]).length){waveWait+=dt;if(waveWait>2){s.players.splice(1);inputs.splice(1);startWave()}}
 }
 function snapshot(includeTiles=true){return {time:s.time,map:s.map,wave:s.wave,over:s.over,players:s.players.map(({brain,castingAngle,...p})=>p),shots:s.shots.map(({x,y,z,r,color,vx,vy})=>({x,y,z,r,color,vx,vy})),effects:s.effects,zones:s.zones.map(({x,y,z,r,color})=>({x,y,z,r,color})),...(includeTiles?{tiles:s.tiles}:{})}}
 return {dirty,state:s,command,input,tick,snapshot,spawn};
}
