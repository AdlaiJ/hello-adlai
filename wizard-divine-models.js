export function installDivineModels(models,{joint,part,shape,mat}){
 const gold=0xffd875,white=0xf5f2df,blue=0xb4eaff;
 const put=(g,k,c,x,y,z,w,h=w,d=w)=>part(g,shape[k],mat(c),x,y,z,w,h,d);
 function halo(g,x=0,y=0,z=0,r=.5){return put(g,'ring',gold,x,y,z,r,r,.05)}
 function wings(g,pairs=1){const all=[];for(let j=0;j<pairs;j++)for(const s of [-1,1]){const wing=joint(g,0,.25-j*.25,0);for(let i=0;i<5;i++){const f=put(wing,'gem',white,s*(.3+i*.13),.2+i*.06,0,.13,.45-i*.04,.06);f.rotation.z=-s*(.4+i*.1)}all.push([wing,s,j])}return t=>all.forEach(([w,s,j])=>w.rotation.y=s*(.3+Math.sin(t*5+j)*.35))}
 function sword(g){put(g,'pole',gold,-.5,0,0,.07,.35,.07).rotation.z=Math.PI/2;put(g,'box',gold,-.3,0,0,.08,.5,.12);put(g,'gem',white,.3,0,0,.7,.09,.06)}
 function seal(g){const h=halo(g,0,.02,0,.85);h.rotation.x=Math.PI/2;for(let i=0;i<8;i++){const a=i*Math.PI/4;put(g,'gem',gold,Math.cos(a)*.7,.03,Math.sin(a)*.7,.13,.02,.04).rotation.y=-a}}
 function angel(g,cherub=false){put(g,'cone',white,0,0,0,.3,.8,.25);put(g,'ball',gold,0,.55,0,.2);halo(g,0,.88,0,.3).rotation.x=Math.PI/2;const flap=wings(g,cherub?1:2);if(!cherub){const blade=joint(g,.4,.2,0);blade.rotation.z=1.2;blade.scale.setScalar(.6);sword(blade)}return flap}
 models['divine-sun-lance']=g=>{put(g,'pole',gold,0,0,0,.055,1.5,.055).rotation.z=Math.PI/2;put(g,'gem',white,.7,0,0,.35,.15,.15);wings(g)};
 models['divine-halo-disc']=g=>{halo(g,0,0,0,.8);for(let i=0;i<6;i++){const a=i*Math.PI/3;put(g,'gem',white,Math.cos(a)*.8,Math.sin(a)*.8,0,.15,.15,.04)}return t=>g.rotation.z=t*7};
 models['divine-judgment-seal']=seal;models['divine-starfall-seal']=g=>{seal(g);for(let i=0;i<7;i++){const a=i*2.4;put(g,'gem',white,Math.cos(a)*.5,.2,Math.sin(a)*.5,.07,.3,.07)}};
 models['divine-judgment']=g=>{put(g,'pole',white,0,1.5,0,.17,4,.17);for(let i=0;i<4;i++)halo(g,0,i*.7,0,.3+i*.12).rotation.x=Math.PI/2};
 models['divine-starfall']=models['divine-starfall-seal'];
 models['divine-mercy']=g=>{for(const s of [-1,1]){put(g,'box',white,s*.3,0,0,.25,.3,.1);for(let i=0;i<4;i++)put(g,'pole',gold,s*.3+(i-1.5)*.06,.25,0,.04,.25,.04)}halo(g,0,.5,0,.2)};
 models['divine-cleansing-bell']=g=>{put(g,'cone',gold,0,0,0,.6,.7,.6).rotation.z=Math.PI;put(g,'ball',white,0,-.4,0,.12);halo(g,0,.5,0,.15);return t=>g.rotation.z=Math.sin(t*9)*.3};
 models['divine-fountain']=g=>{put(g,'pole',white,0,.15,0,.12,.3,.12);put(g,'ball',gold,0,.3,0,.35,.08,.35);const drops=[];for(let i=0;i<10;i++){const a=i*2.4;drops.push(put(g,'gem',blue,Math.cos(a)*.25,.45,Math.sin(a)*.25,.03,.08,.03))}return t=>drops.forEach((d,i)=>d.position.y=.35+Math.abs(Math.sin(t*2+i))*.35)};
 models['divine-covenant']=g=>{halo(g,0,0,0,.7).rotation.x=Math.PI/2;for(let i=0;i<7;i++){const a=i*6.28/7;put(g,'cone',gold,Math.cos(a)*.6,.25,Math.sin(a)*.6,.1,.5,.1)}};
 models['divine-aegis']=g=>{put(g,'gem',blue,0,.2,0,.45,.65,.12);return wings(g)};
 models['divine-mirror']=g=>{put(g,'box',blue,0,.2,0,.7,1,.06);for(const x of [-.4,.4])put(g,'pole',gold,x,.2,0,.05,1.1,.05);for(const y of [-.35,.75])put(g,'box',gold,0,y,0,.85,.05,.09)};
 models['divine-procession']=g=>{const rings=[];for(let i=0;i<3;i++){const a=i*2.094;rings.push(halo(g,Math.cos(a)*.65,.2,Math.sin(a)*.65,.22))}return t=>rings.forEach((r,i)=>{r.position.x=Math.cos(t+i*2.094)*.65;r.position.z=Math.sin(t+i*2.094)*.65})};
 models['divine-cathedral']=g=>{seal(g);for(let i=0;i<10;i++){const a=i*6.28/10,x=Math.cos(a)*.9,z=Math.sin(a)*.9;put(g,'pole',white,x,.45,z,.035,.9,.035);put(g,'cone',gold,x,1,z,.08,.3,.08)}for(const x of [-.25,.25]){put(g,'pole',white,x,.45,.65,.04,.9,.04);put(g,'gem',blue,x,.7,.65,.17,.24,.025)}halo(g,0,.9,.65,.22);put(g,'box',gold,0,.25,0,.3,.12,.2)};
 models['divine-wings']=g=>wings(g,3);
 models['divine-pilgrim']=g=>{put(g,'pole',gold,0,.4,0,.04,.8,.04);put(g,'gem',blue,0,.95,0,.2,.3,.2);halo(g,0,.9,0,.35)};
 models['divine-dawnstep']=g=>{for(let i=0;i<5;i++)put(g,'gem',gold,-i*.25,0,0,.2,.09,.08);return wings(g)};
 models['divine-ascension']=g=>{for(let i=0;i<4;i++)halo(g,0,i*.3,0,.6-i*.1).rotation.x=Math.PI/2;return wings(g,2)};
 models['divine-guardian']=g=>angel(g);
 models['divine-cherub']=g=>angel(g,true);
 models['divine-ophanim']=g=>{const rings=[];for(let j=0;j<3;j++){const h=joint(g,0,0,0);halo(h,0,0,0,.7);h.rotation.y=j*Math.PI/3;rings.push(h);for(let i=0;i<5;i++){const a=i*6.28/5;put(h,'ball',white,Math.cos(a)*.7,Math.sin(a)*.7,0,.13,.08,.1);put(h,'ball',blue,Math.cos(a)*.7,Math.sin(a)*.7,.09,.04)}}return t=>rings.forEach((h,i)=>{h.rotation.y=t*(i%2?-.8:.8)+i;h.rotation.x=t*.4})};
 models['divine-sword']=sword;
 models['divine-chains']=g=>{for(let i=0;i<6;i++){const h=halo(g,(i-2.5)*.23,0,0,.17);h.rotation.x=i%2*Math.PI/2}};
 models['divine-vow']=g=>{put(g,'box',white,0,0,0,.7,.45,.04);for(const x of [-.4,.4])put(g,'pole',gold,x,0,0,.06,.65,.06);put(g,'box',gold,0,0,.03,.3,.035,.02)};
 models['divine-reckoning']=g=>{put(g,'pole',gold,0,0,0,.05,1,.05);put(g,'box',gold,0,.35,0,.9,.05,.05);for(const x of [-.4,.4]){put(g,'pole',gold,x,.1,0,.02,.45,.02);put(g,'cone',white,x,-.15,0,.22,.12,.22).rotation.z=Math.PI}};
 models['divine-trumpet']=g=>{put(g,'pole',gold,0,.1,0,.12,.8,.12).rotation.z=Math.PI/2;put(g,'cone',gold,.5,.1,0,.35,.5,.35).rotation.z=-Math.PI/2;return wings(g)};
 models['divine-trumpet-wave']=g=>{halo(g,0,0,0,.9).rotation.x=Math.PI/2;for(let i=0;i<12;i++){const a=i*Math.PI/6;put(g,'gem',gold,Math.cos(a)*.9,.05,Math.sin(a)*.9,.08,.1,.03)}return t=>g.scale.setScalar(.3+t)};
 models['divine-hidden-timer']=()=>{};
}
