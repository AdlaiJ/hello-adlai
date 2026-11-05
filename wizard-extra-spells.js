export function extraSpells(){
 const book=[];
 let category,motion,tint;
 function school(name,formation,color){category=name;motion=formation;tint=color}
 function add(name,symbol,cost,time,description,cast){
  const id=name.toLowerCase().replaceAll(' ','-');
  const spellColor=tint;
  book.push({id,name,symbol,cost,time,description,category,design:{motion,color:spellColor},cast(api,p,pitch){
   const reach=id==='thunder-tongs'?42:18;
   const offset=id==='thunder-tongs'?0:18;
   api.fx(p.x+Math.cos(p.yaw)*offset,p.y-18,reach,spellColor,id,p.z+Math.sin(p.yaw)*offset,p.yaw,pitch);
   cast(api,p,pitch);
  }});
 }
 const near=(a,p,r)=>a.enemies(p).filter(q=>Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<=r);
 const step=(a,p,dist,turn=0,up=0)=>a.blink(p,Math.cos(p.yaw+turn)*dist,-up,Math.sin(p.yaw+turn)*dist);
 const guard=(p,n)=>{p.shield=Math.min(100,p.shield+n)};
 function pulse(a,p,r,n,dx=0,dz=0){a.area(p,p.x+dx,p.y-10,r,n,'#ff9972',p.z+dz)}
 function shot(a,p,pitch,style,options={}){
  a.bolt(p,pitch,{style,speed:300,damage:10,r:4,color:'#ffc785',...options});
 }
 function timer(a,p,seconds,interval,fn,color,style){
  a.zone(p,p.x,p.y-12,9,seconds+.001,interval,fn,color,p.z,style);
 }
 school('Evocation','blades','#ffad61');
 add('Brimstone Triplet','∴',26,.5,'Launch three fireballs. The center ball bursts while the outer pair curve toward enemies.',(a,p,t)=>{
  for(const side of [-1,0,1])shot(a,p,t,'brimstone-triplet',{yawOffset:side*.32,homing:side?2:0,blast:side?0:24});
 });
 add('Pinball Furnace','♨',42,.65,'A bouncing furnace ball scorches cover with a small explosion on each ricochet.',(a,p,t)=>shot(a,p,t,'pinball-furnace',{bounces:4,blast:19,damage:9}));
 add('Widowmaker Nail','†',31,.7,'Drive a piercing nail through three enemies. Each hit roots the victim briefly.',(a,p,t)=>shot(a,p,t,'widowmaker-nail',{speed:470,pierce:2,damage:16,onHit:(w,o,q)=>{if(q)w.status(q,'root',.7)}}));
 add('Spiral Battery','꩜',95,1.3,'Fire twelve stronger sparks (12 damage each) in a spiral over your next three seconds.',(a,p,t)=>{let n=0;timer(a,p,3,.25,w=>shot(w,p,t,'spiral-battery',{damage:12,yawOffset:n++*Math.PI/6}), '#ffcf72','spiral-battery')});
 add('Blast Compass','✥',67,.9,'Four piercing shots (12 damage each) leave your position. A second volley fills the diagonal gaps a moment later.',(a,p,t)=>{
  const volley=(turn)=>{for(let i=0;i<4;i++)shot(a,p,t,'blast-compass',{yawOffset:turn+i*Math.PI/2,pierce:1,damage:12})};volley(0);timer(a,p,.5,.5,()=>volley(Math.PI/4),'#ffce90','blast-compass');
 });
 add('Thunder Tongs','⋈',58,.8,'Drag enemies within 75 units inward, then strike the center with a 27-damage blast.',(a,p)=>{for(const q of near(a,p,75))a.blink(q,(p.x-q.x)*.6,0,(p.z-q.z)*.6);pulse(a,p,35,27)});
 add('Sunken Fuse','⌁',86,1.2,'Plant a fuse at your feet. After two seconds it blasts the ground for 38 damage and launches nearby enemies upward.',(a,p)=>timer(a,p,2,2,(w,o,x,y,z)=>{w.area(o,x,y,58,38,'#ff743d',z);for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<63)q.vy=-340},'#ff783d','sunken-fuse'));
 add('Ash Carousel','✹',210,2.1,'Six explosions circle your original position, then the center erupts (16 damage per outer blast, 42 at the center).',(a,p)=>{let i=0;timer(a,p,3.5,.5,(w,o,x,y,z)=>{const end=i===6,angle=i++*Math.PI/3;w.area(o,x+(end?0:50*Math.cos(angle)),y,end?55:28,end?42:16,'#ff8844',z+(end?0:50*Math.sin(angle)))},'#ff8855','ash-carousel')});
 add('Kingfisher Dive','⤓',36,.55,'Send a heavy diving shard down your sightline. Its splash slows enemies it hits directly.',(a,p,t)=>shot(a,p,t,'kingfisher-dive',{gravity:250,blast:28,damage:14,onHit:(w,o,q)=>{if(q)w.status(q,'slow',3)}}));
 school('Movement','gate','#ffe58a');
 add('Sideslip','⇥',12,.1,'Slip to your right and shed any slowing effect.',(a,p)=>{step(a,p,44,Math.PI/2);p.statuses.slow=0});
 add('Rabbit Kick','♘',20,.2,'Leap backward and knock nearby enemies forward into the air.',(a,p)=>{for(const q of near(a,p,38))q.vy=-250;step(a,p,-32,0,6);p.vy=-280});
 add('Lighthouse Step','☼',55,.6,'Travel to your nearest living familiar and give it 20 shield.',(a,p)=>{const f=a.allies(p).sort((x,y)=>Math.hypot(x.x-p.x,x.z-p.z)-Math.hypot(y.x-p.x,y.z-p.z))[0];if(f){a.blink(p,f.x-p.x,f.y-p.y,f.z-p.z);guard(f,20)}});
 add('Rocket Braces','⇈',35,.4,'Leap straight up. A second thrust fires three quarters of a second later.',(a,p)=>{p.vy=-300;timer(a,p,.75,.75,()=>{p.vy=-320},'#ffcf55','rocket-braces')});
 add('Passing Bell','♧',65,.75,'Ring both ends of a forward blink for 19 damage each.',(a,p)=>{pulse(a,p,29,19);step(a,p,72);pulse(a,p,29,19)});
 add('Sky Anchor','⚓',52,.4,'Pin a point above you. After one second, pull yourself up to it and gain jump power for five seconds.',(a,p)=>timer(a,p,1,1,(w,o,x,y,z)=>{w.blink(o,x-o.x,y-45-o.y,z-o.z);w.status(o,'leap',5)},'#e8c672','sky-anchor'));
 add('Tortoise Sprint','➜',40,.4,'Run with haste for three seconds, then gain armor for three seconds.',(a,p)=>{a.status(p,'haste',3);timer(a,p,3,3,()=>a.status(p,'armor',3),'#bfdd88','tortoise-sprint')});
 add('Escape Hatch','⇲',78,.8,'Bore a hole underfoot, dive into it, and gain a 1.5-second phase shield.',(a,p)=>{a.cutTerrain(p.x,p.y+10,20,100,p.z);a.blink(p,0,24,0);a.status(p,'phased',1.5)});
 school('Summoning','flock','#a7f096');
 add('Frost Kennel','♜',68,.9,'Call an owl with freezing court magic and protect it with 22 shield.',(a,p)=>{const f=a.summon(p,'frost');a.status(f,'court',9);guard(f,22)});
 add('Bone Pincer','⚔',84,1.2,'Two skeleton swordsmen rise on opposite sides of you for 14 seconds.',(a,p)=>{for(const side of [-1,1]){const f=a.summon(p,'squire',14);step(a,f,38,side*Math.PI/2)}});
 add('Traveling Infirmary','✚',90,1.4,'Summon a medic and a shield crab as a traveling support pair for 14 seconds.',(a,p)=>{a.summon(p,'medic',14);a.summon(p,'bastion',14)});
 add('Fletchers Roost','➶',56,.85,'Raise a short wall and summon a skeletal archer above it for 14 seconds.',(a,p)=>{a.build(p,p.x+36*Math.cos(p.yaw),p.y-12,28,24,p.z+36*Math.sin(p.yaw));const f=a.summon(p,'archer',14);step(a,f,14,0,32)});
 add('Ember Courier','✉',72,1,'Send out a newt. Three seconds later a 36-damage fire parcel explodes at its position if it survives.',(a,p)=>{const f=a.summon(p,'ember');timer(a,p,3,3,w=>{if(w.allies(p).includes(f))w.area(p,f.x,f.y-10,48,36,'#ff703b',f.z)},'#ff874c','ember-courier')});
 add('Grave Relay','☽',105,1.4,'Summon a wraith. If it survives four seconds, blink to it and heal 18.',(a,p)=>{const f=a.summon(p,'wraith');timer(a,p,4,4,w=>{if(w.allies(p).includes(f)){w.blink(p,f.x-p.x,f.y-p.y,f.z-p.z);w.heal(p,18)}},'#a9efcc','grave-relay')});
 add('Mole Survey','⚒',48,.7,'Summon a burrower and drill three pockets of cover ahead of it.',(a,p)=>{const f=a.summon(p,'burrow');for(let i=1;i<=3;i++)a.cutTerrain(f.x+18*i*Math.cos(p.yaw),f.y,13,60,f.z+18*i*Math.sin(p.yaw))});
 add('Thunder Brood','ϟ',180,2,'Hatch a storm finch immediately, then another each second until three have hatched; each lasts 14 seconds.',(a,p)=>{a.summon(p,'storm',14);timer(a,p,2,1,()=>a.summon(p,'storm',14),'#ffe278','thunder-brood')});
 add('Last Battalion','♛',410,3.7,'Call a squire, archer and medic for 14 seconds. Each receives shield equal to your missing health, up to 50.',(a,p)=>{for(const kind of ['squire','archer','medic'])guard(a.summon(p,kind,14),Math.min(50,p.maxHp-p.hp))});
 school('Restoration','bloom','#8cffe0');
 add('Cold Compress','❄',11,.18,'Extinguish yourself. Heal 16 if burning, otherwise heal 6.',(a,p)=>{a.heal(p,p.statuses.burn>0?16:6);p.statuses.burn=0});
 add('Borrowed Bandage','✜',22,.35,'Convert up to 16 shield into twice as much health.',(a,p)=>{const n=Math.min(16,p.shield);p.shield-=n;a.heal(p,2*n)});
 add('Surgeon Finch','✧',34,.5,'Heal yourself for 12 and fully heal your most injured familiar.',(a,p)=>{a.heal(p,12);const f=a.allies(p).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];if(f)a.heal(f,f.maxHp)});
 add('Field Rations','♨',45,.7,'Heal 8 immediately and gain five seconds of regeneration if you have a living familiar.',(a,p)=>{a.heal(p,8);if(a.allies(p).length)a.status(p,'regen',5)});
 add('Mercy Dividend','♡',60,.8,'Heal 24. Any excess healing becomes shield for each of your familiars.',(a,p)=>{const extra=Math.max(0,24-p.maxHp+p.hp);a.heal(p,24);for(const f of a.allies(p))guard(f,extra)});
 add('Walking Remedy','♩',43,.55,'For four seconds, heal 6 each second you are moving quickly.',(a,p)=>timer(a,p,4,1,()=>{if(Math.hypot(p.vx,p.vz)>60)a.heal(p,6)},'#9fffc5','walking-remedy'));
 add('Emergency Stitch','⚕',75,.6,'Below half health, heal 42. Above it, bank protection against the next lethal hit for 2.5 seconds.',(a,p)=>{if(p.hp<p.maxHp/2)a.heal(p,42);else a.status(p,'crowned',2.5)});
 add('Spring Equinox','❀',310,3,'Heal 60% of your missing health and heal every familiar by the same amount. Then clear roots and burns from all of you.',(a,p)=>{const n=(p.maxHp-p.hp)*.6;for(const q of [p,...a.allies(p)]){a.heal(q,n);q.statuses.root=0;q.statuses.burn=0}});
 school('Warding','shell','#c5a6ff');
 add('Copper Ground','⏚',18,.3,'Gain 12 shield and turn shield damage into mana for two seconds.',(a,p)=>{guard(p,12);a.status(p,'capacitor',2)});
 add('Glass Umbrella','☂',25,.35,'Build a roof over your head and prime a one-second projectile parry.',(a,p)=>{a.build(p,p.x,p.y-48,56,8,p.z);a.status(p,'prism',1)});
 add('Twin Bulwark','Ⅱ',54,.8,'Raise taller parallel walls to your left and right, leaving the front and back open.',(a,p)=>{const forward=p.yaw;try{p.yaw+=Math.PI/2;for(const s of [-1,1])a.build(p,p.x+s*30*Math.cos(p.yaw),p.y-20,70,48,p.z+s*30*Math.sin(p.yaw))}finally{p.yaw=forward}});
 add('Bodyguard Pact','♙',44,.5,'Share 40 shield evenly between you and your living familiars.',(a,p)=>{const team=[p,...a.allies(p)];for(const q of team)guard(q,40/team.length)});
 add('Mirror March','♢',72,.9,'Reflect projectiles for 2.5 seconds while hasted, then briefly root yourself.',(a,p)=>{a.status(p,'reflect',2.5);a.status(p,'haste',2.5);timer(a,p,2.5,2.5,()=>a.status(p,'root',.6),'#c8aaff','mirror-march')});
 add('Brittle Treaty','◇',65,.7,'Raise 31 shield. If all your shield is gone after two seconds, burst for 29 damage.',(a,p)=>{guard(p,31);timer(a,p,2,2,()=>{if(!p.shield)pulse(a,p,55,29)},'#bcacff','brittle-treaty')});
 add('Panic Room','⌂',135,1.6,'Raise four walls around you and regenerate for four seconds.',(a,p)=>{const yaw=p.yaw;try{for(let i=0;i<4;i++){p.yaw=yaw+i*Math.PI/2;a.build(p,p.x+32*Math.cos(p.yaw),p.y-18,72,36,p.z+32*Math.sin(p.yaw))}}finally{p.yaw=yaw}a.status(p,'regen',4)});
 add('Glacier Oath','❅',240,2.5,'Cover your team in 42 shield. For six seconds attackers near anyone with this shield are slowed on impact.',(a,p)=>{for(const q of [p,...a.allies(p)]){guard(q,42);a.status(q,'polar',6)}});
 school('Hexes','vortex','#ff9bc4');
 add('Tongue Tangle','♭',19,.3,'A feather silences its target for two seconds, or four if they are casting.',(a,p,t)=>shot(a,p,t,'tongue-tangle',{damage:3,onHit:(w,o,q)=>{if(q)w.status(q,'silence',q.cast>0?4:2)}}));
 add('Debt Collector','¤',39,.55,'A quill strips up to 18 shield from its target and gives that shield to you.',(a,p,t)=>shot(a,p,t,'debt-collector',{damage:4,onHit:(w,o,q)=>{if(q){const n=Math.min(18,q.shield);q.shield-=n;guard(o,n)}}}));
 add('Winter Verdict','♮',37,.6,'Chill nearby enemies for three seconds. Those already slowed are rooted instead.',(a,p)=>{for(const q of near(a,p,70))a.status(q,q.statuses.slow>0?'root':'slow',3)});
 add('Wicked Wick','♆',48,.65,'Ignite nearby enemies. Already burning targets take 18 immediate damage instead.',(a,p)=>{for(const q of near(a,p,62)){if(q.statuses.burn>0)a.hurt(q,18);else a.status(q,'burn',3)}});
 add('Heavy Crown','♚',64,.85,'Strip haste and leap from enemies within 138 units and pull airborne targets downward.',(a,p)=>{for(const q of near(a,p,138)){q.statuses.haste=0;q.statuses.leap=0;if(!q.ground)q.vy=330}});
 add('Echo Tax','♬',78,1,'Mark nearby enemies. After two seconds, each surviving marked enemy takes damage equal to its distance traveled, up to 38.',(a,p)=>{const marks=near(a,p,104).map(q=>[q,q.x,q.z]);timer(a,p,2,2,()=>{for(const [q,x,z] of marks)if(q.hp>0)a.hurt(q,Math.min(38,Math.hypot(q.x-x,q.z-z)))},'#fc91bf','echo-tax')});
 add('Unholy Exchange','⇄',98,1.1,'Trade your current shield amount with the closest enemy within 127 units.',(a,p)=>{const dist=q=>Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z);const q=near(a,p,127).sort((x,y)=>dist(x)-dist(y))[0];if(q)[p.shield,q.shield]=[q.shield,p.shield]});
 add('Court of Thorns','♰',365,3.2,'For six seconds, enemies within 115 units of the original court take 6 damage per second, or 16 if rooted.',(a,p)=>timer(a,p,6,1,(w,o,x,y,z)=>{for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<=115)w.hurt(q,q.statuses.root>0?16:6)},'#ff779e','court-of-thorns'));

 function cone(a,p,pitch,cold){
  const reach=125,spread=.6,dx=Math.cos(pitch)*Math.cos(p.yaw),dy=Math.sin(pitch),dz=Math.cos(pitch)*Math.sin(p.yaw);
  for(const q of a.enemies(p)){
   const x=q.x-p.x,y=q.y-p.y,z=q.z-p.z,d=Math.hypot(x,y,z);
   if(d>reach||d>0&&(x*dx+y*dy+z*dz)/d<Math.cos(spread)||!a.clearLine(p,q))continue;
   a.hurt(q,cold?24:30);a.status(q,cold?'slow':'burn',cold?4:3);
  }
  a.fx(p.x,p.y-12,125/1.12,cold?'#a1eaff':'#ff7335',
   cold?'cold-cone-stream':'fire-cone-stream',p.z,p.yaw,pitch,1.2);
 }
 school('Evocation','fountain','#9eeaff');
 add('Cone of Cold','❄',38,.65,'Unleash a dense swirling cone of icy mist, reaching 125 units for 24 damage and slow enemies for four seconds. Cover blocks the frost.',(a,p,t)=>cone(a,p,t,true));
 school('Evocation','fountain','#ff863f');
 add('Cone of Fire','♨',42,.8,'Unleash a dense swirling cone of flame and smoke, reaching 125 units for 30 damage and ignite enemies for three seconds. Cover blocks the flames.',(a,p,t)=>cone(a,p,t,false));
 add('Incendiary Volley','⁂',88,1.3,'Launch five explosive firebolts in a spread. Each deals 10 impact and 10 splash damage, and ignites direct hits for three seconds.',(a,p,t)=>{
  for(let i=-2;i<=2;i++)shot(a,p,t,'incendiary-volley',{speed:290,damage:10,blast:24,yawOffset:i*.12,onHit:(w,o,q)=>{if(q)w.status(q,'burn',3)}});
 });
 school('Evocation','fall','#a1cfff');
 add('Comet','☄',260,2.6,'Launch a blazing ice comet. It deals 35 impact and 35 splash damage, then leaves a freezing crater for four seconds.',(a,p,t)=>shot(a,p,t,'comet',{
  speed:260,r:10,life:6,damage:35,blast:70,onHit:(w,o,q,x,y,z)=>w.zone(o,x,y,70,4.05,1,(v,owner,cx,cy,cz)=>{
   for(const enemy of v.enemies(owner))if(Math.hypot(enemy.x-cx,enemy.y-12-cy,enemy.z-cz)<78){v.hurt(enemy,6);v.status(enemy,'slow',1.3)}
  },'#8dafff',z,'comet-crater')
 }));
 school('Hexes','vortex','#ac72df');
 add('Tentacle Field','≋',180,2,'Raise a field of writhing tentacles ahead for eight seconds. Every second they lash enemies for 9 damage and briefly root them.',(a,p)=>{
  const x=p.x+110*Math.cos(p.yaw),z=p.z+110*Math.sin(p.yaw),y=a.surface(x,z,0);if(y===null)return;
  a.zone(p,x,y,85,8.05,1,(w,o,cx,cy,cz)=>{
   for(const q of w.enemies(o))if(Math.hypot(q.x-cx,q.z-cz)<95&&Math.abs(q.y-cy)<60){w.hurt(q,9);w.status(q,'root',.65)}
  },'#985acb',z,'tentacle-field');
 });
 school('Summoning','gate','#eb6556');
 add('Demon Arm','✊',320,3,'Open a portal ahead. A massive clawed arm reaches out, slams for 55 damage, and launches nearby enemies upward.',(a,p)=>{
  const x=p.x+110*Math.cos(p.yaw),z=p.z+110*Math.sin(p.yaw),y=a.surface(x,z,0);if(y===null)return;
  let hit=false;a.zone(p,x,y,80,2.4,1.2,(w,o,cx,cy,cz)=>{
   if(hit)return;hit=true;w.area(o,cx,cy,80,55,'#ff6954',cz);
   for(const q of w.enemies(o))if(Math.hypot(q.x-cx,q.z-cz)<90&&Math.abs(q.y-cy)<90){q.vy=-390;q.ground=false}
  },'#c74563',z,'demon-arm');
 });
 school('Summoning','flock','#b983ef');
 add('Summon Purple Wurm','♜',360,3.5,'Summon a massive purple wurm with 220 health for 20 seconds. It tunnels through blocks, erupts every five seconds for 32 area damage and launches enemies upward, then bites for 24 damage.',(a,p)=>a.summon(p,'purple-wurm',20));
 school('Summoning','vortex','#9a8bff');
 add('Summon Void Entity','◈',480,4,'Summon a floating void entity with 85 health for 20 seconds. It cycles through a slowing three-orb volley, a piercing eye beam, a rooting tentacle sweep, and a delayed gravity explosion that pulls enemies inward.',(a,p)=>a.summon(p,'void-entity',20));
 school('Summoning','ribs','#b6e4b0');
 add('Undead Army','☠',800,6,
  'Raise twelve undead for 25 seconds: six skeleton swordsmen, four skeletal archers, and two life-draining wraiths. Each has 28 health. They hunt enemies and can be killed.',
  (a,p)=>{
   const ranks=['squire','squire','squire','squire','squire','squire','archer','archer','archer','archer','wraith','wraith'];
   const yaw=p.yaw;
   try{
    for(const [i,kind] of ranks.entries()){
     p.yaw=yaw+i*Math.PI*2/ranks.length;
     const soldier=a.summon(p,kind,25);
     a.blink(soldier,Math.cos(p.yaw)*36,0,Math.sin(p.yaw)*36);
     a.fx(soldier.x,soldier.y-8,18,'#b6e4b0','undead-army',soldier.z,p.yaw,0);
    }
   }finally{p.yaw=yaw}
  });
 school('Evocation','vortex','#b7dbe7');
 add('Tornado','🌪',220,2.5,
  'Send a tornado forward for eight seconds. It pulls enemies into its 90-unit reach, lifts them, deals 6 damage every half second, and shreds terrain.',
  (a,p)=>{
   const yaw=p.yaw,x=p.x+55*Math.cos(yaw),z=p.z+55*Math.sin(yaw);
   const floor=a.surface(x,z,0)??p.y;
   const storm=a.zone(p,x,floor,80,8.05,.5,(w,o,cx,cy,cz)=>{
    w.cutTerrain(cx,cy-12,32,28,cz);
    for(const q of w.enemies(o)){
     const dx=cx-q.x,dz=cz-q.z,d=Math.hypot(dx,dz);
     if(d>90||Math.abs(q.y-cy)>130||!w.clearLine({x:cx,y:cy,z:cz},q))continue;
     const scale=Math.min(1,20/Math.max(1,d));
     w.blink(q,dx*scale-dz*.08,0,dz*scale+dx*.08);
     q.vy=-240;q.ground=false;w.hurt(q,6);
    }
   },'#b7dbe7',z,'tornado');
   storm.vx=Math.cos(yaw)*48;storm.vz=Math.sin(yaw)*48;
  });

 school('Evocation','fault','#d9b18a');
 add('Frack','⛏',16,0,'Hold this spell key or button to spray piercing rock shards at 16 mana per second. Each shard deals 4 damage and breaks blocks.',(a,p,t)=>{
  shot(a,p,t,'frack',{speed:430,damage:4,r:3,pierce:1,life:.75});
 });
 book.at(-1).channel={mana:16,interval:.15};
 school('Evocation','fountain','#ff8a3c');
 add('Fire Jet','♨',22,0,'Hold this spell key or button to pour out a short-range stream of flame at 22 mana per second. Each flame deals 3 damage and refreshes a brief burn.',(a,p,t)=>{
  shot(a,p,t,'fire-jet',{speed:280,damage:3,r:6,life:.45,onHit:(w,o,q)=>{if(q)w.status(q,'burn',.5)}});
  a.fx(p.x,p.y-12,100/1.12,'#ff8338','fire-cone-stream',p.z,p.yaw,t,.18);
 });
 book.at(-1).channel={mana:22,interval:.15};

 school('Evocation','fall','#b8ed61');
 add('Acid Rain','☂',190,2,
  'Call a corrosive storm up to 240 units along your aim for seven seconds. Acid falls over a 95-unit radius, dealing 5 damage every half second to exposed enemies and eating through cover.',
  (a,p,pitch)=>{
   const distance=240*Math.cos(pitch);
   const x=p.x+Math.cos(p.yaw)*distance,z=p.z+Math.sin(p.yaw)*distance;
   const floor=a.surface(x,z,0);if(floor===null)return;
   a.zone(p,x,floor,95,7.05,.5,(w,o,cx,cy,cz)=>{
    for(const q of w.enemies(o)){
     if(Math.hypot(q.x-cx,q.z-cz)>106)continue;
     const roof=w.surface(q.x,q.z,0);
     if(roof!==null&&q.y>roof+5)continue;
     if(q.y<cy-145||q.y>cy+50)continue;
     w.hurt(q,5);
     w.fx(q.x,q.y-12,8,'#c5f477','acid-splash',q.z);
    }
    for(let i=0;i<10;i++){
     const angle=w.now()*1.7+i*2.4,radius=90*Math.sqrt((i+.5)/10);
     const dx=cx+Math.cos(angle)*radius,dz=cz+Math.sin(angle)*radius,top=w.surface(dx,dz,0);
     if(top!==null){
      w.cutTerrain(dx,top+3,12,9,dz);
      w.fx(dx,top,7,'#b8ed61','acid-splash',dz);
     }
    }
   },'#b8ed61',z,'acid-rain');
  });
 school('Summoning','ribs','#ff863e');
 add('Imp Furnace','♨',180,2,'Summon a killable 90-HP furnace for 18 seconds. It releases eight fire imps, one every two seconds. Each 16-HP imp chases enemies and leaps onto them, exploding for 18 damage in a small area. Imps last 12 seconds.',(a,p)=>{
  const f=a.summon(p,'imp-furnace',18);
  const x=p.x+Math.cos(p.yaw)*45,z=p.z+Math.sin(p.yaw)*45;
  const floor=a.surface(x,z,0);
  if(floor!==null){f.x=x;f.z=z;f.y=floor}
 });
 school('Evocation','blades','#ff6878');
 add('Dismantle','╱',28,.35,'Sukuna-inspired: launch three thin, piercing cutting blades in a fan. Each deals 9 damage and slices through two targets.',(a,p,t)=>{
  for(const side of [-1,0,1])shot(a,p,t,'dismantle',{speed:530,damage:9,pierce:1,r:3,yawOffset:side*.11,color:'#ffbac4'});
 });
 add('Cleave','✕',65,.75,'Sukuna-inspired: a close-range cross cut hits visible enemies in front of you within 65 units. Deals 22 damage plus 15% of their maximum health, capped at 55 total.',(a,p)=>{
  for(const q of near(a,p,65))if(Math.cos(Math.atan2(q.z-p.z,q.x-p.x)-p.yaw)>.3&&a.clearLine(p,q))a.hurt(q,Math.min(55,22+q.maxHp*.15));
  a.fx(p.x+30*Math.cos(p.yaw),p.y-12,45,'#ffbac4','cleave',p.z+30*Math.sin(p.yaw),p.yaw);
 });
 school('Evocation','fountain','#ffae43');
 add('Furnace Arrow','➶',230,2.6,'Sukuna-inspired: fire a blazing arrow that bursts for 42 splash damage plus 28 on direct impact, leaving a burning crater for four seconds.',(a,p,t)=>shot(a,p,t,'furnace-arrow',{
  speed:430,damage:28,r:6,color:'#ffae43',onHit:(w,o,q,x,y,z)=>{
   w.area(o,x,y,75,42,'#ff9d32',z);
   w.zone(o,x,y,75,4.05,1,(v,c,cx,cy,cz)=>{for(const enemy of v.enemies(c))if(Math.hypot(enemy.x-cx,enemy.y-12-cy,enemy.z-cz)<84){v.hurt(enemy,5);v.status(enemy,'burn',1.2)}},'#ff8a2c',z,'furnace-arrow');
  }
 }));
 school('Hexes','weave','#ff788e');
 add('Spiderweb Cut','⌗',115,1.2,'Sukuna-inspired: fracture the ground ahead into a cutting web for five seconds. Enemies touching it take 8 damage each second and are briefly rooted; the web also cuts terrain.',(a,p)=>{
  const x=p.x+90*Math.cos(p.yaw),z=p.z+90*Math.sin(p.yaw),y=a.surface(x,z,0);if(y===null)return;
  a.zone(p,x,y,90,5.05,1,(w,o,cx,cy,cz)=>{w.cutTerrain(cx,cy+3,60,8,cz);for(const q of w.enemies(o))if(Math.hypot(q.x-cx,q.z-cz)<100&&Math.abs(q.y-cy)<30){w.hurt(q,8);w.status(q,'root',.45)}},'#ff788e',z,'spiderweb-cut');
 });
 school('Evocation','fault','#ffd5df');
 add('World Sever','⫽',420,3.4,'Sukuna-inspired: send a huge vertical cutting blade through cover and up to nine enemies for 65 damage each, carving a narrow trench through the arena.',(a,p,t)=>shot(a,p,t,'world-sever',{speed:360,damage:65,pierce:8,r:14,life:3.5,color:'#ffd5df',terrainPierce:true}));
 school('Warding','shell','#b9f1ff');
 add('Infinity Veil','∞',140,1.1,'Gojo-inspired: gain 65 shield and six seconds of armor. For six seconds, enemies within 65 units are slowed by the space around you.',(a,p)=>{
  guard(p,65);a.status(p,'armor',6);
  timer(a,p,6,.2,w=>{for(const q of near(w,p,65))w.status(q,'slow',.35);w.fx(p.x,p.y-12,34,'#b9f1ff','infinity-veil',p.z,p.yaw,0,.25)},'#b9f1ff','infinity-veil');
 });
 school('Hexes','vortex','#4cafff');
 add('Lapse Blue','◉',95,1,'Gojo-inspired: create a blue attraction point ahead for three seconds. It drags enemies inward and deals 5 damage every half-second.',(a,p)=>{
  const x=p.x+110*Math.cos(p.yaw),z=p.z+110*Math.sin(p.yaw),y=p.y-12;
  a.zone(p,x,y,105,3.05,.5,(w,o,cx,cy,cz)=>{for(const q of w.enemies(o))if(Math.hypot(q.x-cx,q.y-12-cy,q.z-cz)<118){w.blink(q,(cx-q.x)*.22,0,(cz-q.z)*.22);w.hurt(q,5)}},'#4cafff',z,'lapse-blue');
 });
 school('Evocation','bloom','#ff4d65');
 add('Reversal Red','✹',120,1.3,'Gojo-inspired: launch a red repulsion star. On impact it bursts for 35 damage and forcefully shoves enemies away from the blast.',(a,p,t)=>shot(a,p,t,'reversal-red',{speed:340,damage:0,r:7,color:'#ff4d65',onHit:(w,o,q,x,y,z)=>{
  w.area(o,x,y,85,35,'#ff4d65',z);
  for(const enemy of w.enemies(o)){const dx=enemy.x-x,dz=enemy.z-z,d=Math.hypot(dx,dz);if(Math.hypot(d,enemy.y-12-y)<95){w.blink(enemy,dx/Math.max(1,d)*65,-18,dz/Math.max(1,d)*65);enemy.vy=-180;enemy.ground=false}}
 }}));
 school('Evocation','weave','#ba79ff');
 add('Hollow Purple','◈',500,4,'Gojo-inspired: merge blue and red into a large violet projectile that bores through terrain and up to thirteen enemies for 85 damage each.',(a,p,t)=>shot(a,p,t,'hollow-purple',{speed:230,damage:85,pierce:12,r:24,life:5,color:'#ba79ff',terrainPierce:true}));
 school('Hexes','orbit','#e1eeff');
 add('Unlimited Void','✧',650,4.5,'Gojo-inspired: create an eight-second star-filled domain around your casting position. Enemies inside 155 units are repeatedly rooted and silenced, taking 4 damage each second. Escape the field to recover.',(a,p)=>{
  a.zone(p,p.x,p.y-12,155,8.05,.25,(w,o,x,y,z)=>{for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<174){w.status(q,'root',.35);w.status(q,'silence',.35);w.hurt(q,1)}},'#e1eeff',p.z,'unlimited-void');
 });
 school('Hexes','ribs','#b9b5aa');
 add('Stone Coffin','▣',95,1.4,'Enclose the enemy closest to your aim within 220 units in a stone coffin. The walls, floor and lid have 22 health per block: break them or blink out to escape. Requires line of sight; giant bosses cannot fit.',(a,p,t)=>{
  const candidates=a.enemies(p).filter(q=>!q.boss&&q.kind!=='purple-wurm');
  const aim=[Math.cos(t)*Math.cos(p.yaw),Math.sin(t),Math.cos(t)*Math.sin(p.yaw)];
  const scored=candidates.map(q=>{const dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z,d=Math.hypot(dx,dy,dz);return {q,d,dot:(dx*aim[0]+dy*aim[1]+dz*aim[2])/Math.max(1,d)}})
   .filter(v=>v.d<=220&&v.dot>.9&&a.clearLine(p,v.q)).sort((a,b)=>b.dot-a.dot||a.d-b.d);
  if(scored[0]){const q=scored[0].q;a.stoneCoffin(q);a.fx(q.x,q.y-20,30,'#b9b5aa','stone-coffin',q.z)}
 });
 function realm(a,p,style,color,radius,duration,interval,effect){
  const x=p.x+75*Math.cos(p.yaw),z=p.z+75*Math.sin(p.yaw),y=a.surface(x,z,p.y-60)??p.y;
  a.zone(p,x,y,radius,duration+.01,interval,(w,o,cx,cy,cz)=>{
   const occupants=w.occupants().filter(q=>Math.hypot(q.x-cx,q.z-cz)<=radius*1.12&&Math.abs(q.y-cy)<180);
   effect(w,o,occupants);
  },color,z,style);
 }
 school('Restoration','bloom','#83eeb5');
 add('Demiplane of Sanctuary','❀',200,2.2,'Unfold a pocket garden with a 125-unit radius for 12 seconds. Allies inside recover 4 health each second and shed burning and slow effects. Enemies receive no healing. Leave its boundary to lose the benefit.',(a,p)=>realm(a,p,'demiplane-of-sanctuary','#83eeb5',125,12,1,(w,o,qs)=>{
  for(const q of qs)if(q.side===o.side){w.heal(q,4);q.statuses.burn=0;q.statuses.slow=0}
 }));
 school('Movement','orbit','#a0a1ff');
 add('Demiplane of Stars','✧',180,2,'Open a star-filled pocket realm with a 140-unit radius for 10 seconds. Every wizard inside gains low gravity, slow falling and higher jumps. Its altered gravity fades shortly after you leave.',(a,p)=>realm(a,p,'demiplane-of-stars','#a0a1ff',140,10,.2,(w,o,qs)=>{
  for(const q of qs)if(!q.kind&&!q.boss){w.status(q,'astral',.35);w.status(q,'leap',.35)}
 }));
 school('Hexes','fault','#ff8259');
 add('Demiplane of Cinders','♨',270,2.8,'Open a cracked volcanic pocket realm with a 130-unit radius for 10 seconds. Grounded enemies take 7 damage each second and burn; jumping above its floor avoids the eruption. Allies gain armor while inside.',(a,p)=>realm(a,p,'demiplane-of-cinders','#ff8259',130,10,1,(w,o,qs)=>{
  for(const q of qs)if(q.side===o.side)w.status(q,'armor',1.2);else if(q.ground||q.boss){w.hurt(q,7);w.status(q,'burn',1.2)}
 }));
 return book;
}
