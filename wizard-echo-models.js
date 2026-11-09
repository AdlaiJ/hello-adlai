import {echoSpells,ECHO_KINDS} from './wizard-echo-spells.js?v=echo-kits';
export function installEchoModels(models,{joint,part,shape,mat}){
 const colors=['#d4b581','#80dfcc','#bb85e8','#ed626d','#98cc67','#9caeef'];
 const put=(g,k,c,x,y,z,w,h=w,d=w)=>part(g,shape[k],mat(c),x,y,z,w,h,d);
 function build(g,form,tint){
  const c=tint,white='#dce8ea',dark='#303848',anim=[];
  const box=(x,y,z,w,h,d,col=c)=>put(g,'box',col,x,y,z,w,h,d);
  const pole=(x,y,z,h,w=.05,col=c)=>put(g,'pole',col,x,y,z,w,h,w);
  const blade=(at=0)=>{pole(-.5,at,0,.4,.065,dark).rotation.z=Math.PI/2;box(-.3,at,0,.08,.4,.1);put(g,'gem',white,.25,at,0,1,.12,.06)};
  switch(form){
   case 'sword':case 'machete':case 'dagger':case 'twins':blade();if(form==='twins')blade(.35);if(form==='dagger')g.scale.setScalar(.7);anim.push(t=>g.rotation.z=-1.1+Math.sin(t*Math.PI)*2.2);break;
   case 'axe':pole(0,0,0,1.3,.07,dark);put(g,'gem',white,.25,.4,0,.65,.45,.1);anim.push(t=>g.rotation.z=Math.sin(t*Math.PI)*1.8);break;
   case 'chainsaw':box(-.3,0,0,.55,.35,.3,dark);box(.35,0,0,.9,.22,.1,white);for(let i=0;i<8;i++)for(const s of [-1,1])box(i*.1, s*.15,0,.06,.08,.13);anim.push(t=>g.rotation.z=Math.sin(t*20)*.12);break;
   case 'fist':case 'claw':box(-.2,0,0,.45,.4,.4);for(let i=0;i<4;i++){box(.15,0,(i-1.5)*.13,.3,.3,.11);if(form==='claw')put(g,'gem',white,.45,0,(i-1.5)*.13,.5,.04,.05)}anim.push(t=>g.position.x=Math.sin(t*Math.PI)*.3);break;
   case 'fangs':for(const s of [-1,1]){box(0,s*.2,0,.8,.15,.4);for(let i=0;i<4;i++)put(g,'cone',white,(i-1.5)*.2,s*.1,0,.12,.25,.12).rotation.z=s<0?0:Math.PI}break;
   case 'can':put(g,'pole',c,0,0,0,.45,.75,.45);box(0,0,.23,.3,.28,.025,white);break;
   case 'bottle':put(g,'ball',c,0,0,0,.55,.65,.55);pole(0,.5,0,.4,.15,white);break;
   case 'burger':put(g,'ball','#dfb05f',0,.2,0,.8,.25,.8);box(0,0,0,.7,.12,.6,'#4e9c4e');box(0,-.15,0,.7,.16,.6,'#704832');put(g,'ball','#dfb05f',0,-.3,0,.8,.15,.8);break;
   case 'pizza':put(g,'cone','#f1cc69',0,0,0,.8,.08,.8);for(let i=0;i<5;i++){const a=i*2.4;put(g,'pole','#c74c43',Math.cos(a)*.25,.07,Math.sin(a)*.25,.15,.03,.15)}break;
   case 'chicken':put(g,'ball','#c88c48',0,0,0,.7,.45,.4);pole(-.5,0,0,.5,.08,white).rotation.z=Math.PI/2;break;
   case 'coin':put(g,'pole','#f5cf68',0,0,0,.7,.08,.7).rotation.x=Math.PI/2;box(0,0,.1,.08,.35,.04);anim.push(t=>g.rotation.y=t*9);break;
   case 'dice':box(0,0,0,.6,.6,.6,white);for(const x of [-.15,.15])for(const y of [-.15,.15])put(g,'ball',dark,x,y,.32,.06);anim.push(t=>{g.rotation.x=t*4;g.rotation.z=t*3});break;
   case 'hat':put(g,'pole',dark,0,0,0,.9,.1,.9);put(g,'pole',dark,0,.25,0,.5,.5,.5);box(0,.1,.26,.4,.1,.03);break;
   case 'gun':box(0,0,0,1,.18,.2,dark);box(-.3,-.25,0,.2,.4,.15);put(g,'pole',white,.5,0,0,.13,.15,.13).rotation.z=Math.PI/2;break;
   case 'screen':case 'terminal':box(0,0,0,.9,.7,.15,dark);box(0,0,.09,.75,.5,.03);for(let i=0;i<4;i++)box(-.1,i*.1-.15,.12,.4,.025,.01,white);break;
   case 'staff':pole(0,0,0,1.4,.06,dark);put(g,'gem',c,0,.8,0,.3,.4,.3);put(g,'ring',white,0,.8,0,.4,.4,.04);break;
   case 'shield':put(g,'gem',white,0,0,0,.65,.9,.13);box(0,0,.1,.08,.55,.04);break;
   case 'wire':for(const x of [-.7,.7])pole(x,0,0,.5);box(0,0,0,1.4,.025,.025,white);break;
   case 'mine':put(g,'pole',dark,0,0,0,.6,.18,.6);put(g,'gem',c,0,.2,0,.15);break;
   case 'rune':put(g,'ring',c,0,0,0,.85,.85,.06).rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;box(Math.cos(a)*.6,.04,Math.sin(a)*.6,.18,.04,.08,white).rotation.y=-a}break;
   case 'crystal':case 'spikes':for(let i=0;i<(form==='crystal'?1:7);i++)put(g,'gem',c,(i-3)*.15,0,0,.25,1.2-Math.abs(i-3)*.12,.25);break;
   case 'spray':put(g,'pole',c,0,0,0,.35,.65,.35);box(0,.4,0,.16,.12,.16,white);for(let i=0;i<6;i++)put(g,'gem',c,.1+i*.1,.4+i*.04,0,.04);break;
   case 'board':box(0,0,0,1.2,.1,.4);for(const x of [-.4,.4])for(const z of [-.22,.22])put(g,'ball',dark,x,-.12,z,.15);anim.push(t=>g.rotation.x=Math.sin(t*5)*.3);break;
   case 'battery':box(0,0,0,.45,.8,.3,dark);for(let i=0;i<4;i++)box(0,i*.15-.22,.17,.3,.1,.03,'#7deba1');box(0,.47,0,.2,.12,.15,white);break;
   case 'antenna':box(0,-.2,0,.6,.5,.4,dark);for(const x of [-.2,.2]){pole(x,.35,0,.6);put(g,'ball',c,x,.7,0,.12)}break;
   case 'shoe':box(0,0,0,.85,.25,.3);box(-.25,.25,0,.3,.4,.3,white);break;
   case 'mask':put(g,'ball',white,0,0,0,.7,.85,.15);for(const x of [-.2,.2])box(x,.1,.1,.15,.1,.04,dark);for(let i=0;i<3;i++)box((i-1)*.15,-.25,.1,.04,.08,.04,dark);break;
   case 'brick':box(0,0,0,.85,.45,.4,'#bc564f');break;
   case 'wave':for(const s of [-1,1]){const b=joint(g,0,s*.2,0);blade();b.rotation.z=s*.4}break;
   case 'hook':case 'chain':for(let i=0;i<7;i++){const r=put(g,'ring',c,(i-3)*.18,0,0,.14,.14,.03);r.rotation.x=i%2*Math.PI/2}if(form==='hook')put(g,'gem',white,.7,.15,0,.15,.4,.06);break;
   case 'eye':put(g,'ball',white,0,0,0,.8,.45,.3);put(g,'ball',c,.05,0,.2,.22,.3,.1);put(g,'ball',dark,.06,0,.27,.08,.22,.04);break;
   case 'tentacle':case 'vine':for(let i=0;i<9;i++){const b=put(g,'ball',c,(i-4)*.16,Math.sin(i*.5)*.12,0,.22-i*.015);anim.push(t=>b.position.y=Math.sin(t*5+i*.5)*.14)}break;
   case 'star':for(let i=0;i<5;i++){const a=i*6.28/5;put(g,'gem',white,Math.cos(a)*.3,Math.sin(a)*.3,0,.15,.5,.1).rotation.z=a}anim.push(t=>g.rotation.z=t*4);break;
   case 'blood':for(let i=0;i<7;i++)put(g,'pole','#ab2949',Math.sin(i*3)*.4,-.1,Math.cos(i*3)*.4,.6,.04,.6);break;
   case 'bats':for(let i=0;i<3;i++){const b=joint(g,(i-1)*.45,Math.abs(i-1)*.2,0);put(b,'ball',dark,0,0,0,.2);for(const s of [-1,1]){const w=put(b,'gem',c,0,0,s*.2,.25,.04,.4);anim.push(t=>w.rotation.x=Math.sin(t*12+i)*s*.6)}}break;
   case 'flower':pole(0,0,0,.8,.08,'#57784c');for(let i=0;i<6;i++){const a=i*6.28/6;put(g,'gem',c,Math.cos(a)*.3,.4,Math.sin(a)*.3,.4,.12,.2).rotation.y=-a}put(g,'ball','#efd576',0,.45,0,.23);break;
   case 'turret':box(0,0,0,.5,.5,.5,dark);for(const s of [-1,1])pole(s*.35,-.4,0,.5);box(.4,.15,0,.7,.13,.13);break;
   case 'dispenser':box(0,0,0,.7,.9,.5,dark);box(0,.1,.27,.45,.3,.03,'#79e5a9');box(0,-.25,.32,.5,.12,.2,white);break;
   case 'clone':case 'zombie':case 'golem':{
    const big=form==='golem';box(0,.15,0,big?.7:.45,.65,.3);put(g,'ball',form==='zombie'?'#89ac76':white,0,.65,0,.35);for(const s of [-1,1]){const arm=box(s*.4,.2,0,.18,.6,.2);const leg=box(s*.17,-.45,0,.2,.6,.2,dark);anim.push(t=>{arm.rotation.x=Math.sin(t*5)*s*.5;leg.rotation.x=-Math.sin(t*5)*s*.5})}break;}
  }
  return t=>anim.forEach(fn=>fn(t));
 }
 echoSpells().forEach((s,i)=>models[s.id]=g=>build(g,s.form,colors[i%colors.length]));
 const kinds={clone:'clone',sentry:'turret',dispenser:'dispenser',delivery:'clone',rotten:'zombie',bulb:'flower',vine:'vine',golem:'golem'};
 for(const kind of ECHO_KINDS)models[kind]=g=>build(g,kinds[kind.slice(5)],kind==='echo-delivery'?'#ec6c50':'#b7a5e9');
 models['echo-seed-shot']=g=>build(g,'crystal','#b88cef');models['echo-sentry-shot']=g=>build(g,'brick','#e9c76c');models['echo-radar']=g=>build(g,'eye','#ee7878');
}
