// Match-authoritative, finite-duration adaptation of Hakari's gambling technique.
export function hakariSpells(){
 const book=[],domains=new WeakMap(),green='#69ffb0';
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const front=(a,p,r)=>a.enemies(p).filter(q=>dist(p,q)<r&&a.clearLine(p,q)&&(q.x-p.x)*Math.cos(p.yaw)+(q.z-p.z)*Math.sin(p.yaw)>0);
 const fx=(a,p,id,r=28)=>a.fx(p.x,p.y-12,r,green,'hakari-'+id,p.z,p.yaw,0,.65);
 function add(id,name,category,symbol,cost,time,description,cast){book.push({id:'hakari-'+id,name:'Hakari: '+name,category,symbol,cost,time,description:'Hakari · '+description,design:{motion:'orbit',color:green},cast})}
 function zone(a,p,at,r,life,interval,style,fn){return a.zone(p,at.x,at.y,r/1.12,life,interval,fn,green,at.z,'hakari-'+style)}
 function jackpot(a,p){
  a.status(p,'hakariJackpot',20);a.status(p,'haste',20);fx(a,p,'jackpot',48);
  const z=zone(a,p,p,28,20,.25,'jackpot',(w,o)=>{if(o.hp<=0||!(o.statuses.hakariJackpot>0)){z.life=0;return}z.x=o.x;z.y=o.y;z.z=o.z;w.heal(o,3);o.mana=Math.min(o.maxMana,o.mana+o.maxMana*.025)});
 }
 add('reserve-balls','Reserve Balls','Evocation','●',22,.25,'Fire three metal pachinko balls in a tight spread. Each deals 10 damage; hits during Idle Death Gamble improve the next roll.',(a,p,t)=>{
  for(const yawOffset of [-.09,0,.09])a.bolt(p,t,{style:'hakari-reserve-balls',color:green,speed:490,r:5,damage:10,yawOffset,onHit:(w,o,q)=>{const d=domains.get(o);if(q&&d?.life>0)d.luck=Math.min(.3,(d.luck||0)+.04)}});
 });
 add('shutter-doors','Shutter Doors','Hexes','▣',38,.6,'Conjure train doors at your aim. After a half-second warning they slam shut, dealing 32 damage and rooting enemies in the 42-unit area for 1.5 seconds.',(a,p)=>{
  const c=a.sightPoint(p);let fired=false;
  zone(a,p,c,42,1.3,.5,'shutter-doors',(w,o)=>{if(fired||o.hp<=0)return;fired=true;for(const q of w.enemies(o))if(dist(c,{...q,y:q.y-12})<42&&w.clearLine(o,q)){w.hurt(q,32);w.status(q,'root',1.5);const d=domains.get(o);if(d?.life>0)d.luck=Math.min(.3,(d.luck||0)+.08)}});
 });
 add('rough-energy','Rough Energy','Evocation','✊',18,.15,'Deliver three close-range cursed-energy punches over half a second, each dealing 10 damage. The final punch launches enemies backward.',(a,p)=>{
  let n=0;zone(a,p,p,1,.61,.18,'timer',(w,o)=>{if(o.hp<=0)return;n++;fx(w,o,'rough-energy');for(const q of front(w,o,48)){w.hurt(q,10);if(n===3){q.vx+=Math.cos(o.yaw)*260;q.vz+=Math.sin(o.yaw)*260}}});
 });
 add('door-guard','Door Guard','Warding','▥',30,.15,'Gain 25 shield and half incoming damage for 1.2 seconds behind train doors. If hit during the guard, retaliate once for 25 damage against nearby enemies in front.',(a,p)=>{
  p.shield=Math.min(100,p.shield+25);a.status(p,'armor',1.2);const taken=(p.damageTaken||0)+(p.shieldTaken||0);let used=false;
  const z=zone(a,p,p,25,1.2,.1,'door-guard',(w,o)=>{z.x=o.x;z.y=o.y;z.z=o.z;if(o.hp<=0){z.life=0;return}if(!used&&(o.damageTaken||0)+(o.shieldTaken||0)>taken){used=true;fx(w,o,'rough-energy',40);for(const q of front(w,o,60))w.hurt(q,25)}});
 });
 add('fever-rush','Fever Rush','Movement','↠',32,.3,'Rush up to 100 units through clear space, striking enemies along the route for 28 damage once each. Jackpot increases the hit to 42.',(a,p)=>{
  const hit=new Set();for(let i=0;i<10;i++){a.blink(p,Math.cos(p.yaw)*10,0,Math.sin(p.yaw)*10);fx(a,p,'fever-rush',18);for(const q of front(a,p,35))if(!hit.has(q)){hit.add(q);a.hurt(q,p.statuses.hakariJackpot>0?42:28)}}
 });
 add('idle-death-gamble','Idle Death Gamble','Warding','777',180,2,'Create a pachinko station for 12 seconds. Roll every 3 seconds: 25%, 40%, 55%, then a guaranteed jackpot. Ball and door hits improve the next roll. Stay within 160 units. Jackpot lasts 20 seconds: haste, 12 health/second and 10% maximum mana/second. Recasting replaces the old domain; cannot roll during jackpot.',(a,p)=>{
  const old=domains.get(p);if(old)old.life=0;const c={x:p.x,y:p.y,z:p.z};let roll=0;
  const z=zone(a,p,c,160,12.05,3,'idle-death-gamble',(w,o)=>{if(o.hp<=0||dist(o,c)>160||o.statuses.hakariJackpot>0){z.life=0;return}roll++;const win=roll===4||Math.random()<.1+.15*roll+(z.luck||0);z.luck=0;fx(w,c,win?'jackpot':'roll',60);if(win){z.life=0;jackpot(w,o)}});domains.set(p,z);
 });
 return book;
}
