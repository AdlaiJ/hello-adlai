export function installSalvageModels(models,{joint,part,shape,mat}){
 const put=(g,k,c,x,y,z,w,h=w,d=w)=>part(g,shape[k],mat(c),x,y,z,w,h,d),metal=0xaebdc6,green=0x78dfbb;
 const box=(g,x,y,z,w,h,d,c=metal)=>put(g,'box',c,x,y,z,w,h,d);
 const rod=(g,x,y,z,h,c=metal)=>put(g,'pole',c,x,y,z,.045,h,.045);
 const bottle=(g,c)=>{put(g,'cone',c,0,0,0,.4,.65,.4);rod(g,0,.45,0,.3);box(g,0,.65,0,.2,.1,.2)};
 const ids='bleach molotov corrosion cables uv tape alarm vines puck eagle snare quicksand tesla guillotine pin spike slick zoomies walkway mirror bank shock icicles gravity trap'.split(' ');
 for(const [n,id] of ids.entries())models['salvage-'+id]=g=>{
  const moving=[];
  switch(id){
   case 'bleach':bottle(g,0xf1fff5);box(g,0,0,.23,.23,.2,.02,green);break;
   case 'molotov':bottle(g,0xe68634);put(g,'cone',0xffe875,0,.8,0,.13,.4,.13);break;
   case 'corrosion':bottle(g,0x92bd36);for(let i=0;i<5;i++)put(g,'gem',green,i*.1-.2,-.5,0,.07,.2,.07);break;
   case 'cables':for(const s of [-1,1]){rod(g,s*.3,0,0,1,s<0?0xff5555:0x222222);box(g,s*.3,.5,0,.2,.15,.1);box(g,s*.3,.65,.05,.05,.25,.05)}break;
   case 'uv':for(const x of [-.5,.5])for(const z of [-.5,.5])rod(g,x,0,z,1.4,0xb4aaff);box(g,0,.7,0,1.2,.12,1.2);break;
   case 'tape':put(g,'ring',metal,0,0,0,.5,.5,.25);box(g,.5,-.3,0,.7,.15,.22);break;
   case 'alarm':box(g,0,0,0,.8,.4,.5);put(g,'cone',0xff6655,0,.35,0,.3,.4,.3);break;
   case 'vines':for(let i=0;i<9;i++){const a=i*2.4;rod(g,Math.cos(a)*.6,.1,Math.sin(a)*.6,.5,0x315f32);put(g,'cone',0xb4db64,Math.cos(a)*.6,.4,Math.sin(a)*.6,.13,.4,.13)}break;
   case 'puck':put(g,'pole',0x273644,0,0,0,.7,.15,.7);break;
   case 'eagle':put(g,'gem',0x38244f,0,0,0,.65,.2,.2);for(const s of [-1,1])moving.push(box(g,-.1,0,s*.4,.45,.07,.65,0x604082));put(g,'cone',0xf4d269,.45,0,0,.12,.3,.12).rotation.z=-Math.PI/2;break;
   case 'snare':for(const s of [-1,1])rod(g,s*.8,0,0,.5);box(g,0,0,0,1.6,.02,.02,0xf2dfbc);break;
   case 'quicksand':put(g,'pole',0xb99c65,0,-.1,0,1.7,.08,1.7);for(let i=0;i<4;i++)put(g,'ring',0x725c3b,0,-.04+i*.01,0,.3+i*.2,.3+i*.2,.02).rotation.x=Math.PI/2;break;
   case 'tesla':rod(g,0,0,0,1.3);for(let i=0;i<6;i++)put(g,'ring',0x97dfff,0,i*.15-.3,0,.35,.35,.04).rotation.x=Math.PI/2;put(g,'ball',metal,0,.7,0,.25);break;
   case 'guillotine':for(const s of [-1,1])rod(g,s*.6,.3,0,1.8);moving.push(box(g,0,.5,0,1.1,.8,.12));for(let i=0;i<5;i++)box(g,0,i*.14+.2,.07,1.08,.02,.02,0x536976);break;
   case 'pin':put(g,'gem',0xff5050,0,0,0,1.8,.025,.025);break;
   case 'spike':for(let i=0;i<5;i++)put(g,'gem',0x817c70,(i-2)*.22,0,0,.3,1.1-Math.abs(i-2)*.2,.3);break;
   case 'slick':for(let i=0;i<8;i++){const a=i*2.4;put(g,'pole',i%2?0x779e39:0x455b35,Math.cos(a)*.4,-.1,Math.sin(a)*.4,.7,.03,.7)}break;
   case 'zoomies':for(const s of [-1,1]){box(g,0,0,s*.3,.8,.25,.25,0xffd866);for(let i=0;i<3;i++)put(g,'cone',0x6fffe0,-.5-i*.15,0,s*.3,.1,.4,.1).rotation.z=Math.PI/2}break;
   case 'walkway':for(let i=0;i<9;i++)box(g,(i-4)*.18,-.1,0,.15,.1,.7,i%2?0xd0bb65:metal);break;
   case 'mirror':box(g,0,0,0,.5,.5,.1,0x9de9f3);for(let i=0;i<4;i++)rod(g,(i-1.5)*.13,.5,0,.55,0x9de9f3);box(g,.35,0,0,.3,.12,.1,0x9de9f3);break;
   case 'bank':box(g,0,0,0,.55,.75,.15,0xeef4ef);box(g,0,0,.1,.4,.4,.05,0xce465e);rod(g,0,-.65,0,.5,0xce465e);break;
   case 'shock':for(const s of [-1,1]){box(g,s*.4,0,0,.4,.4,.12,0xf2d569);rod(g,s*.4,.3,0,.3)}break;
   case 'icicles':put(g,'gem',0xacf0ff,0,0,0,1.5,.14,.14);break;
   case 'gravity':rod(g,0,.1,0,1);box(g,0,-.4,0,1.1,.12,.12);for(const s of [-1,1])put(g,'cone',metal,s*.5,-.2,0,.22,.4,.22);put(g,'ring',metal,0,.7,0,.2,.2,.06);break;
   case 'trap':box(g,0,-.1,0,1,.08,1,0x36435c);for(let i=0;i<5;i++){const a=i*6.28/5;box(g,Math.cos(a)*.3,0,Math.sin(a)*.3,.25,.03,.05,green).rotation.y=-a}break;
  }
  return t=>{for(const [i,m] of moving.entries())if(id==='eagle')m.rotation.x=Math.sin(t*9)*(i?-.4:.4);else m.position.y=.5-Math.abs(Math.sin(t*3))*.6;};
 };
}
