export function installHakariModels(models,{joint,part,shape,mat}){
 const green=0x69ffb0,gold=0xffd66e,steel=0xb8c8d4;
 const put=(g,k,c,x,y,z,w,h=w,d=w)=>part(g,shape[k],mat(c),x,y,z,w,h,d);
 function doors(g){const halves=[];for(const s of [-1,1]){const h=joint(g,0,0,0);put(h,'box',steel,0,.25,s*.38,.12,1.25,.7);put(h,'box',0x123a42,.075,.46,s*.38,.035,.48,.46);put(h,'box',green,.085,-.12,s*.38,.04,.06,.68);halves.push([h,s])}return t=>halves.forEach(([h,s])=>h.position.z=s*Math.max(0,.6-t*1.4))}
 models['hakari-shutter-doors']=doors;models['hakari-door-guard']=doors;
 models['hakari-reserve-balls']=g=>{put(g,'ball',steel,0,0,0,.8);const r=put(g,'ring',green,0,0,0,.5,.5,.06);return t=>r.rotation.y=t*8};
 models['hakari-rough-energy']=g=>{put(g,'box',green,0,0,0,.7,.5,.5);for(let i=0;i<4;i++)put(g,'box',steel,.32,.2,(i-1.5)*.13,.22,.24,.12);return t=>g.position.x=Math.sin(t*12)*.3};
 models['hakari-fever-rush']=g=>{for(let i=0;i<5;i++)put(g,'gem',green,-i*.3,0,0,.3,.12,.12)};
 function reels(g){const all=[];put(g,'box',gold,0,.5,0,1.5,.8,.2);for(let i=0;i<3;i++){const r=joint(g,(i-1)*.45,.5,.15);put(r,'box',0x122a26,0,0,0,.4,.65,.1);put(r,'box',green,0,.18,.08,.26,.07,.03);const slash=put(r,'box',green,.04,0,.08,.07,.42,.03);slash.rotation.z=-.35;all.push(r)}return t=>all.forEach((r,i)=>r.rotation.x=t*(5+i))}
 models['hakari-roll']=reels;
 models['hakari-idle-death-gamble']=g=>{put(g,'box',0x213a35,0,.01,0,1.7,.02,1.7);for(const x of [-.65,.65])put(g,'box',steel,x,.03,0,.025,.03,1.6);for(const z of [-.75,.75]){put(g,'box',green,0,.08,z,1.7,.08,.05);put(g,'pole',steel,-.7,.35,z,.035,.7,.035);put(g,'pole',steel,.7,.35,z,.035,.7,.035)}const sign=joint(g,0,.7,-.75);sign.scale.setScalar(.35);return reels(sign)};
 models['hakari-jackpot']=g=>{const animate=reels(g);for(let i=0;i<10;i++){const a=i*Math.PI/5;put(g,'gem',green,Math.cos(a)*.65,0,Math.sin(a)*.65,.1,1.6,.1)}return t=>{animate(0);g.rotation.y=t*1.2}};
 models['hakari-timer']=()=>{};
}
