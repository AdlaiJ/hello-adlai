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
 return models;
}
