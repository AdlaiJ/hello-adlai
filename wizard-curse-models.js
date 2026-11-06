export function installCurseModels(models,{joint,part,shape,mat}){
 const put=(g,k,c,x,y,z,sx,sy=sx,sz=sx)=>part(g,shape[k],mat(c),x,y,z,sx,sy,sz);
 const green=0x80a756,wood=0x79583c,petal=0xe6b4d4,skin=0xbba5c7,water=0x62c8e8,lava=0xff832b;
 function flower(g,x,y,z,r=.2){const stem=put(g,'pole',green,x,y/2,z,r*.12,Math.max(.03,y),r*.12);for(let i=0;i<6;i++){const a=i*Math.PI/3;put(g,'ball',petal,x+Math.cos(a)*r*.6,y,z+Math.sin(a)*r*.6,r*.55,r*.2,r*.55)}put(g,'ball',0xeee5a0,x,y+.02,z,r*.35,r*.2,r*.35);return stem}
 function roots(g,n=7){const items=[];for(let i=0;i<n;i++){const a=i*2.4,r=.3+(i%3)*.18;const root=put(g,'cone',wood,Math.cos(a)*r,.3,Math.sin(a)*r,.13,.8,.13);root.rotation.z=Math.cos(a)*.45;root.rotation.x=Math.sin(a)*.45;items.push(root)}return t=>items.forEach((m,i)=>m.scale.y=.8+Math.sin(t*5+i)*.17)}
 function hand(g,x=0,y=0,z=0,r=1){const h=joint(g,x,y,z);h.scale.setScalar(r);put(h,'box',skin,0,0,0,.42,.5,.16);for(let i=0;i<4;i++){const f=put(h,'pole',skin,(i-1.5)*.12,.43,0,.09,.48,.09);f.rotation.z=(i-1.5)*-.12}const thumb=put(h,'pole',skin,-.29,.02,0,.11,.3,.11);thumb.rotation.z=-.8;return h}
 function fish(g,c=water){put(g,'ball',c,0,0,0,.7,.32,.24);put(g,'cone',0xafdce5,-.65,0,0,.28,.5,.08).rotation.z=-Math.PI/2;put(g,'cone',c,0,.35,0,.18,.38,.06);for(const z of [-.18,.18]){put(g,'ball',0xffed9e,.4,.07,z,.08);put(g,'ball',0x161c35,.44,.07,z*1.13,.035)}for(let i=0;i<4;i++)put(g,'cone',0xffffde,.51,-.06+i*.035,0,.04,.1,.1).rotation.z=-Math.PI/2;return t=>g.rotation.z=Math.sin(t*5)*.1}
 function volcano(g){put(g,'cone',0x514341,0,.2,0,.8,.5,.8);put(g,'ring',lava,0,.43,0,.3,.3,.1).rotation.x=Math.PI/2;const jet=put(g,'cone',lava,0,.8,0,.22,.9,.22);return t=>jet.scale.y=.7+Math.sin(t*7)*.25}
 function fieldFlowers(g){for(let i=0;i<24;i++){const a=i*2.4,r=Math.sqrt(i/24)*.9;flower(g,Math.cos(a)*r,.1+(i%3)*.03,Math.sin(a)*r,.09)}return t=>g.rotation.y=Math.sin(t*.6)*.02}
 models['curse-root-timer']=()=>()=>{};
 models['curse-roots']=g=>roots(g);
 models['curse-wood-spheres']=g=>{put(g,'ball',wood,0,0,0,.55);for(let i=0;i<9;i++){const a=i*2.4;const spike=put(g,'cone',green,Math.cos(a)*.6,Math.sin(a)*.6,0,.15,.55,.15);spike.rotation.z=a-Math.PI/2}return t=>g.rotation.x=t*3};
 models['curse-buds']=g=>{flower(g,0,.2,0,.5);put(g,'gem',green,0,-.25,0,.23,.5,.23)};
 models['curse-flower-field']=fieldFlowers;
 models['curse-life-absorption']=g=>{const pose=roots(g,5);for(let i=0;i<8;i++)flower(g,Math.cos(i)*.7,.2,Math.sin(i)*.7,.12);return pose};
 models['curse-flower-cannon']=g=>{const h=joint(g,0,0,0);flower(h,0,.2,0,.6);h.rotation.z=-Math.PI/2;put(g,'pole',0xebffa5,.7,0,0,.16,1.2,.16).rotation.z=-Math.PI/2};
 models['curse-wood-screen']=g=>{for(let i=-3;i<=3;i++){put(g,'pole',wood,0,.2,i*.2,.12,1.1,.12);flower(g,0,.7,i*.2,.12)}};
 models['curse-growing-branches']=g=>{fieldFlowers(g);for(let i=0;i<10;i++){const a=i*Math.PI/5,h=joint(g,Math.cos(a)*.85,0,Math.sin(a)*.85);h.scale.setScalar(.3);roots(h,4);flower(h,0,1.3,0,.55)}};
 models['curse-flame-touch']=g=>{hand(g,0,0,0,.65);for(let i=0;i<5;i++)put(g,'cone',lava,.5,(i-2)*.14,0,.1,.6,.1).rotation.z=-Math.PI/2};
 models['curse-volcanic-vents']=volcano;
 models['curse-ember-insects']=g=>{put(g,'ball',0xff6c2c,0,0,0,.42,.2,.18);put(g,'cone',0xffd077,.5,0,0,.09,.4,.09).rotation.z=-Math.PI/2;const wings=[];for(const s of [-1,1])wings.push(put(g,'gem',0xffe2b6,-.1,.1,s*.3,.35,.06,.3));return t=>wings.forEach((m,i)=>m.rotation.x=Math.sin(t*30)*(i?1:-1)*.6)};
 models['curse-heat-ray']=g=>{put(g,'pole',0xffe5a1,0,0,0,.12,2,.12).rotation.z=-Math.PI/2;for(let i=0;i<3;i++)put(g,'ring',lava,-.6+i*.6,0,0,.3,.3,.08).rotation.y=Math.PI/2};
 models['curse-maximum-meteor']=g=>{put(g,'gem',0x5a423e,0,0,0,.9);for(let i=0;i<9;i++){const a=i*2.4;put(g,'gem',lava,Math.sin(a)*.65,Math.cos(a)*.65,Math.sin(a*2)*.4,.23)}put(g,'cone',lava,-1,0,0,.45,1.8,.45).rotation.z=Math.PI/2};
 models['curse-meteor-warning']=g=>{for(let i=0;i<12;i++){const a=i*Math.PI/6;put(g,'box',lava,Math.cos(a)*.85,.02,Math.sin(a)*.85,.14,.02,.04).rotation.y=-a}return t=>g.rotation.y=t*.35};
 models['curse-lava-field']=g=>{for(let i=0;i<14;i++){const a=i*2.4;put(g,'gem',i%2?lava:0x7f3630,Math.cos(a)*Math.sqrt(i/15),.015,Math.sin(a)*Math.sqrt(i/15),.3,.025,.24)}};
 models['curse-iron-mountain']=g=>{models['curse-lava-field'](g);for(let i=0;i<9;i++){const a=i*Math.PI*2/9;put(g,'cone',0x4b3a41,Math.cos(a)*.9,.4,Math.sin(a)*.9,.28,1,.28)}};
 models['curse-flame-propulsion']=g=>{for(let i=0;i<5;i++){const f=put(g,'cone',i%2?lava:0xffda69,0,-.3-i*.12,0,.4-i*.06,.5,.4-i*.06);f.rotation.z=Math.PI}};
 models['curse-water-jet']=g=>{put(g,'pole',water,0,0,0,.18,1.6,.18).rotation.z=-Math.PI/2;for(let i=0;i<6;i++)put(g,'ball',0xd2f9ff,-.5-i*.12,Math.sin(i)*.16,Math.cos(i)*.16,.07)};
 models['curse-tidal-wave']=g=>{const strips=[];for(let i=-5;i<=5;i++){strips.push(put(g,'ball',water,0,.25,i*.18,.18,.52,.15));put(g,'ball',0xdef8fc,.12,.67,i*.18,.2,.12,.14)}return t=>strips.forEach((m,i)=>m.rotation.z=Math.sin(t*9+i)*.2)};
 models['curse-water-shield']=g=>{for(let i=0;i<12;i++){const a=i*Math.PI/6;put(g,'pole',water,Math.cos(a)*.7,.3,Math.sin(a)*.7,.12,.9,.12)}return t=>g.rotation.y=t*1.8};
 models['curse-levitation']=g=>{for(let i=0;i<5;i++)put(g,'ring',water,0,-i*.25,0,.4+i*.1,.4+i*.1,.06).rotation.x=Math.PI/2;return t=>g.rotation.y=t};
 models['curse-fish']=g=>fish(g);
 models['curse-captivating-skandha']=g=>{put(g,'ball',0xe9d59c,0,-.025,0,1,.03,1);for(let i=0;i<4;i++)put(g,'ring',water,0,.015+i*.008,0,.45+i*.17,.45+i*.17,.018).rotation.x=Math.PI/2;for(const s of [-1,1]){const palm=joint(g,s*.75,0,.5);put(palm,'pole',wood,0,.4,0,.04,.8,.04);for(let i=0;i<5;i++){const a=i*1.256;put(palm,'gem',green,Math.cos(a)*.2,.8,Math.sin(a)*.2,.3,.025,.1).rotation.y=-a}}};
 models['curse-idle-transfiguration']=g=>{const h=hand(g);return t=>h.rotation.z=Math.sin(t*6)*.3};
 models['curse-soul-reshape']=g=>{const a=hand(g,-.35,0,0,.6),b=hand(g,.35,0,0,.6);return t=>{a.rotation.z=t*2;b.rotation.z=-t*2}};
 models['curse-blade-arms']=g=>{put(g,'pole',skin,0,0,0,.16,1,.16).rotation.z=-Math.PI/2;put(g,'gem',0xeee4f4,.5,.1,0,.7,.16,.08)};
 models['curse-body-repel']=g=>{for(let i=0;i<6;i++){put(g,'ball',skin,(i-2.5)*.2,Math.sin(i)*.2,0,.3,.25,.25);hand(g,(i-2.5)*.2,Math.sin(i)*.2,.2,.25)}return t=>g.rotation.x=t*4};
 function puppet(g,heavy=false,double=false){put(g,'ball',skin,0,.2,0,heavy?.6:.28,.5,.22);put(g,'ball',double?0xa4b1ce:skin,0,.85,0,.25,.3,.24);for(const z of [-.17,.17])put(g,'ball',0x252339,.15,.87,z,.045);const limbs=[];for(const s of [-1,1]){limbs.push(put(g,'pole',skin,s*(heavy?.7:.35),.2,0,.12,.8,.12));limbs.push(put(g,'pole',0x665478,s*.19,-.45,0,.12,.65,.12))}return t=>limbs.forEach((m,i)=>m.rotation.z=Math.sin(t*7+i*Math.PI)*.45)}
 models['curse-puppet']=g=>puppet(g);
 models['curse-isomer']=g=>puppet(g,true);
 models['curse-double']=g=>puppet(g,false,true);
 models['curse-winged-form']=g=>{const wings=[];for(const s of [-1,1]){const w=joint(g,0,0,0);for(let i=0;i<4;i++)put(w,'gem',skin,0,.1-i*.1,s*(.35+i*.13),.18,.4,.36);wings.push(w)}return t=>wings.forEach((w,i)=>w.rotation.x=Math.sin(t*6)*(i?1:-1)*.35)};
 models['curse-spiked-body']=g=>{for(let i=0;i<14;i++){const a=i*2.4;put(g,'cone',skin,Math.cos(a)*.7,.1,Math.sin(a)*.7,.1,.65,.1).rotation.z=Math.cos(a)*1.3}};
 models['curse-instant-spirit']=g=>{for(const s of [-1,1]){put(g,'gem',0x594b67,s*.35,.3,0,.2,.55,.38);put(g,'cone',skin,s*.55,.55,0,.1,.4,.1)}put(g,'gem',0x594b67,0,.95,0,.3,.25,.3)};
 models['curse-self-embodiment']=g=>{for(let i=0;i<16;i++){const a=i*Math.PI/8;const h=hand(g,Math.cos(a)*.9,.35,Math.sin(a)*.9,.5);h.rotation.y=-a}for(let i=0;i<8;i++){const a=i*Math.PI/4;hand(g,Math.cos(a)*.45,.04,Math.sin(a)*.45,.25)}};
 models['curse-domain-amplification']=g=>{for(let i=0;i<5;i++)put(g,'ring',0xc5c3db,0,(i-2)*.2,0,.6,.6,.04).rotation.x=Math.PI/2;return t=>g.rotation.z=Math.sin(t*2)*.1};
 for(const [id,source] of Object.entries({'death-swarm':'fish','giant-shikigami':'fish','soul-isomer':'isomer','transfigured-humans':'puppet','flash-domain':'self-embodiment'}))models['curse-'+id]=models['curse-'+source];
 models['curse-black-flash']=g=>{for(let i=0;i<8;i++){const a=i*Math.PI/4;const bolt=put(g,'gem',i%2?0xf33a63:0x24172e,Math.cos(a)*.5,Math.sin(a)*.5,0,.55,.065,.08);bolt.rotation.z=a}hand(g,0,0,0,.45)};
}
