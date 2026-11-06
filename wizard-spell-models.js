/* Small reusable pieces keep the spell silhouettes inexpensive to draw. Models face +X. */
export function makeSpellModels({joint,part,shape,mat}){
 const iron=0x64768b,gold=0xe9b955,wood=0x805039,bone=0xffe9bc,red=0xd94743,
 ice=0x9ee7ff,leaf=0x60b878,ink=0x342c45,white=0xfff7ec,pink=0xfc96bc;
 function piece(g,type,c,x,y,z,w,h,d,angle=0,lit=false){
  const m=part(g,shape[type],mat(c,lit),x,y,z,w,h,d);m.rotation.z=angle;return m;
 }
 const box=(g,c,x,y,w,h,d,a=0)=>piece(g,'box',c,x,y,0,w,h,d,a);
 const oval=(g,c,x,y,w,h,d)=>piece(g,'ball',c,x,y,0,w,h,d);
 const gem=(g,c,x,y,w,h)=>piece(g,'gem',c,x,y,0,w,h,w*.65,0,true);
 const rim=(g,c,x,y,w,h)=>piece(g,'ring',c,x,y,0,w,h,.8);
 const rod=(g,c,x,y,h,w=.09,a=0)=>piece(g,'pole',c,x,y,0,w,h,w,a);
 function cluster(g,n,draw){for(let i=0;i<n;i++)draw(i,2*Math.PI*i/n)}
 function coin(g,x,y){oval(g,gold,x,y,.21,.21,.06);box(g,wood,x,y,.04,.24,.14)}
 function cross(g,x,y,c=red){box(g,c,x,y,.42,.13,.18);box(g,c,x,y,.13,.42,.18)}
 function bandage(g,x,y,a=0){const b=joint(g,x,y,0);b.rotation.z=a;box(b,bone,0,0,1.1,.43,.15);box(b,white,0,0,.43,.45,.2);cross(b,0,0)}
 function wing(g,x,y,s,c){for(let i=0;i<3;i++)piece(g,'gem',c,x-s*i*.13,y+i*.12,0,.12,.43,.09,-s*.6)}
 function bird(g,c){oval(g,c,0,0,.4,.27,.28);oval(g,c,.3,.23,.23,.23,.21);piece(g,'cone',gold,.56,.23,0,.10,.26,.10,-Math.PI/2);wing(g,-.08,.21,-1,c)}
 function wall(g,x,y,w){for(let row=0;row<2;row++)for(let i=0;i<3;i++)box(g,row?iron:0x455567,x+(i-1)*w/3+(row?.05:0),y+row*.28,w/3-.02,.26,.34)}
 function crown(g,c){box(g,c,0,0,1.2,.28,.45);for(let i=-1;i<2;i++)piece(g,'cone',c,i*.43,.32,0,.18,.6,.17);gem(g,red,0,.03,.09,.12)}
 function bolt(g,x,y,s=1){box(g,0xffdf61,x,y+.17*s,.12*s,.52*s,.1*s,-.5);box(g,0xffdf61,x+.07*s,y-.17*s,.12*s,.52*s,.1*s,-.5);box(g,0xffdf61,x+.04*s,y,.31*s,.1*s,.1*s)}
 function fire(g,x,y){gem(g,red,x,y,.29,.52);gem(g,0xffbc43,x+.06,y-.04,.16,.31)}
 function bottle(g,c){oval(g,c,0,-.12,.37,.48,.35);box(g,c,0,.4,.26,.28,.26);box(g,wood,0,.59,.25,.13,.25)}
 function shield(g,c,x=0,y=0){piece(g,'gem',c,x,y,0,.49,.67,.14);piece(g,'gem',white,x,y,.12,.12,.28,.03)}
 function flower(g,c){cluster(g,7,(_,a)=>oval(g,c,.35*Math.cos(a),.35*Math.sin(a),.22,.22,.12));oval(g,gold,0,0,.20,.20,.18)}
 function skull(g,x,y){oval(g,bone,x,y,.31,.31,.24);box(g,bone,x,y-.25,.37,.21,.3);for(const s of [-1,1])piece(g,'ball',ink,x+s*.12,y,.19,.09,.1,.06)}
 function tongs(g){
  const jaws=[-1,1].map(s=>{const arm=joint(g,-.52,0,0);
   box(arm,wood,-.16,0,.43,.10,.10);box(arm,iron,.56,0,1.19,.12,.14);
   box(arm,gold,1.14,-s*.12,.17,.36,.19,-s*.24);return arm});
  oval(g,gold,-.52,0,.12,.14,.14);const arc=joint(g,.51,0,0);bolt(arc,0,0,.7);
  return u=>{jaws.forEach((j,i)=>j.rotation.z=(i?1:-1)*(.1+.68*Math.max(0,1-u*1.7)));arc.scale.y=.22+Math.max(0,1-u*1.6)};
 }
 const models={
 'thunder-tongs':tongs,
 'brimstone-triplet':g=>{for(let i=-1;i<2;i++)fire(g,i*.42,-Math.abs(i)*.18)},
 'pinball-furnace':g=>{oval(g,iron,0,0,.55,.55,.55);piece(g,'box',ink,.03,0,.48,.66,.47,.14);for(let i=-1;i<2;i++)piece(g,'box',gold,i*.19,0,.57,.08,.35,.08,0,true)},
 'widowmaker-nail':g=>{rod(g,iron,0,0,1.18,.14,-Math.PI/2);box(g,iron,-.55,0,.12,.56,.46);piece(g,'cone',white,.67,0,0,.082,.25,.082,-Math.PI/2)},
 'spiral-battery':g=>{box(g,iron,0,0,.68,1.05,.48);box(g,gold,0,.59,.26,.16,.25);cluster(g,12,(i,a)=>gem(g,gold,.52*Math.cos(a),i*.08-.46,.07,.1))},
 'blast-compass':g=>{rim(g,gold,0,0,.64,.64);cluster(g,4,(_,a)=>{const n=joint(g,0,0,0);n.rotation.z=a;gem(n,red,0,.38,.1,.33)})},
 'sunken-fuse':g=>{oval(g,ink,0,-.12,.48,.48,.45);rod(g,wood,.18,.37,.48,.08,-.6);fire(g,.32,.61)},
 'ash-carousel':g=>{rod(g,gold,0,0,1.05);piece(g,'cone',red,0,.51,0,.7,.32,.7);for(const x of [-.44,.44]){rod(g,gold,x,0,.8);oval(g,wood,x,-.26,.22,.1,.12)}},
 'kingfisher-dive':g=>{bird(g,0x239ec9);g.rotation.z=-.35},
 'sideslip':g=>{box(g,ice,0,0,.89,.2,.35);for(const x of [-.25,.26])oval(g,ink,x,-.17,.12,.12,.1);wing(g,-.3,.18,1,white)},
 'rabbit-kick':g=>{oval(g,white,0,0,.43,.35,.3);for(const x of [-.2,.15])oval(g,pink,x,.48,.12,.38,.1);oval(g,white,.35,-.31,.38,.13,.19)},
 'lighthouse-step':g=>{piece(g,'sleeve',white,0,0,0,.44,.95,.44);box(g,red,0,0,.38,.18,.39);gem(g,gold,0,.58,.22,.23);piece(g,'cone',red,0,.84,0,.37,.25,.37)},
 'rocket-braces':g=>{for(const x of [-.34,.34]){box(g,iron,x,0,.34,.67,.34);box(g,red,x+.10,-.25,.52,.22,.40);fire(g,x,-.58)}},
 'passing-bell':g=>{piece(g,'sleeve',gold,0,0,0,.65,.9,.65);oval(g,iron,0,-.42,.16,.19,.16);rim(g,wood,0,.54,.17,.2)},
 'sky-anchor':g=>{rod(g,iron,0,0,1);rim(g,ice,0,.58,.17,.17);box(g,iron,0,-.4,.95,.12,.15);for(const s of [-1,1])piece(g,'cone',ice,s*.44,-.21,0,.14,.38,.14,-s*.2)},
 'tortoise-sprint':g=>{oval(g,leaf,0,0,.54,.36,.42);oval(g,leaf,.56,.04,.24,.19,.18);for(const x of [-.35,.32])box(g,gold,x,-.25,.20,.25,.39)},
 'escape-hatch':g=>{box(g,wood,0,0,1.2,.18,.83);rim(g,iron,.27,.13,.18,.16);for(const x of [-.37,-.17])box(g,iron,x,.09,.07,.08,.87)},
 'frost-kennel':g=>{box(g,ice,0,0,.8,.60,.53);piece(g,'cone',0x5198c6,0,.4,0,.63,.41,.56);piece(g,'box',ink,0,-.05,.28,.36,.43,.05)},
 'bone-pincer':g=>{for(const s of [-1,1]){const claw=joint(g,s*.35,0,0);claw.rotation.z=-s*.5;rod(claw,bone,0,0,.8,.16);oval(claw,bone,0,-.38,.18,.12,.16);piece(claw,'cone',bone,0,.49,0,.16,.38,.16)}},
 'traveling-infirmary':g=>{box(g,white,0,0,1,.64,.44);cross(g,0,.03);for(const x of [-.32,.32])oval(g,iron,x,-.37,.17,.17,.12)},
 'fletchers-roost':g=>{wall(g,0,-.44,1);for(const x of [-.25,.05,.35]){rod(g,wood,x,.17,.80,.06,-.18);wing(g,x+.03,.52,-1,bone)}},
 'ember-courier':g=>{box(g,wood,0,0,.72,.52,.45);box(g,gold,0,0,.10,.56,.47);fire(g,.35,.36);wing(g,-.36,.18,1,red)},
 'grave-relay':g=>{skull(g,-.40,.18);skull(g,.40,-.18);box(g,0x69e8c3,0,0,.72,.06,.10,-.42)},
 'mole-survey':g=>{rod(g,wood,0,-.08,1.05,.14,-.5);box(g,iron,.10,.33,.94,.16,.18,-.22);gem(g,gold,.42,-.29,.18,.22)},
 'thunder-brood':g=>{for(const x of [-.4,0,.4])oval(g,gold,x,-.16,.2,.3,.2);bolt(g,0,.42,.75)},
 'last-battalion':g=>{for(const x of [-.43,0,.43]){skull(g,x,-.12);rod(g,iron,x+.16,-.44,.54)}crown(joint(g,0,.4,0),gold)},
 'cold-compress':g=>{box(g,ice,0,0,1,.52,.56);for(const x of [-.3,.2])gem(g,white,x,.32,.14,.18)},
 'borrowed-bandage':g=>{shield(g,gold,-.36,-.05);bandage(g,.20,.14,-.46)},
 'surgeon-finch':g=>{bird(g,white);cross(g,.07,.48)},
 'field-rations':g=>{oval(g,0xc58b43,-.18,0,.46,.26,.25);box(g,leaf,.33,-.15,.48,.40,.38);box(g,gold,.33,-.15,.08,.43,.40)},
 'mercy-dividend':g=>{for(let i=0;i<3;i++)coin(g,-.32+i*.30,i*.14-.22);cross(g,.14,.45)},
 'walking-remedy':g=>{bottle(g,leaf);for(const x of [-.18,.19])box(g,wood,x+.08,-.60,.29,.14,.20)},
 'emergency-stitch':g=>{box(g,iron,0,0,1.13,.075,.1,.55);rim(g,pink,-.52,-.35,.18,.13);for(const x of [-.10,.17,.44])box(g,red,x,-.30,.07,.28,.10,-.44)},
 'spring-equinox':g=>{flower(g,pink);rod(g,leaf,0,-.52,.56,.09);wing(g,.20,-.47,1,leaf)},
 'copper-ground':g=>{rod(g,0xd48755,0,0,1.18,.17);for(let i=0;i<3;i++)box(g,0xd48755,0,-.35-i*.13,.74-i*.19,.07,.2);bolt(g,.20,.28,.65)},
 'glass-umbrella':g=>{piece(g,'cone',ice,0,.28,0,.72,.42,.72);rod(g,iron,0,-.16,.72,.07);rim(g,gold,.08,-.50,.1,.13)},
 'twin-bulwark':g=>{wall(g,-.49,-.25,.75);wall(g,.49,-.25,.75)},
 'bodyguard-pact':g=>{shield(g,iron,-.36,0);shield(g,gold,.36,0);rim(g,white,0,0,.25,.12)},
 'mirror-march':g=>{oval(g,ice,0,.20,.44,.56,.08);rim(g,gold,0,.20,.46,.58);for(const x of [-.22,.22])box(g,ink,x,-.43,.27,.22,.24)},
 'brittle-treaty':g=>{for(const s of [-1,1]){const h=joint(g,s*.26,0,0);h.rotation.z=-s*.28;piece(h,'gem',ice,0,0,0,.24,.57,.10)}},
 'panic-room':g=>{wall(g,0,-.43,1.10);for(const x of [-.45,.45])box(g,iron,x,.03,.2,.68,.75);box(g,iron,0,.40,1.18,.18,.91)},
 'glacier-oath':g=>{shield(g,ice);for(const x of [-.37,.02,.33])piece(g,'cone',white,x,.38,0,.13,.55,.15)},
 'tongue-tangle':g=>{rim(g,pink,-.18,0,.33,.22);rim(g,pink,.22,.06,.29,.22);oval(g,red,.47,-.13,.27,.12,.12)},
 'debt-collector':g=>{coin(g,-.29,-.22);coin(g,.12,-.24);piece(g,'gem',pink,.18,.23,0,.13,.57,.09,-.66);rod(g,iron,-.08,-.07,.4,.05,-.66)},
 'winter-verdict':g=>{rod(g,wood,0,-.14,.86,.11,-.65);box(g,ice,-.20,.21,.74,.38,.38,-.65);box(g,iron,.25,-.48,.63,.13,.4)},
 'wicked-wick':g=>{rod(g,0xb56f91,0,-.14,.75,.53);fire(g,0,.48)},
 'heavy-crown':g=>{crown(g,iron);for(const x of [-.4,.4]){rod(g,iron,x,-.31,.54,.08);oval(g,ink,x,-.58,.18,.18,.18)}},
 'echo-tax':g=>{coin(g,0,0);for(let i=1;i<4;i++)rim(g,pink,0,0,i*.19+.13,i*.19+.13)},
 'unholy-exchange':g=>{shield(g,red,-.42,.14);shield(g,ice,.42,-.14);box(g,gold,0,.44,.76,.05,.08);piece(g,'cone',gold,.4,.44,0,.09,.22,.09,-Math.PI/2)},
 'court-of-thorns':g=>{crown(g,0x6c4054);for(let i=-3;i<=3;i++)piece(g,'cone',pink,i*.19,-.20,0,.07,.40,.07,i*.26+Math.PI)}
 };

 models['cone-of-cold']=g=>{cluster(g,5,(_,a)=>{const shard=joint(g,0,0,0);shard.rotation.z=a;gem(shard,ice,.3,0,.11,.8)});return u=>g.rotation.x=u*3};
 models['cone-of-fire']=g=>{for(let i=0;i<4;i++)fire(g,i*.22-.3,Math.sin(i)*.16);return u=>g.scale.y=1+u*.5};
 models['incendiary-volley']=g=>{oval(g,red,0,0,.55,.4,.4);for(let i=0;i<4;i++)fire(g,-i*.22,0)};
 models['comet']=g=>{oval(g,ice,0,0,.7,.65,.65);for(let i=1;i<6;i++)gem(g,i%2?0x757dff:white,-i*.3,0,.3-i*.035,.7-i*.07)};
 models['void-orb']=g=>{oval(g,ink,0,0,.7,.7,.7);rim(g,0xa787ff,0,0,.8,.8)};
 models['comet-crater']=g=>{const ring=rim(g,ice,0,0,1,1);ring.rotation.x=Math.PI/2;cluster(g,10,(_,a)=>gem(g,ice,.8*Math.cos(a),.12,.08,.3));};
 models['tentacle-field']=g=>{
  const tips=[];
  cluster(g,9,(i,a)=>{
   const tentacle=joint(g,Math.cos(a)*.7,.02,Math.sin(a)*.7);tips.push(tentacle);
   for(let j=0;j<5;j++)piece(tentacle,'ball',0x7843a6,Math.sin(j*.6)*.1,j*.12,0,.10-j*.014,.17-j*.015,.10-j*.014);
  });
  return u=>tips.forEach((tip,i)=>{tip.rotation.z=Math.sin(u*9+i)*.3;tip.rotation.x=Math.cos(u*8+i)*.2});
 };
 models['demon-arm']=g=>{
  const portal=joint(g,0,.68,-.71),flesh=0x98374b,light=0xca5961,armor=0x4c253d;
  piece(portal,'ball',0x27142f,0,0,0,.54,.60,.06);
  piece(portal,'ring',0xd95afe,0,0,.02,.55,.61,.1,0,true);
  const swivel=joint(g,0,.68,-.65),upper=joint(swivel,0,0,0),upperLen=.88,foreLen=1.05;
  piece(upper,'ball',armor,0,0,.05,.38,.36,.34);
  piece(upper,'ball',flesh,0,.035,.43,.25,.25,.48);
  piece(upper,'ball',light,0,.14,.44,.20,.18,.34);
  const fore=joint(upper,0,0,upperLen);piece(fore,'ball',armor,0,0,0,.23,.23,.24);
  piece(fore,'cone',bone,0,.21,-.05,.09,.39,.1,-.22);
  piece(fore,'ball',flesh,0,0,.48,.21,.18,.55);
  for(const side of [-1,1])piece(fore,'gem',light,side*.12,.08,.47,.07,.08,.43);
  piece(fore,'box',armor,0,0,.94,.33,.26,.18);
  const palm=joint(fore,0,0,foreLen);piece(palm,'ball',flesh,0,0,.16,.29,.12,.27);
  const fingers=[];
  for(let i=0;i<4;i++){
   const base=joint(palm,(i-1.5)*.135,.008,.32),length=[.26,.31,.28,.21][i];
   base.rotation.y=(i-1.5)*.14;piece(base,'ball',light,0,0,0,.077,.08,.085);
   piece(base,'ball',flesh,0,0,length/2,.064,.063,length*.61);
   const tip=joint(base,0,0,length);piece(tip,'ball',light,0,0,.078,.053,.055,.105);
   piece(tip,'cone',bone,0,-.042,.182,.046,.19,.047,0,2.25);fingers.push([base,tip]);
  }
  const thumb=joint(palm,-.22,-.015,.09);thumb.rotation.y=-1.04;
  piece(thumb,'ball',light,0,0,.13,.085,.08,.19);const thumbTip=joint(thumb,0,0,.27);
  piece(thumbTip,'cone',bone,0,-.03,.075,.065,.23,.065,0,1.95);
  return (age,zone={})=>{
   const emergence=Math.max(.04,Math.min(1,age/.55));swivel.scale.setScalar(emergence);
   let sx=0,sy=age<1.2?.35+.85*Math.sin(Math.PI*Math.min(1,age/1.2)):.43+.06*Math.sin(age*2),sz=.68;
   const grip=zone.grip,curl=grip?.curl||0;
   if(grip){const dx=(grip.x-zone.x)/zone.r,dz=(grip.z-zone.z)/zone.r,yaw=zone.yaw||0;
    sx=(dx*Math.sin(yaw)-dz*Math.cos(yaw))*grip.reach;
    sz+=(dx*Math.cos(yaw)+dz*Math.sin(yaw)-sz)*grip.reach;sy+=((zone.y-grip.y)/zone.r-sy)*grip.reach;
   }
   // Bend the elbow above the forearm while keeping the palm at the grasp point.
   const forward=Math.hypot(sx,sz+.65),rise=sy-.68,reach=Math.max(.02,forward-.29),d=Math.max(.22,Math.min(upperLen+foreLen-.01,Math.hypot(reach,rise)));
   const line=Math.atan2(rise,reach),angle=(v)=>Math.acos(Math.max(-1,Math.min(1,v)));
   const shoulder=line+angle((upperLen**2+d*d-foreLen**2)/(2*upperLen*d));
   const elbow=line-angle((foreLen**2+d*d-upperLen**2)/(2*foreLen*d));
   swivel.rotation.y=Math.atan2(sx,sz+.65);upper.rotation.x=-shoulder;fore.rotation.x=shoulder-elbow;palm.rotation.x=elbow+.13;
   fingers.forEach(([base,tip],i)=>{base.rotation.x=.08+.10*Math.sin(age*2+i)+curl*1.05;tip.rotation.x=.35+curl*.98});
   thumb.rotation.x=.18+curl*.72;thumbTip.rotation.y=.48+curl*.5;portal.rotation.z=age*.48;
  };
 };
 models['purple-wurm']=g=>{
  const segments=[];
  for(let i=0;i<7;i++){const seg=joint(g,-i*.42,Math.sin(i*.5)*.15,0);segments.push(seg);oval(seg,0x8751bb,0,0,.48-i*.035,.5-i*.04,.5-i*.04)}
  const jaw=rim(g,bone,.42,0,.45,.45);jaw.rotation.y=Math.PI/2;
  cluster(g,9,(_,a)=>piece(g,'cone',bone,.55,Math.sin(a)*.3,Math.cos(a)*.3,.07,.22,.07,-Math.PI/2));
  return u=>segments.forEach((seg,i)=>seg.position.z=Math.sin(u*7-i*.7)*.17);
 };
 models['void-entity']=g=>{
  const eye=joint(g,0,.5,0),tentacles=[];
  oval(eye,0x342044,0,0,.72,.79,.79);
  oval(eye,0xd9cfed,.25,0,.55,.63,.63);
  piece(eye,'ball',0xab65ff,.72,0,0,.09,.43,.43,0,true);
  piece(eye,'ball',0x100b22,.81,0,0,.04,.32,.13);
  piece(eye,'ball',white,.85,.19,-.12,.03,.09,.09,0,true);
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,base=joint(g,-.15,.5,0),segments=[];
   base.rotation.x=angle;
   let parent=joint(base,0,.58,0);
   for(let j=0;j<6;j++){
    const segment=joint(parent,0,j? .27:0,0),width=.15-j*.02;
    piece(segment,'ball',j%2?0x68408c:0x4c2b70,0,.14,0,width,.23,width);
    piece(segment,'ball',0xc992ef,width,.13,0,.035,.06,.06,0,true);
    segments.push(segment);parent=segment;
   }
   tentacles.push(segments);
  }
  return u=>{
   g.position.y=Math.sin(u*2)*.15;
   eye.rotation.y=Math.sin(u*.7)*.08;
   tentacles.forEach((segments,i)=>segments.forEach((segment,j)=>{
    segment.rotation.z=.2+Math.sin(u*2.2-i*.8+j*.65)*.3;
    segment.rotation.x=Math.cos(u*1.7+i+j*.4)*.16;
   }));
  };
 };
 models['void-eye-beam']=g=>{
  box(g,0xb47aff,0,0,4,.14,.14);
  box(g,white,0,0,3.8,.055,.055);
  return u=>{g.scale.y=1+Math.sin(u*20)*.2};
 };
 models['void-tentacle-lash']=g=>{
  const lashes=[];
  for(let i=0;i<6;i++){
   const arm=joint(g,0,0,0);arm.rotation.y=i*Math.PI/3;lashes.push(arm);
   for(let j=0;j<5;j++)piece(arm,'ball',0x8751b0,j*.16,Math.sin(j*.6)*.1,0,.13-j*.02,.09,.09);
  }
  return u=>lashes.forEach((arm,i)=>arm.rotation.y=i*Math.PI/3+u*2.2);
 };
 models['void-gravity-burst']=g=>{
  const rings=[];
  for(let i=0;i<3;i++){
   const ring=rim(g,0xa985ff,0,0,.35+i*.28,.35+i*.28);
   ring.rotation.x=Math.PI/2+i*.3;rings.push(ring);
  }
  oval(g,0x20102f,0,.1,.18,.18,.18);
  return u=>rings.forEach((ring,i)=>{ring.rotation.z=u*(i+1);ring.scale.setScalar(.7+.25*Math.sin(u*5+i))});
 };
 models['undead-army']=g=>{
  for(let i=-1;i<=1;i++){
   skull(g,i*.55,.25-Math.abs(i)*.15);
   rod(g,0xb6e4b0,i*.55,-.4,.55,.06);
  }
  return u=>{g.position.y=u*.4;g.rotation.y=u*.6};
 };
 function swirlingCone(g,cold){
  const layers=[];
  for(let i=0;i<7;i++){
   const depth=(i+1)/8,layer=joint(g,depth,0,0);
   const radius=depth*.5;
   // Overlapping opaque clouds make a solid-looking, widening spell volume.
   piece(layer,'ball',cold?0xc6e5f2:0xa8442f,0,0,0,.13,radius*.85,radius*.85);
   for(let j=0;j<5;j++){
    const angle=j*Math.PI*2/5+i*.7;
    const tint=cold?(j%2?0xeafaff:0x8fc8e8):(j%3===0?0x663c43:j%2?0xffa631:0xf25b22);
    piece(layer,'ball',tint,0,Math.sin(angle)*radius*.62,Math.cos(angle)*radius*.62,
     .16,radius*.62,radius*.62,0,!cold&&j%3!==0);
   }
   layers.push(layer);
  }
  return u=>layers.forEach((layer,i)=>{
   layer.rotation.x=u*12*(i%2?1:-1)+i*.4;
   layer.position.x=(i+1)/8+Math.sin(u*18-i)*.025;
   const pulse=1+Math.sin(u*22-i*.7)*.08;
   layer.scale.set(1,pulse,pulse);
  });
 }
 models['water-cone-stream']=g=>{
  const drops=[];
  for(let i=0;i<32;i++){
   const angle=i*2.39996,edge=Math.sqrt((i%7+1)/7);
   const drop=piece(g,'ball',i%4===0?0xedfcff:0x52c9f5,0,0,0,.085,.018,.018,0,i%4===0);
   drops.push({drop,angle,edge,offset:i/32});
  }
  return u=>{for(const {drop,angle,edge,offset} of drops){
   const depth=(offset+u*2.8)%1,radius=depth*.52*edge;
   drop.position.set(depth,Math.sin(angle)*radius,Math.cos(angle)*radius);
   drop.rotation.z=Math.sin(angle)*.4;drop.rotation.y=-Math.cos(angle)*.4;
   const size=.6+depth*.8;drop.scale.set(size,size,size);
  }};
 };
 models['cold-cone-stream']=g=>swirlingCone(g,true);
 models['fire-cone-stream']=g=>swirlingCone(g,false);
 models['tornado']=g=>{
  const bands=[],debris=[];
  for(let i=0;i<9;i++){
   const y=i*.17,width=.13+i*.075,band=joint(g,0,y,0);
   for(let j=0;j<5;j++){
    const a=j*Math.PI*2/5;
    piece(band,'ball',i%2?0x9baebb:0xc8dce3,Math.cos(a)*width,0,Math.sin(a)*width,width*.62,.12,width*.62);
   }
   bands.push(band);
  }
  for(let i=0;i<10;i++){
   const chunk=piece(g,'box',i%2?0x857464:0x777e89,0,0,0,.06,.05,.08);
   debris.push(chunk);
  }
  return t=>{
   bands.forEach((band,i)=>{
    band.rotation.y=t*(5+i*.25);
    band.position.x=Math.sin(t*2-i*.3)*i*.012;
   });
   debris.forEach((chunk,i)=>{
    const h=(t*.45+i/10)%1,r=.18+h*.65,a=t*6+i*2.4;
    chunk.position.set(Math.cos(a)*r,h*1.6,Math.sin(a)*r);
    chunk.rotation.set(t*3+i,t*4,t*2);
   });
  };
 };
 models.frack=g=>{gem(g,0xb59a80,0,0,.5,.8);gem(g,0x796e65,-.4,.1,.25,.4)};
 models['fire-jet']=g=>{fire(g,0,0);fire(g,-.3,0)};
 models['acid-splash']=g=>{
  for(let i=0;i<5;i++){
   const angle=i*Math.PI*2/5;
   piece(g,'gem',0xc5f477,Math.cos(angle)*.4,.2,Math.sin(angle)*.4,.09,.35,.09,0,true);
  }
  return t=>{g.scale.y=1-t*.7};
 };
 models['acid-rain']=g=>{
  const drops=[];
  for(let i=0;i<9;i++){
   const angle=i*2.4,radius=i? .55:0;
   piece(g,'ball',i%2?0x526c44:0x718154,Math.cos(angle)*radius,1.45,Math.sin(angle)*radius,.5,.24,.5);
  }
  for(let i=0;i<40;i++){
   const drop=piece(g,'pole',i%2?0xbce666:0x88c842,0,0,0,.016,.12,.016,0,true);
   drops.push(drop);
  }
  return t=>drops.forEach((drop,i)=>{
   const angle=i*2.4,radius=.92*Math.sqrt((i+.5)/40);
   drop.position.set(Math.cos(angle)*radius,1.4-((t*1.8+i*.173)%1)*1.4,Math.sin(angle)*radius);
  });
 };

 const older={
 'blood-arsenal':g=>cluster(g,6,(_,a)=>{const blade=joint(g,Math.cos(a)*.6,Math.sin(a)*.6,0);blade.rotation.z=a;gem(blade,red,0,0,.12,.65)}),
 'shrine-of-cleavers':g=>{wall(g,0,-.3,1.2);box(g,red,0,.4,1.6,.2,.5);for(const x of [-.5,.5])rod(g,bone,x,0,.8,.13)},
 'crater-bell':g=>{piece(g,'sleeve',gold,0,0,0,.65,.9,.65);rim(g,gold,0,-.4,.7,.25)},
 'fault-stitch':g=>{for(let i=-2;i<=2;i++){gem(g,0x8a654c,i*.3,i%2*.15,.22,.5);box(g,gold,i*.3,.2,.04,.6,.04)}},
 'sundial-mine':g=>{rim(g,gold,0,0,.8,.8);piece(g,'cone',gold,0,.1,0,.12,.65,.12,.6);cluster(g,12,(_,a)=>gem(g,gold,.65*Math.cos(a),.65*Math.sin(a),.03,.1))},
 'star-shears':tongs,
 'foxstep':g=>{for(const x of [-.25,.25]){oval(g,0xe88e4d,x,0,.25,.3,.2);gem(g,white,x,.3,.12,.2)}},
 'hare-moon':g=>{oval(g,white,0,0,.4,.3,.25);for(const x of [-.18,.18])oval(g,white,x,.5,.1,.4,.1);rim(g,ice,0,0,.8,.8)},
 'fold-step':g=>{for(const x of [-.4,.4]){box(g,gold,x,0,.1,1.3,.15);box(g,gold,x,.6,.5,.1,.15)}},
 'bottle-rocket':g=>{bottle(g,red);fire(g,0,-.6)},
 'comet-train':g=>{for(let i=0;i<4;i++){gem(g,gold,i*.35-.5,0,.22-i*.03,.4);fire(g,i*.35-.6,-.25)}},
 'switchback':g=>{for(const s of [-1,1]){box(g,ice,0,s*.2,.9,.1,.15);piece(g,'cone',ice,s*.5,s*.2,0,.13,.3,.13,-s*Math.PI/2)}},
 'return-ticket':g=>{box(g,white,0,0,1.2,.55,.1);rim(g,pink,0,0,.25,.25);box(g,gold,.4,0,.05,.55,.12)},
 'pilgrim-step':g=>{rod(g,wood,0,0,1.4,.08);box(g,wood,.25,-.55,.55,.2,.3);gem(g,gold,0,.6,.18,.3)},
 'pocket-poultice':g=>{bandage(g,0,0);flower(g,leaf)},
 'green-thread':g=>{for(let i=0;i<9;i++)oval(g,leaf,i*.16-.6,Math.sin(i)*.15,.10,.08,.08)},
 'lantern-well':g=>{box(g,iron,0,0,.7,.85,.6);gem(g,gold,0,0,.3,.55);rim(g,iron,0,.65,.2,.2)},
 'last-stitch':g=>{rod(g,white,0,0,1.3,.04,.7);for(let i=0;i<6;i++)oval(g,pink,i*.16-.4,Math.sin(i)*.2,.09,.08,.05)},
 'glass-graft':g=>{gem(g,ice,-.2,0,.3,.7);gem(g,pink,.2,0,.3,.7);cross(g,0,0,white)},
 'overbloom':g=>{flower(g,pink);cluster(g,5,(_,a)=>gem(g,leaf,Math.cos(a)*.65,Math.sin(a)*.65,.15,.3))},
 'hedge-hospice':g=>{wall(g,0,-.3,1.3);for(let i=-2;i<=2;i++)oval(g,leaf,i*.28,.2,.22,.4,.2);cross(g,0,.4,white)},
 'thimble-ward':g=>{piece(g,'sleeve',iron,0,0,0,.65,.8,.65);for(let i=-2;i<=2;i++)oval(g,gold,i*.2,0,.05,.05,.03)},
 'iron-choir':g=>{for(let i=-2;i<=2;i++){rod(g,iron,i*.25,0,1-Math.abs(i)*.15,.12);rim(g,gold,i*.25,.45-Math.abs(i)*.08,.1,.1)}},
 'looking-glass':g=>{oval(g,ice,0,0,.46,.65,.05);rim(g,gold,0,0,.5,.7);rod(g,gold,0,-.75,.4,.12)},
 'smoke-skin':g=>{for(let i=0;i<5;i++)piece(g,'gem',0x9390ad,Math.sin(i)*.3,i*.17-.4,0,.6,.25,.3,i*.3)},
 'rampart':g=>wall(g,0,-.3,1.5),
 'winter-ring':g=>cluster(g,8,(_,a)=>gem(g,ice,.7*Math.cos(a),.7*Math.sin(a),.12,.35)),
 'tithe-dome':g=>{crown(g,gold);for(let i=-2;i<=2;i++)coin(g,i*.3,-.5)},
 'aegis-break':g=>{shield(g,pink,-.3,0);shield(g,ice,.3,.1);box(g,white,0,0,.08,1.4,.15,.6)},
 'catherine-wheel':g=>{rim(g,iron,0,0,.7,.7);cluster(g,7,(_,a)=>fire(g,.6*Math.cos(a),.6*Math.sin(a)));return t=>g.rotation.z=t*6},
 'pressure-valve':g=>{rim(g,red,0,0,.6,.6);box(g,iron,0,0,1.2,.1,.2);box(g,iron,0,0,.1,1.2,.2);rod(g,iron,0,-.6,.5,.2)},
 'rising-stair':g=>{for(let i=0;i<5;i++)box(g,0xa4a1b6,i*.25-.5,i*.2-.4,.3,.2,.8)},
 'thermal-font':g=>{for(let i=-2;i<=2;i++)gem(g,ice,i*.2,Math.cos(i)*.2,.1,.9)},
 'moonwalk':g=>{rim(g,ice,0,0,.7,.7);oval(g,0x28344a,.25,.1,.5,.65,.12);box(g,gold,-.4,-.4,.6,.17,.25)},
 'sky-toll':g=>{piece(g,'sleeve',iron,0,0,0,.6,.7,.6);coin(g,0,-.6)},
 'dew-wash':g=>{for(let i=-2;i<=2;i++)gem(g,ice,i*.25,-Math.abs(i)*.1,.16,.35);cross(g,0,.4,leaf)},
 'second-draft':g=>{box(g,white,0,0,.8,1.1,.08);piece(g,'gem',pink,.25,.15,0,.15,.9,.1,-.6)},
 'root-tea':g=>{piece(g,'sleeve',wood,0,0,0,.5,.5,.5);rim(g,wood,.5,0,.2,.22);flower(g,leaf)},
 'crimson-ledger':g=>{box(g,red,0,0,.9,1.2,.2);box(g,gold,-.3,0,.08,1.2,.25);coin(g,.1,0)},
 'heartwood':g=>{rod(g,wood,0,0,1,.4);for(const x of [-.3,.3])oval(g,leaf,x,.4,.3,.45,.2)},
 'pilgrim-salve':g=>{bottle(g,leaf);cross(g,0,0,white)},
 'sky-shutter':g=>{for(let i=-2;i<=2;i++)box(g,iron,0,i*.22,1.3,.18,.3)},
 'tripwire':g=>{for(const x of [-.6,.6])rod(g,iron,x,0,.7,.08);box(g,pink,0,0,1.2,.025,.025)},
 'glass-receipt':g=>{box(g,ice,0,0,.7,1.1,.08);for(let i=0;i<4;i++)box(g,gold,0,i*.2-.3,.45,.03,.1)},
 'snail-citadel':g=>{wall(g,0,-.4,1.3);rim(g,leaf,0,.2,.5,.5);rim(g,gold,0,.2,.25,.25)},
 'mirror-post':g=>{rod(g,wood,0,-.4,.8,.15);shield(g,ice,0,.2)},
 'safety-net':g=>{for(let i=-2;i<=2;i++){box(g,leaf,i*.25,0,.035,1.2,.05);box(g,leaf,0,i*.25,1.2,.035,.05)}},
 'bone-wall':g=>{for(let i=-3;i<=3;i++)rod(g,bone,i*.2,0,i%2?.8:1.2,.09)},
 'bone-spikes':g=>{for(let i=-2;i<=2;i++)piece(g,'cone',bone,i*.3,0,0,.12,.8+Math.cos(i)*.4,.12)},
 'phoenix-vigil':g=>{bird(g,red);fire(g,-.5,-.2);rim(g,gold,0,0,.9,.9)},
 'thunder-road':g=>{for(let i=-2;i<=2;i++){box(g,iron,i*.3,-.2,.25,.12,.5);bolt(g,i*.3,.2,.4)}},
 'last-citadel':g=>{wall(g,0,-.2,1.5);crown(g,ice)},
 'wild-hunt':g=>{bird(g,ice);bird(joint(g,-.6,-.2,0),gold);bird(joint(g,.6,-.2,0),red)},
 'second-sun':g=>{flower(g,gold);cluster(g,12,(_,a)=>gem(g,gold,.8*Math.cos(a),.8*Math.sin(a),.06,.24))},
 'gravity-well':g=>{for(let i=0;i<4;i++){const r=rim(g,0x9865da,0,0,.25+i*.2,.25+i*.2);r.rotation.x=i*.4}return t=>g.rotation.y=t*2},
 'worldbreaker':g=>{for(let i=-2;i<=2;i++)gem(g,i%2?gold:0x796457,i*.3,-Math.abs(i)*.2,.25,.9)},
 'glass-knife':g=>{gem(g,ice,0,.3,.16,.5);rod(g,wood,0,-.4,.4,.13)},
 'wisp-rapier':g=>{rod(g,ice,0,.2,1.3,.04);rim(g,gold,0,-.5,.22,.1)},
 'rime-axe':g=>{rod(g,wood,0,0,1.3,.09);gem(g,ice,.2,.3,.4,.35)},
 'ember-maul':g=>{rod(g,wood,0,-.2,1,.12);box(g,iron,0,.4,.9,.4,.4);fire(g,0,.5)},
 'harvest-scythe':g=>{rod(g,wood,0,0,1.5,.08);piece(g,'gem',white,.4,.6,0,.65,.12,.1,.3)},
 'spark-film':g=>{shield(g,ice);bolt(g,0,0,.6)},
 'capacitor-shell':g=>{shield(g,gold);for(const x of [-.3,.3])rod(g,iron,x,0,.8,.09)},
 'prism-parry':g=>{gem(g,ice,0,0,.55,.8);for(let i=-1;i<=1;i++)box(g,[red,gold,leaf][i+1],i*.2,-.5,.06,.6,.06,i*.3)},
 'polar-aegis':g=>{shield(g,ice);cluster(g,6,(_,a)=>gem(g,white,.6*Math.cos(a),.6*Math.sin(a),.1,.22))},
 'vault-kick':g=>{box(g,wood,0,0,.7,.25,.3);gem(g,gold,0,.6,.15,.35)},
 'cross-step':g=>{box(g,ice,0,0,1.1,.15,.15);box(g,pink,0,0,.15,1.1,.15)},
 'field-dressing':g=>{bandage(g,0,-.2);bandage(g,0,.2)},
 'lead-bell':g=>{piece(g,'sleeve',iron,0,0,0,.7,.8,.7);rod(g,iron,0,.6,.5,.14)},
 'fault-cross':g=>{box(g,red,0,0,1.5,.1,.1);box(g,red,0,0,.1,1.5,.1);gem(g,gold,0,0,.3,.5)},
 'familiar-feast':g=>{oval(g,red,0,0,.5,.3,.3);rod(g,bone,0,0,1.2,.12,Math.PI/2)},
 'ward-tax':g=>{rod(g,gold,0,0,1.1,.06);box(g,gold,0,.4,1.2,.06,.08);for(const x of [-.5,.5])coin(g,x,0)},
 'comet-retreat':g=>{gem(g,gold,.3,0,.3,.6);for(let i=0;i<4;i++)box(g,red,-i*.2,0,.1,.15,.12)},
 'winter-court':g=>{crown(g,ice);bird(joint(g,-.5,.3,0),white);bird(joint(g,.5,.3,0),white)},
 'siege-clock':g=>{rim(g,gold,0,0,.7,.7);box(g,iron,.2,0,.4,.05,.1);box(g,iron,0,.25,.05,.5,.1)},
 'dawn-coronation':g=>{crown(g,gold);cluster(g,5,(_,a)=>gem(g,pink,Math.cos(a)*.7,Math.sin(a)*.7,.08,.25))}
 };
 models['roman-candle']=g=>{
  rod(g,0xb84443,0,0,1.2,.25);
  for(let i=-2;i<=2;i++){gem(g,i%2?gold:pink,i*.2,.7+Math.cos(i)*.2,.08,.25)}
  return t=>g.rotation.z=Math.sin(t*5)*.1;
 };
 Object.assign(models,older);
 for(const [id,kind] of Object.entries({'summon-purple-wurm':'purple-wurm','summon-void-entity':'void-entity'}))models[id]=models[kind];
 for(const [id,tint] of Object.entries({'grave-squire':bone,'crypt-bow':0xc99bff,'soul-wraith':ice})){
  models[id]=g=>{skull(g,0,.2);if(id==='crypt-bow'){rim(g,wood,.4,-.2,.25,.6)}else if(id==='grave-squire'){rod(g,iron,.5,0,1.2,.07)}else{piece(g,'cone',0x456178,0,-.4,0,.5,.8,.3)}};
 }
 for(const [id,tint] of Object.entries({'ember-newt':red,'rime-owl':ice,'storm-finch':gold})){
  models[id]=g=>{bird(g,tint);if(id==='ember-newt')fire(g,-.4,-.1);if(id==='storm-finch')bolt(g,0,.3,.4)};
 }
 models['balm-beetle']=g=>{oval(g,leaf,0,0,.5,.3,.3);cross(g,0,0,white)};
 models['bastion-crab']=g=>{shield(g,0xb99bea);for(const x of [-.5,.5])rim(g,gold,x,0,.2,.25)};
 models['quarry-mole']=g=>{oval(g,wood,0,0,.5,.3,.3);piece(g,'cone',iron,.5,0,0,.2,.5,.2,-Math.PI/2)};
 models['imp-furnace']=g=>{
  box(g,0x322d35,0,0,1.25,1.3,.95);box(g,iron,0,-.65,1.5,.18,1.12);
  piece(g,'box',0xff5c16,0,-.1,.49,.83,.64,.04,0,true);
  for(let i=-2;i<=2;i++)piece(g,'box',iron,i*.18,-.1,.53,.06,.7,.06);
  box(g,iron,.35,1,.34,.8,.35);box(g,0x26212c,.35,1.43,.49,.12,.48);
  const flame=joint(g,.35,1.6,0);fire(flame,0,0);
  for(const x of [-.45,.45])box(g,iron,x,-.85,.2,.35,.3);
  return t=>{flame.scale.setScalar(.8+Math.sin(t*11)*.16)};
 };
 models['fire-imp']=g=>{
  oval(g,red,0,0,.68,.65,.48);oval(g,0xff9d32,0,.5,.68,.55,.51);
  for(const s of [-1,1]){
   piece(g,'cone',0xffdf81,s*.29,.87,0,.16,.43,.15,-s*.4);
   piece(g,'ball',white,s*.17,.56,.24,.16,.17,.09,0,true);
   piece(g,'box',ink,s*.17,.56,.3,.07,.1,.03);
   box(g,red,s*.48,.02,.2,.55,.2,-s*.5);
  }
  const legs=[joint(g,-.23,-.4,0),joint(g,.23,-.4,0)];
  for(const leg of legs)box(leg,0xff782a,0,-.2,.22,.45,.3);
  const flame=joint(g,0,.95,0);fire(flame,0,0);
  return t=>{legs.forEach((leg,i)=>leg.rotation.x=Math.sin(t*16+i*Math.PI)*.8);flame.scale.y=1+Math.sin(t*15)*.2};
 };
 models.dismantle=g=>{for(let i=-1;i<=1;i++)box(g,0xffd5df,i*.15,i*.28,1.5,.045,.06,-.3)};
 models.cleave=g=>{box(g,0xffd5df,0,0,1.6,.065,.07,.65);box(g,0xff8298,0,0,1.6,.065,.07,-.65)};
 models['furnace-arrow']=g=>{
  box(g,0x492824,0,0,2,.15,.15);
  piece(g,'gem',0xffd678,.96,0,0,.76,.26,.23,0,true);
  for(const side of [-1,1]){
   piece(g,'gem',0xff7630,.55,.18*side,0,.48,.10,.16,side*.38,true);
   piece(g,'gem',0xf49332,-.75,.2*side,0,.45,.13,.15,-side*.42,true);
  }
  for(let i=0;i<4;i++)piece(g,'box',0xffdb88,-.42+i*.26,0,0,.06,.22,.23,0,true);
  const plume=joint(g,-.95,0,0);piece(plume,'cone',0xff7327,-.78,0,0,.21,1.6,.21,Math.PI/2,true);
  piece(plume,'cone',0xffe6a4,-.46,0,0,.15,1.05,.15,Math.PI/2,true);
  const sparks=Array.from({length:6},()=>piece(g,'gem',0xffbe5a,0,0,0,.09,.045,.045,0,true));
  return t=>{plume.scale.x=1+.16*Math.sin(t*30);sparks.forEach((spark,i)=>{const u=(t*2+i/6)%1;spark.position.set(-1-2*u,Math.sin(i*2.4+u*4)*u*.38,Math.cos(i*2.4+u*4)*u*.38);spark.visible=u<.95})};
 };
 models['furnace-scorch']=g=>{
  for(let i=0;i<10;i++){const ray=joint(g,0,.015,0);ray.rotation.y=i*Math.PI/5;piece(ray,'box',0xff893d,.57,0,0,.65,.018,.035,0,true);piece(ray,'gem',0x78372d,.79,.09,0,.16,.17,.13)}
  const flames=[];for(let i=0;i<7;i++){const a=i*2.4;flames.push(piece(g,'cone',i%2?0xffbb48:0xff6535,.5*Math.cos(a),.12,.5*Math.sin(a),.06,.27,.08,0,true))}
  return t=>flames.forEach((f,i)=>{f.scale.y=.22+.12*Math.sin(t*8+i);f.position.y=f.scale.y/2});
 };
 models['electric-road']=g=>{
  const arcs=[];
  for(let strand=0;strand<3;strand++){
   const arc=joint(g,0,0,0);arcs.push(arc);let x=-.5,y=0;
   for(let i=1;i<=16;i++){const nx=i/16-.5,ny=i===16?0:Math.sin(i*2.5+strand)*(.09+.06*strand);
    piece(arc,'box',strand?0x68baff:0xecffff,(x+nx)/2,(y+ny)/2,0,Math.hypot(nx-x,ny-y),.023,.04,Math.atan2(ny-y,nx-x),true);x=nx;y=ny;
   }
  }
  return t=>arcs.forEach((arc,i)=>{arc.rotation.x=i*2+.65*Math.sin(t*13+i);arc.scale.y=.75+.24*Math.sin(t*19+i)});
 };
 models['spiderweb-cut']=g=>{
  for(let i=0;i<8;i++){const web=joint(g,0,.02,0);web.rotation.y=i*Math.PI/4;box(web,0xffa7b6,0,0,1.9,.015,.025)}
  for(let i=1;i<=3;i++){const r=rim(g,0xffd5df,0,.02,i*.31,i*.31);r.rotation.x=Math.PI/2}
 };
 models['world-sever']=g=>{box(g,0xffe6ec,0,0,.075,2.6,.08);box(g,0xff759d,.08,0,.045,2.3,.12);for(let i=-2;i<=2;i++)box(g,0xffd5df,i*.05,i*.45,.45,.025,.025,-.5)};
 models['infinity-veil']=g=>{
  const rings=[];for(let i=0;i<4;i++){const r=rim(g,0xaeeaff,0,0,1,1);r.rotation.y=i*Math.PI/4;rings.push(r)}
  return t=>rings.forEach((r,i)=>{r.rotation.y=t*.35+i*Math.PI/4;r.rotation.x=Math.sin(t+i)*.4});
 };
 models['lapse-blue']=g=>{
  gem(g,0x3a9fff,0,.12,.2,.24);const arms=[];
  for(let i=0;i<8;i++){const arm=joint(g,0,.12,0);arm.rotation.y=i*Math.PI/4;for(let j=1;j<5;j++)piece(arm,'gem',0x75d5ff,j*.19,0,.05*j*j,.12,.04,.12);arms.push(arm)}
  return t=>arms.forEach((arm,i)=>{arm.rotation.y=i*Math.PI/4+t;arm.scale.setScalar(.8+.15*Math.sin(t*4+i))});
 };
 models['reversal-red']=g=>{for(let i=0;i<6;i++){const arm=joint(g,0,0,0);arm.rotation.z=i*Math.PI/3;piece(arm,'cone',0xff5871,.65,0,0,.16,.65,.16,-Math.PI/2,true)}gem(g,0xffe5df,0,0,.45,.6)};
 models['hollow-purple']=g=>{
  gem(g,0xd6b0ff,0,0,.7,1.05);const a=joint(g,0,0,0),b=joint(g,0,0,0);
  gem(a,0x529bff,0,.6,.35,.45);gem(b,0xff5273,0,-.6,.35,.45);
  for(let i=0;i<5;i++)box(g,0xc499ff,-i*.25,0,.09,1.1-i*.13,.07,i*.2);
  return t=>{a.rotation.x=t*5;b.rotation.x=t*5};
 };
 models['unlimited-void']=g=>{
  const stars=joint(g,0,0,0);
  for(let i=0;i<42;i++){const theta=i*2.4,y=(i/41-.5)*1.7,r=Math.sqrt(Math.max(0,1-y*y));piece(stars,'gem',i%3?0xd7eaff:0x8c85ff,Math.cos(theta)*r,y,Math.sin(theta)*r,.025,.06,.025,0,true)}
  for(let i=0;i<3;i++){const ring=rim(g,0x849fff,0,0,1,1);ring.rotation.y=i*Math.PI/3}
  return t=>{stars.rotation.y=t*.16};
 };
 models['crimson-king']=g=>{
  oval(g,0x6f102d,0,.5,.9,1.25,.6);box(g,0x251c2b,0,-.15,1,.3,.7);
  oval(g,0xa82a42,0,1.4,.55,.6,.46);
  const legs=[];
  for(const s of [-1,1]){
   piece(g,'cone',bone,s*.55,1.95,0,.18,.95,.18,-s*.4);
   piece(g,'box',0xffe36c,s*.19,1.47,.46,.18,.085,.07,0,true);
   const leg=joint(g,s*.3,-.28,0);legs.push(leg);
   box(leg,0x481025,0,-.42,.32,.85,.36);
   box(leg,0x1d1724,0,-.82,.42,.22,.6);
  }
  piece(g,'box',0x1b111b,0,1.18,.46,.25,.1,.04);
  for(let i=-2;i<=2;i++)piece(g,'cone',bone,i*.075,1.12,.46,.045,.18,.045,Math.PI);
  crown(joint(g,0,2,0),gold);
  const arms=[];
  for(const s of [-1,1])for(const h of [.8,.2]){
   const arm=joint(g,s*.5,h,0);box(arm,0x9f203d,s*.3,-.15,.65,.28,.3,-s*.4);
   const fore=joint(arm,s*.62,-.32,0);box(fore,0x6f102d,0,-.25,.26,.6,.27);oval(fore,0xba3048,0,-.6,.34,.32,.32);
   for(let i=-1;i<=1;i++)piece(fore,'cone',bone,i*.1,-.86,.1,.06,.3,.06,Math.PI);
   arms.push(arm);
  }
  return (t,actor={})=>{const seated=actor.entranceSeat||0,walking=actor.entranceWalk||Math.min(1,(actor.walkSpeed||0)/70)||(actor.attackKind===3&&actor.attackProgress>.58?1:0);
   const kneel=actor.cinematicKneel||0,struggle=actor.cinematicStruggle||0;
   const attack=actor.attackProgress||0,swing=Math.sin(attack*Math.PI);
   g.position.y=28-14*seated-13*kneel;g.rotation.x=-.12*seated+.38*kneel+struggle*.16;
   legs.forEach((leg,i)=>leg.rotation.x=-1.2*seated+Math.sin(t*6+i*Math.PI)*.55*walking);
   arms.forEach((arm,i)=>{
    arm.rotation.z=Math.sin(t*2+i*.9)*.35*(1-seated)+struggle*(i%2?-.5:.5);
    arm.rotation.x=-.55*seated+Math.sin(t*1.5+i)*.45*(1-seated)-kneel*.65;
    if(attack){
     if(actor.attackKind===0)arm.rotation.x=-2.1*Math.sin(Math.min(1,attack/.65)*Math.PI);
     else if(actor.attackKind===1)arm.rotation.x=-1.5+Math.sin(attack*24-i*Math.PI)*.3;
     else if(actor.attackKind===2){arm.rotation.z+=(i<2?1:-1)*swing;arm.rotation.x=-swing*1.4}
     else if(actor.attackKind===3){arm.rotation.x=-1.2;arm.rotation.z+=(i<2?1:-1)*swing*.8;g.rotation.x=.24*swing}
     else arm.rotation.x=-1.8*swing;
    }
   });
  };
 };
 models['king-warning']=g=>{for(let i=0;i<3;i++){const r=rim(g,0xff3758,0,.02,1-i*.14,1-i*.14);r.rotation.x=Math.PI/2}};
 models['king-slam']=g=>{for(let i=0;i<12;i++){const a=i*Math.PI/6;piece(g,'cone',0xff5874,Math.cos(a)*.8,.2,Math.sin(a)*.8,.13,.7,.13,0,true)}};
 models['king-volley']=g=>{for(let i=0;i<4;i++)fire(g,(i-1.5)*.3,0)};
 models['king-shockwave']=g=>{
  for(const scale of [.94,1]){const ring=rim(g,0xff8b65,0,.02,scale,scale);ring.rotation.x=Math.PI/2}
 };
 models['king-charge-lane']=g=>{
  for(const side of [-1,1])piece(g,'box',0xff765a,140,1,side*40,280,2,2,0,true);
  for(let i=1;i<=7;i++)piece(g,'gem',0xffb55e,i*36,2,0,12,2,12,0,true);
 };
 models['king-pyre']=g=>{
  const flames=[];
  for(let i=0;i<7;i++){const a=i*2.4;flames.push(piece(g,'cone',i%2?0xffc85d:0xf13e51,.5*Math.cos(a),.8,.5*Math.sin(a),.2,1.6,.2,0,true))}
  return t=>flames.forEach((flame,i)=>flame.scale.y=1+Math.sin(t*15+i)*.3);
 };
 models['campaign-rift']=g=>{
  piece(g,'ball',0x170c2f,0,0,0,.82,1.1,.05);
  const rings=[];for(let i=0;i<4;i++){const r=rim(g,i%2?0xbc7aff:0x7436db,0,0,.85+i*.07,1.1+i*.07);rings.push(r)}
  return t=>rings.forEach((r,i)=>{r.rotation.z=t*(i%2?1:-1)*.3;r.scale.x=1+Math.sin(t*2+i)*.04});
 };
 models['void-warning']=g=>{const r=rim(g,0xbc79ff,0,.02,1,1);r.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;gem(g,0xb79aff,Math.cos(a)*.8,.03,.06,.12)}};
 models['stone-coffin']=g=>{
  box(g,0x89878a,-.55,0,.2,1.8,.85);box(g,0x89878a,.55,0,.2,1.8,.85);
  box(g,0xb5b0a5,0,.9,1.3,.18,.9);box(g,0xb5b0a5,0,-.9,1.3,.18,.9);
  for(let i=-2;i<=2;i++)box(g,0xc7bea8,0,i*.3,1.1,.035,.04);
 };
 models['demiplane-of-sanctuary']=g=>{
  const ground=piece(g,'ball',0x356a52,0,-.025,0,1,.035,1);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*.82,z=Math.sin(a)*.82;
   const tree=joint(g,x,0,z);rod(tree,0x80624f,0,.2,.45,.04);oval(tree,0x68bb86,0,.48,.17,.25,.17);
   const flowerRoot=joint(g,x*.6,.03,z*.6);flowerRoot.scale.setScalar(.1);flower(flowerRoot,i%2?pink:gold);
  }
  const arch=joint(g,0,.04,0);rim(arch,0xd1e0b0,0,.35,.22,.35);
 };
 models['demiplane-of-stars']=g=>{
  const orbit=joint(g,0,.4,0);
  for(let i=0;i<18;i++){const a=i*2.4;piece(orbit,'gem',i%2?0xc9c2ff:0x7ed9ff,Math.cos(a)*(.5+i/40),Math.sin(a*2)*.3,Math.sin(a)*(.5+i/40),.035,.09,.035,0,true)}
  for(let i=0;i<3;i++){const ring=rim(g,0x787fc1,0,.02,.95-i*.2,.95-i*.2);ring.rotation.x=Math.PI/2}
  return t=>{orbit.rotation.y=t*.3};
 };
 models['demiplane-of-cinders']=g=>{
  piece(g,'ball',0x3a2533,0,-.02,0,1,.035,1);
  for(let i=0;i<9;i++){const a=i*2.4,x=Math.cos(a)*.7,z=Math.sin(a)*.7;
   const fissure=joint(g,x,.025,z);fissure.rotation.y=a;box(fissure,0xff9d42,0,0,.6,.015,.025);
   piece(g,'cone',0x594253,x,.1,z,.11,.25,.11);
   const flame=joint(g,x,.18,z);flame.scale.setScalar(.18);fire(flame,0,0);
  }
 };
 models['gaster-timer']=()=>{};
 models['gaster-blaster']=g=>{
  oval(g,bone,0,.2,.8,.65,.6);oval(g,bone,.48,.05,.62,.4,.48);
  for(const side of [-1,1]){
   piece(g,'ball',0x101c30,.48,.28,side*.44,.27,.29,.13);
   piece(g,'ball',0x8bedff,.59,.29,side*.49,.1,.13,.06,0,true);
   piece(g,'cone',bone,-.4,.8,side*.4,.14,.65,.14,side*.3);
  }
  const jaw=joint(g,-.12,-.23,0);piece(jaw,'box',bone,.48,-.1,0,1,.15,.85);
  for(let i=-2;i<=2;i++)piece(jaw,'cone',bone,.92,.05,i*.16,.06,.25,.06);
  const glow=piece(g,'ball',0xb6faff,.9,-.03,0,.18,.24,.3,0,true);
  return t=>{jaw.rotation.z=-.5*Math.min(1,t*3);glow.scale.setScalar(.18+Math.min(.4,t*.8))};
 };
 models['gaster-beam']=g=>{
  const core=piece(g,'pole',0xeaffff,240,0,0,11,480,11,-Math.PI/2,true);
  for(let i=0;i<12;i++){const ring=piece(g,'hoop',0x77dfff,20+i*40,0,0,18,18,18,0,true);ring.rotation.z=Math.PI/2}
  return t=>{core.scale.x=core.scale.z=11+2*Math.sin(t*50)};
 };
 models['tentacle-timer']=()=>{};
 models['tentacle-warning']=g=>{const r=piece(g,'hoop',0xbea2ea,0,.02,0,1,.03,1,0,true);return t=>{r.scale.x=r.scale.z=1-.08*Math.sin(t*20)}};
 models['smoky-tentacle']=g=>{
  const links=[],smoke=[];
  for(let i=0;i<26;i++)links.push(piece(g,'ball',i%2?0x352d48:0x4e3d62,0,0,0,.29,.29,.29));
  for(let i=0;i<8;i++)smoke.push(piece(g,'ball',i%2?0x746180:0x574861,0,0,0,.14,.14,.14));
  return t=>{
   const slam=Math.min(1,Math.max(0,(t-.23)/.35)),fall=slam*slam;
   links.forEach((link,i)=>{const u=i/25,r=.32*(1-u)+.065;
    link.position.set(-1.45+u*1.65,Math.sin(u*Math.PI*.72)*(3.1*(1-fall)+.22)+.08,Math.sin(u*5+t*5)*.13*(1-fall));link.scale.setScalar(r);
   });
   smoke.forEach((p,i)=>{const u=i/7;p.position.set(-1.3+u*1.8+Math.sin(t*8+i)*.2,.25+Math.sin(u*Math.PI)*(2.7*(1-fall))+(t>.6?(t-.6)*1.5:0),Math.cos(t*7+i)*.3);p.scale.setScalar(.15+.13*Math.sin(t*3+i)**2)});
  };
 };
 models.timestop=g=>{
  const dial=joint(g,0,.4,0);piece(dial,'hoop',0x9bdfff,0,0,0,1,1,1,0,true);
  const hand=piece(dial,'box',0xffffff,0,.35,0,.04,.7,.04,0,true);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;piece(dial,'gem',0xb0e8ff,Math.sin(a)*.85,Math.cos(a)*.85,0,.05,.09,.04,0,true)}
  return t=>{hand.rotation.z=-Math.min(t*15,1)*Math.PI*.7};
 };
 models['asteroid-strike']=g=>{
  const rock=joint(g,0,0,0);piece(rock,'gem',0x63413d,0,0,0,.7,.8,.65);
  for(let i=0;i<8;i++){const a=i*2.4;piece(rock,'gem',0xffad57,Math.cos(a)*.5,Math.sin(a)*.5,.2,.17,.35,.19,a,true)}
  const tail=piece(rock,'cone',0xff7b3d,0,1.4,0,.5,2,.5,0,true);
  return t=>{rock.position.y=4*(1-t*t);rock.rotation.z=t*2;tail.scale.x=.4+.1*Math.sin(t*35)};
 };
 models['dungeon-master']=g=>{for(let i=0;i<5;i++)box(g,0xb7b194,(i-2)*.35,.12,.12,.4,1.4);piece(g,'hoop',0xd2dbb0,0,.02,0,1,.04,1,0,true)};
 models.cataclysm=g=>{
  const spikes=[];for(let i=0;i<12;i++){const a=i*Math.PI/6;spikes.push(piece(g,'cone',i%2?0xff9960:0x7a3343,Math.cos(a)*.8,0,Math.sin(a)*.8,.12,1,.12,0,i%2===1))}
  return t=>spikes.forEach((spike,i)=>{spike.scale.y=.1+Math.max(0,Math.sin(t*12-i*.5))*.9;spike.position.y=spike.scale.y/2});
 };
 models['dungeon-brazier']=g=>{
  box(g,0x333046,0,.12,.9,.24,.9);rod(g,0x72617e,0,.55,.9,.18);piece(g,'ball',gold,0,1,0,.4,.19,.4);
  const flame=piece(g,'gem',0xb777ff,0,1.4,0,.25,.55,.25,0,true);const spark=piece(g,'gem',0x87eaff,0,1.65,0,.09,.25,.09,0,true);
  return t=>{flame.rotation.y=t*2;flame.scale.y=.46+.1*Math.sin(t*5);spark.position.y=1.75+.1*Math.sin(t*4)};
 };
 models['dungeon-reliquary']=g=>{
  box(g,0x39334a,0,.15,1,.3,1);rod(g,0xb08a61,0,.65,.8,.3);
  const relic=joint(g,0,1.5,0);piece(relic,'gem',0x76e2f3,0,0,0,.36,.58,.36,0,true);
  const halo=piece(relic,'hoop',0xd1a46b,0,0,0,.6,.6,.6);halo.rotation.x=.7;
  return t=>{relic.rotation.y=t;relic.position.y=1.5+.12*Math.sin(t*2)};
 };
 models['dungeon-standard']=g=>{rod(g,0xb69b70,0,1.35,2.7,.075);piece(g,'box',0x5e315d,.33,1.92,0,.62,1.12,.065);piece(g,'gem',0xeeb666,.33,1.92,.055,.14,.23,.03,0,true);box(g,0x343144,0,.1,.52,.2,.52)};
 models['asteroid-core']=g=>{
  const shard=piece(g,'gem',0x91eaff,0,.3,0,.58,1.15,.58,0,true);
  const debris=joint(g,0,.45,0);for(let i=0;i<6;i++){const a=i*Math.PI/3;piece(debris,'gem',0x58495f,1.2*Math.cos(a),.15*Math.sin(a),1.2*Math.sin(a),.19,.25,.16,a)}
  return t=>{debris.rotation.y=t*2;shard.rotation.y=-t;shard.position.y=.35+.12*Math.sin(t*3)};
 };
 models['fault-tear']=g=>{
  for(let i=0;i<5;i++)piece(g,'box',i%2?0xff813b:0xffdc82,(i-2)*.27,0,.08*Math.sin(i*2),.34,.045,.12,0,true).rotation.y=.35*Math.cos(i*2);
 };
 models['bone-regrowth']=()=>{};
 function vaultWeapon(g,style){
  const spear=style==='vault-spear',axe=style==='vault-axe';
  box(g,0x744326,-.48,0,spear?2.4:1.1,.11,.12);
  piece(g,'gem',0x70dce8,-1,0,0,.15,.13,.13,0,true);
  if(axe){for(const side of [-1,1])piece(g,'gem',gold,.25,side*.28,0,.39,.36,.13,side*.42);box(g,gold,.34,0,.28,.23,.22)}
  else{piece(g,'gem',white,spear?.92:.61,0,0,spear?.5:.87,spear?.22:.16,.09,0,true);box(g,gold,-.15,0,.13,spear?.33:.77,.22);piece(g,'gem',gold,.25,0,0,.52,.11,.1)}
 }
 for(const style of ['vault-sword','vault-spear','vault-axe']){
  models[style]=g=>vaultWeapon(g,style);
  models[style+'-gate']=g=>{
   const seal=joint(g,0,0,0);seal.rotation.y=Math.PI/2;
   piece(seal,'ball',0x4b2a52,0,0,0,.82,.82,.07);
   piece(seal,'ring',0xffcb4e,0,0,.08,.87,.87,.8,0,true);
   const runes=joint(seal,0,0,.12);
   for(let i=0;i<8;i++){const angle=i*Math.PI/4;piece(runes,'gem',0xffeaaa,Math.cos(angle)*.98,Math.sin(angle)*.98,0,.11,.06,.05,angle,true)}
   const blade=joint(g,0,0,0);blade.scale.setScalar(.78);vaultWeapon(blade,style);
   return t=>{runes.rotation.z=t*1.8;blade.position.x=.15+Math.min(1,t*3)*.6};
  };
 }
 models['dungeon-clockblade']=g=>{
  for(const side of [-1,1]){box(g,iron,side*1.22,.82,.12,1.65,.25);box(g,gold,side*1.22,.08,.38,.14,.48)}
  box(g,iron,0,1.67,2.58,.15,.24);
  const pendulum=joint(g,0,1.65,0);rod(pendulum,gold,0,-.6,1.2,.065);
  piece(pendulum,'gem',iron,0,-1.27,0,.46,.31,.11);box(pendulum,0xefe1b5,0,-1.34,.76,.07,.17);
  return angle=>{pendulum.rotation.z=angle};
 };
 models['dungeon-chain-seal']=g=>{
  piece(g,'pole',iron,0,.03,0,1.35,.06,1.35);
  const seal=piece(g,'ring',0x87e7d8,0,.075,0,.67,.67,.67,0,true);seal.rotation.x=Math.PI/2;
  for(let i=0;i<4;i++){const arm=joint(g,0,.1,0);arm.rotation.y=i*Math.PI/2;for(let j=0;j<3;j++){const link=piece(arm,'ring',gold,.22+j*.16,0,0,.13,.085,.1);link.rotation.x=j%2?.5:1.5}}
 };
 models['dungeon-bind']=g=>{for(let i=0;i<3;i++){const ring=piece(g,'ring',0x70eece,0,.22+i*.28,0,.56,.56,.56,0,true);ring.rotation.x=1.35+i*.18}};
 models['dungeon-fire-grate']=g=>{
  box(g,iron,0,.025,1.55,.08,1.55);const coals=piece(g,'box',0xff8b30,0,.065,0,1.32,.04,1.32,0,true);
  for(let i=-2;i<=2;i++)box(g,0x3f3540,i*.27,.11,.13,.10,1.48);
  return armed=>{coals.visible=armed>.5};
 };
 models['dungeon-firejet']=g=>{const jets=[];for(let i=0;i<7;i++){const a=i*2.4;jets.push(piece(g,'cone',i%2?0xffce60:0xff722b,.52*Math.cos(a),.75,.52*Math.sin(a),.22,1.5,.22,0,true))}return t=>jets.forEach((jet,i)=>{jet.scale.y=1+Math.sin(t*9+i)*.5;jet.position.y=jet.scale.y/2})};

 models['ultimate-wizbee']=g=>{
  const disc=joint(g,0,0,0);
  piece(disc,'ball',0xd6ff59,0,0,0,1,.14,1);
  const rim=piece(disc,'ring',0x30d6c7,0,.04,0,.92,.92,.08,0,true);rim.rotation.x=Math.PI/2;
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;piece(disc,'gem',0xffffff,.48*Math.cos(a),.1,.48*Math.sin(a),.18,.07,.18,0,true)}
  return t=>{disc.rotation.y=t*12};
 };
 models['wizzone-ball']=g=>{
  piece(g,'ball',0xc4f12c,0,0,0,.5,.5,.5);
  for(const side of [-1,1]){
   const seam=piece(g,'ring',0xfff9dc,side*.15,0,0,.42,.42,.018);
   seam.rotation.y=side*.7;
  }
 };
 models.wizzone=g=>{
  piece(g,'box',0x226c68,0,.008,0,1.35,.014,1.35);
  for(const x of [-.66,0,.66])piece(g,'box',0xf1ffd9,x,.021,0,.012,.009,1.32);
  for(const z of [-.66,0,.66])piece(g,'box',0xf1ffd9,0,.021,z,1.32,.009,.012);
  const boundary=piece(g,'ring',0xc4f12c,0,.025,0,1,1,.018,0,true);boundary.rotation.x=Math.PI/2;
  for(const x of [-.7,.7])piece(g,'pole',0xf1ffd9,x,.12,0,.014,.24,.014);
  for(let i=1;i<6;i++)piece(g,'box',0xd5ffc1,0,i*.035,0,1.4,.004,.004);
  for(let i=-9;i<=9;i++)piece(g,'box',0xd5ffc1,i*.07,.105,0,.003,.21,.003);
 };
 return models;
}
