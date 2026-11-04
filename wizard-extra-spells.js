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
 add('Spiral Battery','꩜',95,1.3,'Fire twelve sparks in a spiral over your next three seconds.',(a,p,t)=>{let n=0;timer(a,p,3,.25,w=>shot(w,p,t,'spiral-battery',{yawOffset:n++*Math.PI/6}), '#ffcf72','spiral-battery')});
 add('Blast Compass','✥',67,.9,'Four piercing shots leave your position. A second volley fills the diagonal gaps a moment later.',(a,p,t)=>{
  const volley=(turn)=>{for(let i=0;i<4;i++)shot(a,p,t,'blast-compass',{yawOffset:turn+i*Math.PI/2,pierce:1})};volley(0);timer(a,p,.5,.5,()=>volley(Math.PI/4),'#ffce90','blast-compass');
 });
 add('Thunder Tongs','⋈',58,.8,'Drag enemies within 65 units inward, then strike the center with a blast.',(a,p)=>{for(const q of near(a,p,65))a.blink(q,(p.x-q.x)*.6,0,(p.z-q.z)*.6);pulse(a,p,30,23)});
 add('Sunken Fuse','⌁',86,1.2,'Plant a fuse at your feet. After two seconds it blasts the ground and launches nearby enemies upward.',(a,p)=>timer(a,p,2,2,(w,o,x,y,z)=>{w.area(o,x,y,50,32,'#ff743d',z);for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<55)q.vy=-340},'#ff783d','sunken-fuse'));
 add('Ash Carousel','✹',210,2.1,'Six explosions circle your original position, then the center erupts.',(a,p)=>{let i=0;timer(a,p,3.5,.5,(w,o,x,y,z)=>{const end=i===6,angle=i++*Math.PI/3;w.area(o,x+(end?0:50*Math.cos(angle)),y,end?48:24,end?36:14,'#ff8844',z+(end?0:50*Math.sin(angle)))},'#ff8855','ash-carousel')});
 add('Kingfisher Dive','⤓',36,.55,'Send a heavy diving shard down your sightline. Its splash slows enemies it hits directly.',(a,p,t)=>shot(a,p,t,'kingfisher-dive',{gravity:250,blast:28,damage:14,onHit:(w,o,q)=>{if(q)w.status(q,'slow',3)}}));
 school('Movement','gate','#ffe58a');
 add('Sideslip','⇥',12,.1,'Slip to your right and shed any slowing effect.',(a,p)=>{step(a,p,44,Math.PI/2);p.statuses.slow=0});
 add('Rabbit Kick','♘',20,.2,'Leap backward and knock nearby enemies forward into the air.',(a,p)=>{for(const q of near(a,p,38))q.vy=-250;step(a,p,-32,0,6);p.vy=-280});
 add('Lighthouse Step','☼',55,.6,'Travel to your nearest living familiar and give it 15 shield.',(a,p)=>{const f=a.allies(p).sort((x,y)=>Math.hypot(x.x-p.x,x.z-p.z)-Math.hypot(y.x-p.x,y.z-p.z))[0];if(f){a.blink(p,f.x-p.x,f.y-p.y,f.z-p.z);guard(f,15)}});
 add('Rocket Braces','⇈',35,.4,'Leap straight up. A second thrust fires three quarters of a second later.',(a,p)=>{p.vy=-300;timer(a,p,.75,.75,()=>{p.vy=-320},'#ffcf55','rocket-braces')});
 add('Passing Bell','♧',65,.75,'Ring both ends of a forward blink for 16 damage each.',(a,p)=>{pulse(a,p,25,16);step(a,p,72);pulse(a,p,25,16)});
 add('Sky Anchor','⚓',52,.4,'Pin a point above you. After one second, pull yourself up to it and gain jump power.',(a,p)=>timer(a,p,1,1,(w,o,x,y,z)=>{w.blink(o,x-o.x,y-45-o.y,z-o.z);w.status(o,'leap',4)},'#e8c672','sky-anchor'));
 add('Tortoise Sprint','➜',40,.4,'Run with haste for three seconds, then gain armor for three seconds.',(a,p)=>{a.status(p,'haste',3);timer(a,p,3,3,()=>a.status(p,'armor',3),'#bfdd88','tortoise-sprint')});
 add('Escape Hatch','⇲',78,.8,'Bore a hole underfoot, dive into it, and gain a brief phase shield.',(a,p)=>{a.cutTerrain(p.x,p.y+10,20,100,p.z);a.blink(p,0,24,0);a.status(p,'phased',1.2)});
 school('Summoning','flock','#a7f096');
 add('Frost Kennel','♜',68,.9,'Call an owl with freezing court magic and protect it with 18 shield.',(a,p)=>{const f=a.summon(p,'frost');a.status(f,'court',9);guard(f,18)});
 add('Bone Pincer','⚔',84,1.2,'Two skeleton swordsmen rise on opposite sides of you.',(a,p)=>{for(const side of [-1,1]){const f=a.summon(p,'squire');step(a,f,38,side*Math.PI/2)}});
 add('Traveling Infirmary','✚',90,1.4,'Summon a medic and a shield crab as a traveling support pair.',(a,p)=>{a.summon(p,'medic');a.summon(p,'bastion')});
 add('Fletchers Roost','➶',56,.85,'Raise a short wall and summon a skeletal archer above it.',(a,p)=>{a.build(p,p.x+36*Math.cos(p.yaw),p.y-12,28,24,p.z+36*Math.sin(p.yaw));const f=a.summon(p,'archer');step(a,f,14,0,32)});
 add('Ember Courier','✉',72,1,'Send out a newt. Three seconds later a fire parcel explodes at its position if it survives.',(a,p)=>{const f=a.summon(p,'ember');timer(a,p,3,3,w=>{if(w.allies(p).includes(f))w.area(p,f.x,f.y-10,42,30,'#ff703b',f.z)},'#ff874c','ember-courier')});
 add('Grave Relay','☽',105,1.4,'Summon a wraith. If it survives four seconds, blink to it and heal 15.',(a,p)=>{const f=a.summon(p,'wraith');timer(a,p,4,4,w=>{if(w.allies(p).includes(f)){w.blink(p,f.x-p.x,f.y-p.y,f.z-p.z);w.heal(p,15)}},'#a9efcc','grave-relay')});
 add('Mole Survey','⚒',48,.7,'Summon a burrower and drill three pockets of cover ahead of it.',(a,p)=>{const f=a.summon(p,'burrow');for(let i=1;i<=3;i++)a.cutTerrain(f.x+18*i*Math.cos(p.yaw),f.y,13,60,f.z+18*i*Math.sin(p.yaw))});
 add('Thunder Brood','ϟ',180,2,'Hatch a storm finch immediately, then another each second until three have hatched.',(a,p)=>{a.summon(p,'storm');timer(a,p,2,1,()=>a.summon(p,'storm'),'#ffe278','thunder-brood')});
 add('Last Battalion','♛',410,3.7,'Call a squire, archer and medic. Each receives shield equal to your missing health, up to 50.',(a,p)=>{for(const kind of ['squire','archer','medic'])guard(a.summon(p,kind),Math.min(50,p.maxHp-p.hp))});
 school('Restoration','bloom','#8cffe0');
 add('Cold Compress','❄',11,.18,'Extinguish yourself. Heal 16 if burning, otherwise heal 6.',(a,p)=>{a.heal(p,p.statuses.burn>0?16:6);p.statuses.burn=0});
 add('Borrowed Bandage','✜',22,.35,'Convert up to 16 shield into twice as much health.',(a,p)=>{const n=Math.min(16,p.shield);p.shield-=n;a.heal(p,2*n)});
 add('Surgeon Finch','✧',34,.5,'Heal yourself for 12 and fully heal your most injured familiar.',(a,p)=>{a.heal(p,12);const f=a.allies(p).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];if(f)a.heal(f,f.maxHp)});
 add('Field Rations','♨',45,.7,'Heal 8 immediately and gain five seconds of regeneration if you have a living familiar.',(a,p)=>{a.heal(p,8);if(a.allies(p).length)a.status(p,'regen',5)});
 add('Mercy Dividend','♡',60,.8,'Heal 20. Any excess healing becomes shield for each of your familiars.',(a,p)=>{const extra=Math.max(0,20-p.maxHp+p.hp);a.heal(p,20);for(const f of a.allies(p))guard(f,extra)});
 add('Walking Remedy','♩',43,.55,'For four seconds, heal 6 each second you are moving quickly.',(a,p)=>timer(a,p,4,1,()=>{if(Math.hypot(p.vx,p.vz)>60)a.heal(p,6)},'#9fffc5','walking-remedy'));
 add('Emergency Stitch','⚕',75,.6,'Below half health, heal 35. Above it, bank protection against the next lethal hit for two seconds.',(a,p)=>{if(p.hp<p.maxHp/2)a.heal(p,35);else a.status(p,'crowned',2)});
 add('Spring Equinox','❀',310,3,'Heal half your missing health and heal every familiar by the same amount. Then clear roots and burns from all of you.',(a,p)=>{const n=(p.maxHp-p.hp)/2;for(const q of [p,...a.allies(p)]){a.heal(q,n);q.statuses.root=0;q.statuses.burn=0}});
 school('Warding','shell','#c5a6ff');
 add('Copper Ground','⏚',18,.3,'Gain 12 shield and turn shield damage into mana for two seconds.',(a,p)=>{guard(p,12);a.status(p,'capacitor',2)});
 add('Glass Umbrella','☂',25,.35,'Build a roof over your head and prime a one-second projectile parry.',(a,p)=>{a.build(p,p.x,p.y-48,56,8,p.z);a.status(p,'prism',1)});
 add('Twin Bulwark','Ⅱ',54,.8,'Raise parallel walls to your left and right, leaving the front and back open.',(a,p)=>{const forward=p.yaw;try{p.yaw+=Math.PI/2;for(const s of [-1,1])a.build(p,p.x+s*30*Math.cos(p.yaw),p.y-20,70,40,p.z+s*30*Math.sin(p.yaw))}finally{p.yaw=forward}});
 add('Bodyguard Pact','♙',44,.5,'Share 40 shield evenly between you and your living familiars.',(a,p)=>{const team=[p,...a.allies(p)];for(const q of team)guard(q,40/team.length)});
 add('Mirror March','♢',72,.9,'Reflect projectiles for two seconds while hasted, then briefly root yourself.',(a,p)=>{a.status(p,'reflect',2);a.status(p,'haste',2);timer(a,p,2,2,()=>a.status(p,'root',.6),'#c8aaff','mirror-march')});
 add('Brittle Treaty','◇',65,.7,'Raise 26 shield. If all your shield is gone after two seconds, burst for 29 damage.',(a,p)=>{guard(p,26);timer(a,p,2,2,()=>{if(!p.shield)pulse(a,p,48,29)},'#bcacff','brittle-treaty')});
 add('Panic Room','⌂',135,1.6,'Raise four walls around you and regenerate for three seconds.',(a,p)=>{const yaw=p.yaw;try{for(let i=0;i<4;i++){p.yaw=yaw+i*Math.PI/2;a.build(p,p.x+32*Math.cos(p.yaw),p.y-18,72,36,p.z+32*Math.sin(p.yaw))}}finally{p.yaw=yaw}a.status(p,'regen',3)});
 add('Glacier Oath','❅',240,2.5,'Cover your team in 35 shield. For six seconds attackers near anyone with this shield are slowed on impact.',(a,p)=>{for(const q of [p,...a.allies(p)]){guard(q,35);a.status(q,'polar',6)}});
 school('Hexes','vortex','#ff9bc4');
 add('Tongue Tangle','♭',19,.3,'A feather silences its target for two seconds, or four if they are casting.',(a,p,t)=>shot(a,p,t,'tongue-tangle',{damage:3,onHit:(w,o,q)=>{if(q)w.status(q,'silence',q.cast>0?4:2)}}));
 add('Debt Collector','¤',39,.55,'A quill strips up to 18 shield from its target and gives that shield to you.',(a,p,t)=>shot(a,p,t,'debt-collector',{damage:4,onHit:(w,o,q)=>{if(q){const n=Math.min(18,q.shield);q.shield-=n;guard(o,n)}}}));
 add('Winter Verdict','♮',37,.6,'Chill nearby enemies for three seconds. Those already slowed are rooted instead.',(a,p)=>{for(const q of near(a,p,70))a.status(q,q.statuses.slow>0?'root':'slow',3)});
 add('Wicked Wick','♆',48,.65,'Ignite nearby enemies. Already burning targets take 18 immediate damage instead.',(a,p)=>{for(const q of near(a,p,62)){if(q.statuses.burn>0)a.hurt(q,18);else a.status(q,'burn',3)}});
 add('Heavy Crown','♚',64,.85,'Strip haste and leap from nearby enemies and pull airborne targets downward.',(a,p)=>{for(const q of near(a,p,100)){q.statuses.haste=0;q.statuses.leap=0;if(!q.ground)q.vy=330}});
 add('Echo Tax','♬',78,1,'Mark nearby enemies. After two seconds, each surviving marked enemy takes damage equal to its distance traveled, up to 32.',(a,p)=>{const marks=near(a,p,90).map(q=>[q,q.x,q.z]);timer(a,p,2,2,()=>{for(const [q,x,z] of marks)if(q.hp>0)a.hurt(q,Math.min(32,Math.hypot(q.x-x,q.z-z)))},'#fc91bf','echo-tax')});
 add('Unholy Exchange','⇄',98,1.1,'Trade your current shield amount with the closest enemy within 90 units.',(a,p)=>{const dist=q=>Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z);const q=near(a,p,90).sort((x,y)=>dist(x)-dist(y))[0];if(q)[p.shield,q.shield]=[q.shield,p.shield]});
 add('Court of Thorns','♰',365,3.2,'For six seconds, enemies within 100 units of the original court take 5 damage per second, or 14 if rooted.',(a,p)=>timer(a,p,6,1,(w,o,x,y,z)=>{for(const q of w.enemies(o))if(Math.hypot(q.x-x,q.y-12-y,q.z-z)<=100)w.hurt(q,q.statuses.root>0?14:5)},'#ff779e','court-of-thorns'));
 return book;
}
