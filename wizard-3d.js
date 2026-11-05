import {makeSpellModels} from './wizard-spell-models.js?v=cursed-ten';
import {makeCastPainter} from './wizard-casting.js?v=blood-arsenal';
import {bloodWeapons,SPELLS} from './wizard-spells.js?v=cursed-ten';
const meleeModels=new Map(SPELLS.filter(s=>s.melee).map(s=>[s.id,s.melee]));
import {makeProjectileArt} from './wizard-projectile-art.js?v=blood-arsenal';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import {W as X,H as Y,D as Z,T as TILE} from './wizard-world.js?v=cursed-ten';

const HEIGHT=Y*TILE,TAU=Math.PI*2;
const clamp=THREE.MathUtils.clamp;
const frac=n=>n-Math.floor(n);
const noise=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);
const worlds={
 'Bellfall Keep':{sky:0x242744,haze:0xd4a6a2,ridge:0x756987,ruin:0x5e5875,top:0x9da78e,rock:0x665e72,sun:0xffe6be},
 'Ember Quarry':{sky:0x311f3b,haze:0xf4a172,ridge:0x936269,ruin:0x774e60,top:0xc8946c,rock:0x724b52,sun:0xffc498},
 'Frostglass Bridge':{sky:0x172f4d,haze:0xb7dce7,ridge:0x7297b8,ruin:0x59819a,top:0xc3e2df,rock:0x66869e,sun:0xe5fff3},
 'Thornroot Ruins':{sky:0x173c38,haze:0x9ebaa0,ridge:0x496b61,ruin:0x4e6651,top:0x86ad65,rock:0x555f4b,sun:0xe3f5b8},
 'Sunken Oasis':{sky:0x536f8d,haze:0xf2d4a0,ridge:0xbb8e6b,ruin:0x9f7956,top:0xe3c184,rock:0x977353,sun:0xffe6ab},
 'Void Cathedral':{sky:0x19162e,haze:0x8c7ea9,ridge:0x4c416b,ruin:0x4c395f,top:0x9d88b8,rock:0x4c435d,sun:0xd1beff}
};
const themes=[
 {dark:0x293d70,cloth:0x4879b5,hem:0x69abbc,point:0x84eedd,trim:0xffca79,skin:0x6399df,hair:0xffe2bf},
 {dark:0x672b43,cloth:0xb95867,hem:0xe58d80,point:0xffa177,trim:0xffd386,skin:0xda6f78,hair:0xe1d8e0},
 {dark:0x644319,cloth:0xc89330,hem:0xffce61,point:0xfff199,trim:0xffe7a1,skin:0xd2a653,hair:0xffefd3}
];
const boneTint=new THREE.Color(0xf1dfb1);
const shape={
 box:new THREE.BoxGeometry(1,1,1),
 ball:new THREE.SphereGeometry(1,12,8),
 facet:new THREE.IcosahedronGeometry(1,0),
 gem:new THREE.OctahedronGeometry(1),
 pole:new THREE.CylinderGeometry(.5,.5,1,9),
 cone:new THREE.ConeGeometry(1,1,9),
 ring:new THREE.TorusGeometry(1,.04,6,36),
 hoop:new THREE.TorusGeometry(1,.018,4,36),
 robe:new THREE.LatheGeometry([[0,0],[1,.035],[.95,.19],[.7,.64],[.66,.88],[.45,1],[0,1]].map(([r,y])=>new THREE.Vector2(r,y)),12),
 sleeve:new THREE.CylinderGeometry(.62,1,1,9),
};
const matte=new Map(),lit=new Map();
function mat(color,emissive=false){
 const pool=emissive?lit:matte;
 if(!pool.has(color))pool.set(color,emissive?new THREE.MeshBasicMaterial({color}):new THREE.MeshStandardMaterial({color,roughness:.87,flatShading:true}));
 return pool.get(color);
}
function part(parent,geometry,material,x,y,z,sx,sy=sx,sz=sx){
 const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);parent.add(mesh);return mesh;
}
function joint(parent,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g}
function wandStick(parent,from,to,r,color){
 const d=new THREE.Vector3().subVectors(to,from),mid=from.clone().lerp(to,.5);
 const m=part(parent,shape.pole,mat(color),mid.x,mid.y,mid.z,r*2,d.length(),r*2);
 m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;
}
let haloImage;
function haloTexture(){
 if(haloImage)return haloImage;
 const surface=document.createElement('canvas');surface.width=surface.height=64;
 const c=surface.getContext('2d'),grad=c.createRadialGradient(32,32,0,32,32,32);
 grad.addColorStop(0,'rgba(255,255,255,.95)');grad.addColorStop(.19,'rgba(255,255,255,.6)');grad.addColorStop(.53,'rgba(255,255,255,.16)');grad.addColorStop(1,'rgba(255,255,255,0)');
 c.fillStyle=grad;c.fillRect(0,0,64,64);haloImage=new THREE.CanvasTexture(surface);
 haloImage.colorSpace=THREE.SRGBColorSpace;return haloImage;
}
function halo(parent,color,size,x=0,y=0,z=0){
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({color,map:haloTexture(),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));
 sprite.position.set(x,y,z);sprite.scale.set(size,size,1);parent.add(sprite);return sprite;
}
function makeWizard(parent,side,outfit){
 const p=themes[side],root=joint(parent,0,0,0),pelvis=joint(root,0,7,0),chest=joint(pelvis,0,1,0);
 part(chest,shape.robe,mat(p.cloth),0,-2.4,0,4.2,9.7,5.05);
 part(chest,shape.robe,mat(p.hem),0,-2.6,0,4.27,.85,5.14);
 part(chest,shape.pole,mat(p.dark),0,1.8,0,7.2,.95,8.65);
 part(chest,shape.box,mat(p.trim),3.62,1.83,0,.45,1.38,1.88);
 // A folded travelling cape and the tails of a striped scarf swing behind the robe.
 const cape=joint(chest,-2.25,6.5,0),cloth=part(cape,shape.robe,mat(p.dark),-.85,-8.6,0,2.25,9,4.8);cloth.rotation.z=-.22;
 const scarf=joint(chest,-1.7,7.2,-1.9);
 part(scarf,shape.box,mat(p.trim),-2.9,-.19,0,6.1,.46,1.2);
 part(scarf,shape.box,mat(p.dark),-4.9,-.18,0,.65,.5,1.23);
 part(chest,shape.ball,mat(p.trim),0,7.25,0,3.15,1.05,3.4);
 const head=joint(chest,.24,9.45,0);
 part(head,shape.ball,mat(p.skin),0,.45,0,3,3.25,3.15);
 for(const sign of [-1,1]){
  part(head,shape.ball,mat(p.skin),-.3,.28,sign*3,1.05,1.25,.7);
  const eye=part(head,shape.ball,mat(0xfff5de),2.4,1,sign*1.28,1.13,1.43,1.22);
  part(head,shape.ball,mat(0x2b2331),3.38,1.08,sign*1.3,.41,.61,.48);
  part(head,shape.ball,mat(0xffffff,true),3.7,1.34,sign*1.28,.16);eye.rotation.x=sign*.13;
 }
 part(head,shape.ball,mat(p.skin),3.1,-.15,0,1.04,.82,.94);
 const beard=part(head,shape.cone,mat(p.hair),1.8,-2.52,0,2.5,4.8,2.25);beard.rotation.z=Math.PI+.22;
 for(const z of [-1,1]){const moustache=part(head,shape.ball,mat(p.hair),2.93,-1.05,z,1.05,.47,1.35);moustache.rotation.x=z*.17}
 const hat=costume(head,chest,outfit),legs=[],arms=[];
 for(const sign of [-1,1]){
  const hip=joint(pelvis,0,-.7,sign*2.2);
  part(hip,shape.pole,mat(p.dark),0,-1.8,0,1.85,3.8,2.1);
  const knee=joint(hip,0,-3.15,0);part(knee,shape.pole,mat(0x735146),0,-1,0,1.9,2.55,2.15);
  part(knee,shape.ball,mat(0x4d3b41),.98,-1.85,0,2.4,.84,1.45);legs.push({hip,knee});
  const shoulder=joint(chest,.1,5.4,sign*3.35);
  part(shoulder,shape.sleeve,mat(p.cloth),0,-1.9,0,1.55,4.2,1.72);
  const elbow=joint(shoulder,0,-3.81,0);
  part(elbow,shape.sleeve,mat(p.hem),0,-1.58,0,1.05,3.45,1.18);
  const hand=joint(elbow,0,-3.46,0);part(hand,shape.ball,mat(p.skin),0,0,0,1.18,1.34,1.28);
  arms.push({shoulder,elbow,hand});
 }
 const wand=joint(arms[1].hand,0,0,0);
 wandStick(wand,new THREE.Vector3(-.4,-9,0),new THREE.Vector3(.2,9.6,0),.48,0x6b4b45);
 for(let i=0;i<3;i++){const a=i*TAU/3;wandStick(wand,new THREE.Vector3(.15,8.6,0),new THREE.Vector3(Math.cos(a)*1.48,10.65,Math.sin(a)*1.48),.25,p.trim)}
 const crystal=part(wand,shape.gem,mat(p.point,true),.16,11.3,0,1.16,2.05,1.16);
 const light=halo(wand,p.point,8,.16,11.3,0);
 const shield=part(root,shape.ball,new THREE.MeshStandardMaterial({color:p.point,transparent:true,opacity:.18,depthWrite:false,metalness:.25,roughness:.15}),0,13,0,10.5,17,10.5);
 shield.visible=false;
 const wisps=joint(root,0,13,0),wispMat=new THREE.MeshBasicMaterial({color:p.point});wisps.visible=false;
 for(let i=0;i<5;i++)part(wisps,shape.gem,wispMat,0,0,0,.52,.9,.52);
 const gauge=joint(parent,0,0,0);
 part(gauge,shape.box,mat(0x252435,true),0,0,0,12,1.4,.18);
 const hpBar=part(gauge,shape.box,mat(side===2?0xffce61:side?0xffa695:0x8ef3e3,true),0,0,.13,11.4,.8,.13);
 const grounding=part(parent,new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0x282537,map:haloTexture(),transparent:true,opacity:.59,depthWrite:false}),0,0,0,21,17,1);grounding.rotation.x=-Math.PI/2;
 return {p,side,outfit,root,pelvis,chest,head,hat,cape,scarf,legs,arms,wand,crystal,light,shield,grounding,wisps,wispMat,gauge,hpBar};
}
function updateArmament(r,p,time){
 const weapon=p.weapon,model=meleeModels.get(weapon?.id);
 r.wand.visible=!model;
 if(r.held)r.held.visible=false;
 if(!model)return;
 r.armory??=new Map();
 let grip=r.armory.get(model.form);
 if(!grip){
  grip=joint(r.arms[1].hand,0,0,0);r.armory.set(model.form,grip);
  const metal=mat(model.tint,true),shaft=mat(0x493953);
  part(grip,shape.pole,shaft,0,2,0,1.4,8,1.4);
  switch(model.form){
   case 'knife':case 'rapier':{
    const length=model.form==='knife'?8:18;
    part(grip,shape.box,metal,0,5,0,5,.8,1);
    part(grip,shape.gem,metal,0,5+length/2,0,model.form==='knife'?1.8:1,length/2,.65);break;}
   case 'hammer':part(grip,shape.box,metal,0,8,0,10,5,5);break;
   case 'axe':part(grip,shape.gem,metal,2.2,8,0,4.8,5,1.3);break;
   case 'scythe':
    part(grip,shape.pole,shaft,0,8,0,1.1,13,1.1);
    part(grip,shape.gem,metal,4,14,0,6,1.8,.8);
    part(grip,shape.cone,metal,9,12.5,0,1.3,5,.8).rotation.z=-2.7;break;
  }
 }
 r.held=grip;grip.visible=true;
 const progress=clamp((time-weapon.swing)/model.delay,0,1);
 const stroke=weapon.swing<0?0:Math.sin(progress*Math.PI);
 r.arms[1].shoulder.rotation.z+=stroke*1.35;
 grip.rotation.z=-.6-stroke*1.6;grip.rotation.y=stroke*(model.form==='scythe'?2:.7);
}
function animateWizard(r,p,time,index,cast,matchTime){
 const moving=clamp(Math.hypot(p.vx||0,p.vz||0)/120,0,1),air=Math.abs(p.vy||0)>25,beat=time*10+index*1.9,sw=Math.sin(time*2.1+index),pitch=clamp(p.aim||0,-1.1,1.1);
 r.root.position.set(p.x,HEIGHT-p.y,p.z);r.root.rotation.y=-(p.yaw||0);
 r.pelvis.position.y=7+Math.abs(Math.sin(beat))*moving*.7+sw*.12;
 r.chest.rotation.set(sw*.065+Math.cos(beat)*.08*moving,.1*sw,-moving*.17+.13*cast);
 r.head.rotation.set(-sw*.12,-r.chest.rotation.y*.6,-pitch*.46-r.chest.rotation.z*.65);
 r.hat.rotation.x=sw*.07+Math.sin(beat-.48)*.12*moving;r.hat.rotation.z=.04*Math.sin(time*2.1-.7);
 r.cape.rotation.z=-moving*.5+.085*Math.sin(time*3+index);r.scarf.rotation.z=.16+.15*Math.sin(time*3.7+index)+moving*.22;
 for(let i=0;i<2;i++){
  const flip=i?1:-1,g=Math.sin(beat)*flip*moving,{hip,knee}=r.legs[i];
  hip.rotation.z=air?(i?.58:-.35):g*.73;knee.rotation.z=air?-.79:-Math.max(0,-g)*.85;
  hip.rotation.x=flip*(.12+Math.abs(g)*.05);
 }
 const left=r.arms[0],right=r.arms[1];
 left.shoulder.rotation.set(.28+cast*.4,0,.18+Math.sin(beat)*moving*.66+cast*.48);
 left.elbow.rotation.z=.35+cast*.3;
 right.shoulder.rotation.set(-.25,0,.31+cast*(.88-.46*pitch));right.elbow.rotation.z=.54+cast*.18;
 r.wand.rotation.z=-right.shoulder.rotation.z-right.elbow.rotation.z-.13-cast*(1.14+pitch*.45);
 updateArmament(r,p,matchTime);
 r.crystal.rotation.y=time*2;r.light.material.opacity=.4+cast*.45;
 const st=p.statuses||{};
 r.light.scale.setScalar(7+cast*7+Math.sin(time*6)*.6);r.shield.visible=p.shield>0||st.prism>0||st.reflect>0||st.phased>0;
 r.shield.material.color.set(st.polar>0?0x80edff:st.capacitor>0?0xffe85a:(st.prism>0||st.reflect>0)?0xd6a2ff:r.p.point);
 r.shield.material.opacity=.14+.04*Math.sin(time*6);
 r.wisps.visible=p.store>=0||st.burn>0||st.regen>0;
 if(r.wisps.visible){
  r.wispMat.color.setHex(st.burn>0?0xff9a51:st.regen>0?0x92ffb9:0x8febff);
  r.wisps.children.forEach((m,i)=>{const a=time*3+i*TAU/5;m.position.set(Math.cos(a)*6.7,Math.sin(a*2)*4,Math.sin(a)*6.7);m.rotation.y=a});
 }
}
function scenery(scene){
 const sky=new THREE.Mesh(new THREE.SphereGeometry(1900,32,18),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,uniforms:{zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()}},
  vertexShader:'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`varying vec3 dir;uniform vec3 zenith;uniform vec3 horizon;
  void main(){vec3 d=normalize(dir);float f=smoothstep(-.1,.75,d.y);vec3 col=mix(horizon,zenith,f);
  float s=max(dot(d,normalize(vec3(-.65,.35,-.5))),0.);col+=vec3(1.,.77,.45)*(.21*pow(s,32.)+.43*pow(s,240.)+.75*smoothstep(.9988,.9993,s));gl_FragColor=vec4(col,1.);
  #include <colorspace_fragment>
  }`
 }));sky.renderOrder=-20;scene.add(sky);
 const peaks=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),new THREE.MeshStandardMaterial({roughness:1,flatShading:true}),54);
 const obj=new THREE.Object3D(),tint=new THREE.Color();
 scene.add(peaks);
 const ruins=new THREE.Group(),brick=new THREE.MeshStandardMaterial({roughness:.98,flatShading:true});
 const towers=[[-192,-98,1.25],[200,-285,.9],[844,-236,1.25],[1130,9,1],[320,740,.95]];
 for(const [x,z,s] of towers){
  const root=joint(ruins,x,19,z);root.scale.setScalar(s);
  part(root,shape.pole,brick,0,52,0,53,106,53);part(root,shape.pole,brick,0,107,0,64,12,64);
  for(let i=0;i<8;i++){const a=i*TAU/8;part(root,shape.box,brick,Math.cos(a)*27,118,Math.sin(a)*27,12,15,11).rotation.y=-a}
 }
 scene.add(ruins);
 let titleLayout;
 function layout(demo){
  if(titleLayout===demo)return;titleLayout=demo;
  const halfX=X*TILE/2,halfZ=Z*TILE/2;
  for(let i=0;i<54;i++){
   const a=i*TAU/54,dx=Math.cos(a),dz=Math.sin(a),h=160+noise(i+19)*230;
   // The whole mountain base sits outside the playable rectangle.
   const distance=(demo?850:Math.min((halfX+370)/Math.abs(dx),(halfZ+370)/Math.abs(dz)))+noise(i+4)*200;
   obj.position.set((demo?480:halfX)+dx*distance,h/2-47,(demo?192:halfZ)+dz*distance);
   obj.scale.set(160+noise(i+90)*160,h,125+noise(i+52)*150);obj.rotation.set(0,noise(i+8)*TAU,0);obj.updateMatrix();peaks.setMatrixAt(i,obj.matrix);
   tint.setScalar(.66+.32*noise(i));peaks.setColorAt(i,tint);
  }
  peaks.instanceMatrix.needsUpdate=true;peaks.instanceColor.needsUpdate=true;peaks.computeBoundingSphere();
  for(let i=0;i<towers.length;i++){const [x,z]=towers[i];ruins.children[i].position.set(demo?x:x*X*TILE/960,19,demo?z:z*Z*TILE/384)}
 }
 const stars=new Float32Array(390*3);
 for(let i=0;i<390;i++){
  const y=.09+noise(i+1)*.84,a=noise(i+522)*TAU,r=Math.sqrt(1-y*y);
  stars[i*3]=r*Math.cos(a)*1600;stars[i*3+1]=y*1600;stars[i*3+2]=r*Math.sin(a)*1600;
 }
 const points=new THREE.BufferGeometry();points.setAttribute('position',new THREE.BufferAttribute(stars,3));
 const glitter=new THREE.Points(points,new THREE.PointsMaterial({color:0xfff4d4,size:2.8,transparent:true,opacity:.78,sizeAttenuation:true,fog:false,depthWrite:false}));scene.add(glitter);
 return {sky,glitter,layout,update(p){sky.material.uniforms.zenith.value.setHex(p.sky);sky.material.uniforms.horizon.value.setHex(p.haze);peaks.material.color.setHex(p.ridge);brick.color.setHex(p.ruin)}};
}
function makeTitle(parent){
 const stage=new THREE.Group();parent.add(stage);
 // The broken bridge is a separate title set, with chipped voussoirs and tiled parapets.
 const layout=[];
 for(let x=-14;x<=14;x++)for(let z=-3;z<=3;z++){
  if(Math.abs(x)<=2&&Math.abs(z)<3)continue;
  for(let y=0;y<Math.min(4,Math.abs(x)-1);y++){
   if(y>0&&Math.abs(x)<5&&noise((x+22)*101+z*3+y)>.6)continue;
   layout.push([x*12,-6-y*12,z*12]);
  }
  if(z===-3&&x%3!==0&&Math.abs(x)>3)layout.push([x*12,5,z*12]);
 }
 const blocks=new THREE.InstancedMesh(shape.box,new THREE.MeshStandardMaterial({roughness:.94}),layout.length),o=new THREE.Object3D(),color=new THREE.Color();
 for(let i=0;i<layout.length;i++){
  o.position.fromArray(layout[i]);o.scale.set(11.83,11.72,11.86);o.updateMatrix();blocks.setMatrixAt(i,o.matrix);
  color.setHex(layout[i][1]>=-6?0xb3a39a:0x756a80).multiplyScalar(.83+.19*noise(i));blocks.setColorAt(i,color);
 }
 stage.add(blocks);stage.position.set(480,120,192);
 return stage;
}
const CHUNK=16,chunkWidth=CHUNK*TILE,chunkCols=Math.ceil(X/CHUNK),chunkRows=Math.ceil(Z/CHUNK);
const faces=[
 {n:[1,0,0],v:[1,0,0, 1,1,0, 1,1,1, 1,0,1]}, {n:[-1,0,0],v:[0,0,1, 0,1,1, 0,1,0, 0,0,0]},
 {n:[0,1,0],v:[0,1,1, 1,1,1, 1,1,0, 0,1,0]}, {n:[0,-1,0],v:[0,0,0, 1,0,0, 1,0,1, 0,0,1]},
 {n:[0,0,1],v:[0,0,1, 1,0,1, 1,1,1, 0,1,1]}, {n:[0,0,-1],v:[1,0,0, 0,0,0, 0,1,0, 1,1,0]}
];
const bitCounts=Uint8Array.from({length:64},(_,i)=>i.toString(2).replaceAll('0','').length);
function chunkSurface(tiles,xc,zc,palette,masks){
 const x0=xc*CHUNK,z0=zc*CHUNK,x1=Math.min(X,x0+CHUNK),z1=Math.min(Z,z0+CHUNK),layer=X*Y;
 let count=0,slot=0;
 for(let z=z0;z<z1;z++)for(let y=0;y<Y;y++)for(let x=x0;x<x1;x++){
  const i=x+X*y+layer*z;let mask=0;
  if(tiles[i]){
   if(x===X-1||!tiles[i+1])mask|=1;if(x===0||!tiles[i-1])mask|=2;
   if(y===0||!tiles[i-X])mask|=4;if(y===Y-1||!tiles[i+X])mask|=8;
   if(z===Z-1||!tiles[i+layer])mask|=16;if(z===0||!tiles[i-layer])mask|=32;
  }
  masks[slot++]=mask;count+=bitCounts[mask];
 }
 if(!count)return null;
 const position=new Float32Array(count*12),normal=new Int8Array(count*12),color=new Uint8Array(count*12),uv=new Uint8Array(count*8);
 const index=count*4>65535?new Uint32Array(count*6):new Uint16Array(count*6);
 const top=new THREE.Color(palette.top),stone=new THREE.Color(palette.rock);
 let quad=0;slot=0;
 for(let z=z0;z<z1;z++)for(let y=0;y<Y;y++)for(let x=x0;x<x1;x++){
  const mask=masks[slot++];if(!mask)continue;
  const i=x+X*(y+Y*z),hp=tiles[i],tint=(.87+((i*13+(i>>3)*7)%43)/43*.14)*(hp<8?.68:hp<14?.84:1);
  for(let f=0;f<6;f++){
   if(!(mask&(1<<f)))continue;
   const {n,v}=faces[f],base=(hp&128)?boneTint:f===2?top:stone,r=Math.round(base.r*tint*255),g=Math.round(base.g*tint*255),b=Math.round(base.b*tint*255),k=quad*4;
   for(let j=0;j<4;j++){
    const a=(k+j)*3,j3=j*3;position[a]=(x+v[j3])*TILE;position[a+1]=HEIGHT+(v[j3+1]-y-1)*TILE;position[a+2]=(z+v[j3+2])*TILE;
    normal[a]=n[0]*127;normal[a+1]=n[1]*127;normal[a+2]=n[2]*127;color[a]=r;color[a+1]=g;color[a+2]=b;
    uv[(k+j)*2]=j===1||j===2?255:0;uv[(k+j)*2+1]=j>=2?255:0;
   }
   const ii=quad*6;index[ii]=k;index[ii+1]=k+1;index[ii+2]=k+2;index[ii+3]=k;index[ii+4]=k+2;index[ii+5]=k+3;quad++;
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.BufferAttribute(position,3));geo.setAttribute('normal',new THREE.BufferAttribute(normal,3,true));
 geo.setAttribute('color',new THREE.BufferAttribute(color,3,true));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2,true));geo.setIndex(new THREE.BufferAttribute(index,1));
 geo.boundingSphere=new THREE.Sphere(new THREE.Vector3((x0+x1)*TILE/2,HEIGHT/2,(z0+z1)*TILE/2),Math.hypot((x1-x0)*TILE,HEIGHT,(z1-z0)*TILE)/2);
 return geo;
}
function makeTerrain(scene){
 const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=32;
 const c=textureCanvas.getContext('2d');c.fillStyle='#d7d7d7';c.fillRect(0,0,32,32);c.fillStyle='#fff';c.fillRect(1,1,30,30);
 const map=new THREE.CanvasTexture(textureCanvas);map.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:.97});
 const chunks=new Map(),masks=new Uint8Array(CHUNK*CHUNK*Y),radius=5,queue=[];
 let previousTiles=null,previousPalette=null,lastX=-1,lastZ=-1,lastRevision=-1;
 function discard(chunk){if(chunk.mesh){scene.remove(chunk.mesh);chunk.mesh.geometry.dispose()}}
 return (state,p,camera)=>{
  if(previousTiles!==state.tiles||previousPalette!==p){
   for(const chunk of chunks.values())discard(chunk);
   chunks.clear();lastX=-1;previousTiles=state.tiles;previousPalette=p;
  }
  const cx=clamp(Math.floor(camera.position.x/chunkWidth),0,chunkCols-1),cz=clamp(Math.floor(camera.position.z/chunkWidth),0,chunkRows-1);
  if(lastX===cx&&lastZ===cz&&lastRevision===state.terrainVersion)return;
  for(const [key,chunk] of chunks)if(Math.hypot(chunk.x-cx,chunk.z-cz)>radius+1){discard(chunk);chunks.delete(key)}
  queue.length=0;
  for(let z=Math.max(0,cz-radius);z<=Math.min(chunkRows-1,cz+radius);z++)for(let x=Math.max(0,cx-radius);x<=Math.min(chunkCols-1,cx+radius);x++){
   const distance=(x-cx)**2+(z-cz)**2;if(distance>radius*radius)continue;
   const key=x+chunkCols*z,version=state.changedChunks?.get(key)||0,old=chunks.get(key);
   if(old&&old.version===version)continue;
   queue.push({key,x,z,version,priority:distance-(old?.mesh?2:0)});
  }
  queue.sort((a,b)=>a.priority-b.priority);
  // Complete the camera's neighborhood first. Empty cells and distant chunks can wait for another frame.
  const start=performance.now();
  for(let i=0;i<queue.length;i++){
   const chunk=queue[i],old=chunks.get(chunk.key);if(old)discard(old);
   const geo=chunkSurface(state.tiles,chunk.x,chunk.z,p,masks);
   if(geo){chunk.mesh=new THREE.Mesh(geo,material);scene.add(chunk.mesh)}
   chunks.set(chunk.key,chunk);
   if(i+1<queue.length&&(performance.now()-start>2.5||i>=5)){lastX=-1;return}
  }
  lastX=cx;lastZ=cz;lastRevision=state.terrainVersion;
 };
}
function makeFamiliars(scene){
 const creatureModels=makeSpellModels({joint,part,shape,mat});
 const pools=new Map(),palette={'imp-furnace':0xff9634,'fire-imp':0xff7b22,'purple-wurm':0xb983ef,'void-entity':0x9a8bff,squire:0xc5f399,archer:0xba8eff,wraith:0x78ffdc,ember:0xff914f,frost:0xa3edff,medic:0x9bffad,bastion:0xbeb0ff,storm:0xffdc66,burrow:0xf1c497};
 function create(kind){
  const root=joint(scene,0,0,0),body=joint(root,0,0,0),glow=mat(palette[kind],true),fins=[];
  const badge=part(body,shape.ring,mat(0x8febff,true),0,-3.7,0,2.05);badge.rotation.x=Math.PI/2;
  switch(kind){
   case 'imp-furnace':case 'fire-imp':{
    const creature=joint(body,0,0,0);creature.scale.setScalar(kind==='imp-furnace'?19:10);
    creature.rotation.y=Math.PI/2;
    body.userData.pose=creatureModels[kind](creature);break;
   }
   case 'purple-wurm':case 'void-entity':{
    const creature=joint(body,0,0,0);creature.scale.setScalar(kind==='purple-wurm'?42:19);
    body.userData.pose=creatureModels[kind](creature);break;
   }
   case 'squire':case 'archer':case 'wraith':{
    const bone=mat(0xe1d4ae),shade=mat(0x293348);
    part(body,shape.ball,bone,0,5,0,2.5,2.45,2.4);
    part(body,shape.box,bone,1.2,3.1,0,2.8,.7,3);
    for(let tooth=-2;tooth<=2;tooth++)part(body,shape.box,mat(0xa5967b),2.65,3.15,tooth*.48,.1,.5,.16);
    for(const sign of [-1,1]){
     part(body,shape.ball,shade,2,5.3,sign, .68,.82,.82);
     part(body,shape.ball,glow,2.58,5.35,sign,.28);
    }
    if(kind==='wraith'){
     part(body,shape.cone,mat(0x293e59),-.75,.5,0,4.3,8,4);
     part(body,shape.ball,mat(0x293e59),-.8,5.5,0,2.7,3,2.9);
     for(let j=0;j<5;j++)part(body,shape.gem,glow,-1,-3-j*.5,(j-2)*.8,.25,2.5,.35);
     for(const side of [-1,1]){const tail=joint(body,-1,-2,side*2);part(tail,shape.gem,glow,-1,-2,0,.62,3,.6);fins.push(tail)}
    }else{
     part(body,shape.pole,bone,0,.2,0,.85,6,.85);
     for(const y of [0,1.2,2.4])part(body,shape.ring,bone,0,y,0,1.5,2.25,1).rotation.x=Math.PI/2;
     for(const side of [-1,1]){
      const leg=joint(body,0,-2,side);part(leg,shape.pole,bone,0,-2.2,0,.8,4.5,.8);part(leg,shape.ball,bone,.6,-4.4,0,1.2,.5,.7);fins.push(leg);
      part(body,shape.pole,bone,1,1,side*2.4,.75,3,.75).rotation.z=.5;
     }
     const weapon=joint(body,1,1,2.4);body.userData.weapon=weapon;
     if(kind==='squire'){part(body,shape.gem,mat(0x58677a),0,2.9,0,2.1,.8,2.5);part(body,shape.gem,mat(0x647b8a),1,0,-2.8,.5,2.9,2.1);part(weapon,shape.gem,mat(0xa3bbb9),2.8,2.3,2.6,.8,4.6,.45);part(weapon,shape.box,bone,2.8,-.3,2.6,2.3,.55,.7)}
     else{part(body,shape.box,mat(0x6e4a43),-1.8,1,-1.6,1.3,5,1.5);part(weapon,shape.hoop,mat(0xa78063),2.3,1,2.7,1.5,4,.8);part(weapon,shape.box,bone,2.3,1,2.7,.16,8,.16)}
    }
    return {root,body,fins,badge};
   }
   case 'ember':{
    part(body,shape.ball,mat(0xc95c35),0,0,0,4.4,2.8,2.8);part(body,shape.ball,mat(0xff9c55),2.7,1.2,0,2.3,2.6,2.45);
    for(let i=0;i<3;i++){const spike=part(body,shape.cone,glow,1.6-i*2.15,3.15-i*.35,0,.85,2.8,1.12);spike.rotation.z=.45}
    const tail=joint(body,-3.1,0,0);part(tail,shape.gem,glow,-2.2,.28,0,3.52,1.35,1.3);fins.push(tail);break;
   }
   case 'frost':{
    part(body,shape.gem,mat(0x608ec6),0,0,0,3.7,1.6,1.45);part(body,shape.facet,mat(0x93d9ec),2.7,.5,0,1.75);
    for(const side of [-1,1]){
     const wing=joint(body,0,.7,side);fins.push(wing);
     const front=part(wing,shape.gem,mat(0x7eccf0),.65,1,side*2.43,3.75,.45,3.6);front.rotation.y=-side*.43;
     part(wing,shape.gem,glow,-2.2,.66,side*1.96,2.2,.4,2.6);
    }break;
   }
   case 'medic':{
    part(body,shape.ball,mat(0x69cb94),0,.7,0,3.7,3,3.35);part(body,shape.ring,glow,0,2.85,0,3.2).rotation.x=Math.PI/2;
    part(body,shape.box,mat(0xfffbe1,true),3.55,1.2,0,.3,2.17,.7);part(body,shape.box,mat(0xfffbe1,true),3.56,1.2,0,.32,.7,2.04);
    for(let i=0;i<4;i++){const a=i*TAU/4,leg=joint(body,Math.cos(a)*1.65,-1.32,Math.sin(a)*1.65);part(leg,shape.gem,glow,0,-1.61,0,.51,2.13,.51);fins.push(leg)}break;
   }
   case 'bastion':{
    part(body,shape.facet,mat(0x7c6d9e),-.6,0,0,4.6,3.9,3.9);part(body,shape.ball,mat(0xb5b79e),3.38,-.21,0,2.45,1.75,2.03);
    for(const side of [-1,1]){part(body,shape.gem,glow,-.2,1.12,side*2.88,1.72,1.9,.7);
     const flipper=joint(body,.45,-1.24,side*2.85);part(flipper,shape.facet,mat(0xa0aa96),.85,-.25,side*1.14,1.82,.7,1.95);fins.push(flipper)}
    part(body,shape.facet,mat(0xe2bd89),-.76,3,0,2.7,1.28,2.5);break;
   }
   case 'storm':{
    part(body,shape.ball,mat(0x8587b4),0,.5,0,3.65,2.35,2.7);
    for(const side of [-1,1])part(body,shape.ball,mat(0xb6aecb),.35,.37,side*1.95,2.51,1.63,1.82);
    for(const [x,y,angle] of [[-.55,-1.92,.35],[-.3,-3.1,-.85],[-.13,-4.2,.41]])part(body,shape.box,glow,x,y,0,1.07,1.94,1.02).rotation.z=angle;
    const ring=part(body,shape.ring,glow,0,.6,0,4.75);fins.push(ring);break;
   }
   case 'burrow':{
    part(body,shape.ball,mat(0x846457),0,0,0,3.7,2.65,2.8);part(body,shape.ball,mat(0xba876b),2.43,.48,0,2.45,2.25,2.06);
    const drill=joint(body,4.2,.13,0);part(drill,shape.cone,mat(0xe0be83),1.27,0,0,1.59,3.8,1.59).rotation.z=-Math.PI/2;fins.push(drill);
    for(const side of [-1,1]){const claw=joint(body,.42,-.55,side*2.13);part(claw,shape.ball,mat(0xc5a184),.9,0,side*.65,2.58,.75,1.3);fins.push(claw)}break;
   }
  }
  for(const sign of kind==='void-entity'?[]:[-1,1]){
   const x=kind==='bastion'?4.7:kind==='medic'?2.15:kind==='storm'?2.67:kind==='frost'?3.51:3.73;
   const z=kind==='medic'?2.45:1.43;
   part(body,shape.ball,mat(0xfff5da),x,1.05,sign*z,.62,.74,.6);
   part(body,shape.ball,mat(0x1e2535),x+.42,1.1,sign*(z+.15),.26,.39,.28);
  }
  return {root,body,fins,badge};
 }
 return (familiars,players,t,camera)=>{
  for(const pool of pools.values())pool.used=0;
  for(const f of familiars){
   if(f.hp<=0||!(f.kind in palette))continue;
   if(!pools.has(f.kind))pools.set(f.kind,{used:0,rigs:[]});const pool=pools.get(f.kind),i=pool.used++;
   const rig=pool.rigs[i]??(pool.rigs[i]=create(f.kind)),phase=t*4+(f.id||0)*1.89;
   const support=f.kind==='medic'||f.kind==='bastion';
   let yaw=f.yaw;
   if(!Number.isFinite(yaw)){let closest=Infinity;yaw=0;
    for(const p of players){if(p.hp<=0||(p.side===f.side)!==support)continue;const dx=p.x-f.x,dz=p.z-f.z,d=dx*dx+dz*dz;if(d<closest){closest=d;yaw=Math.atan2(dz,dx)}}}
   const skeletal=f.kind==='squire'||f.kind==='archer';
   rig.root.visible=true;
   rig.root.position.set(f.x,HEIGHT-f.y+8+(skeletal?Math.abs(Math.sin(phase*2))*.5*Math.min(1,(f.walkSpeed||0)/60):Math.sin(phase)*1.3),f.z);
   if(rig.lastId!==f.id){rig.root.rotation.y=-yaw;rig.lastId=f.id}
   const turn=-yaw-rig.root.rotation.y;
   rig.root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*.22;
   rig.root.scale.setScalar(f.monster?2.15:1);
   rig.root.position.y+=f.monster?4:0;
   if(!rig.health){
    rig.health=joint(rig.root,0,9,0);part(rig.health,shape.box,mat(0x282538,true),0,0,0,9,1,.2);
    rig.fill=part(rig.health,shape.box,mat(0xff8273,true),0,0,.15,8.7,.7,.15);
   }
   rig.health.visible=f.hp<f.maxHp;
   if(rig.health.visible){
    rig.health.rotation.y=yaw;rig.health.quaternion.multiply(camera.quaternion);
    const ratio=f.hp/f.maxHp;rig.fill.scale.x=8.7*ratio;rig.fill.position.x=4.35*(ratio-1);
   }
   rig.body.userData.pose?.(t);rig.body.rotation.z=f.kind==='purple-wurm'?(((f.time||0)%5)>3.3?Math.sin(((f.time||0)%5-3.3)/1.7*Math.PI)*.75:0):Math.sin(phase*.6)*.09;rig.badge.material=mat(f.side===2?0xffce61:f.side?0xff9d93:0x8febff,true);
   if(skeletal){
    rig.fins.forEach((leg,j)=>{leg.rotation.set(0,0,Math.sin(phase*2+j*Math.PI)*.65*Math.min(1,(f.walkSpeed||0)/70))});
    const attack=clamp(((f.time||0)-(f.attackAt??-10))/.55,0,1);
    rig.body.userData.weapon.rotation.z=f.kind==='squire'?Math.sin(attack*Math.PI)*-1.5:Math.sin(attack*Math.PI)*.25;
   }else if(f.kind==='frost'||f.kind==='bastion')rig.fins.forEach((fin,j)=>{fin.rotation.x=(j?1:-1)*Math.sin(phase*(f.kind==='frost'?2.8:1.1))*.57});
   else if(f.kind==='storm')rig.fins[0].rotation.set(.9,phase,phase*.27);
   else if(f.kind==='burrow'){rig.fins[0].rotation.x=phase*2;rig.fins[1].rotation.z=Math.sin(phase)*.4;rig.fins[2].rotation.z=-Math.sin(phase)*.4}
   else rig.fins.forEach((fin,j)=>{fin.rotation.y=Math.sin(phase+j)*.34;fin.rotation.z=Math.cos(phase+j)*.17});
  }
  for(const pool of pools.values())for(let i=pool.used;i<pool.rigs.length;i++)pool.rigs[i].root.visible=false;
 };
}
function makeSpellParts(scene){
 const models=makeSpellModels({joint,part,shape,mat});
 const effects=[],zones=[];
 const buildProjectile=makeProjectileArt(THREE),projectiles=new Map();
 function paintShots(shots,time){
  for(const pool of projectiles.values())pool.used=0;
  for(const shot of shots){
   const style=shot.style||'witchspark';
   let pool=projectiles.get(style);
   if(!pool){pool={used:0,models:[]};projectiles.set(style,pool)}
   let model=pool.models[pool.used];
   if(!model){if(models[style]){
     const root=new THREE.Group(),body=joint(root,0,0,0);models[style](body);
     body.rotation.z=Math.PI/2;body.scale.setScalar(2);
     model={root,animate(time){body.rotation.y=style==='pinball-furnace'?time*6:0}};
    }else model=buildProjectile(style);pool.models.push(model);scene.add(model.root)}
   pool.used++;
   model.root.visible=true;
   model.root.position.set(shot.x,HEIGHT-shot.y,shot.z);
   model.root.scale.setScalar(clamp(shot.r||3,1,35));
   v.set(shot.vx||0,-(shot.vy||0),shot.vz||0);
   if(v.lengthSq()>0)model.root.quaternion.setFromUnitVectors(up,v.normalize());
   model.animate(time);
  }
  for(const pool of projectiles.values())for(let i=pool.used;i<pool.models.length;i++)pool.models[i].root.visible=false;
 }
 const propKinds=new Set(['cleave','shears','bell','valve','firewheel','fissure']);
 function buildProp(root,kind){
  const g=joint(root,0,0,0),metal=mat(0xbacbd7),brass=mat(0xd99746),fire=mat(0xff9148,true);
  if(models[kind]){g.userData.pose=models[kind](g);return g}
  if(kind==='cleave'){
   part(g,shape.gem,mat(0xe62046,true),0,0,0,1,.046,.027);
   part(g,shape.gem,mat(0xffe1dc,true),.06,.013,0,.94,.018,.032);
  }else if(kind==='shears'){
   g.userData.arms=[];
   const outline=new THREE.Shape();
   outline.moveTo(-.03,-.1);outline.lineTo(1.15,0);outline.lineTo(.15,.17);outline.lineTo(-.03,.1);outline.closePath();
   const blade=new THREE.ExtrudeGeometry(outline,{depth:.035,bevelEnabled:false});
   for(const sign of [-1,1]){
    const arm=joint(g,0,sign*.035,0);g.userData.arms.push(arm);
    part(arm,blade,metal,0,0,0,1).rotation.x=sign*Math.PI/2;
    part(arm,shape.box,brass,-.17,0,0,.36,.075,.085);
    part(arm,shape.ring,brass,-.48,0,-sign*.08,.27,.18,.8).rotation.x=Math.PI/2;
   }
   part(g,shape.pole,brass,0,.05,0,.17,.2,.17);
  }else if(kind==='bell'){
   part(g,shape.sleeve,brass,0,0,0,.74,1,.74);
   part(g,shape.ring,brass,0,-.48,0,.8).rotation.x=Math.PI/2;
   part(g,shape.ball,metal,0,-.6,0,.18);
   part(g,shape.ring,brass,0,.56,0,.22);
  }else if(kind==='fissure'){
   for(let k=0;k<5;k++){
    const slab=part(g,shape.gem,k%2?fire:mat(0x663e37),(k-2)*.42,-.12,(k%2)*.18,.38,.52,.14);
    slab.rotation.z=(k%2-.5)*.8;
   }
  }else{
   const wheel=kind==='firewheel';
   part(g,shape.ring,wheel?fire:brass,0,0,0,.8).rotation.x=Math.PI/2;
   for(let k=0;k<3;k++)part(g,shape.box,brass,0,0,0,1.6,.08,.08).rotation.y=k*Math.PI/3;
   if(!wheel){
    part(g,shape.pole,metal,0,-.4,0,.34,.8,.34);
    for(let k=0;k<5;k++)part(g,shape.ball,mat(0xcae9ed),.3+k*.25,.12*k,.09*Math.sin(k),.12+k*.05);
   }
  }
  return g;
 }
 function burst(){
  const root=joint(scene,0,0,0),m=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false}),ring=part(root,shape.hoop,m,0,0,0,1),beads=[];
  for(let i=0;i<5;i++)beads.push(part(root,shape.gem,m,0,0,0,1));return {root,m,ring,beads};
 }
 function field(){
  const root=joint(scene,0,0,0),m=new THREE.MeshBasicMaterial({transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide});
  const dome=part(root,new THREE.SphereGeometry(1,24,12),m,0,0,0,1);
  const edge=new THREE.MeshBasicMaterial({transparent:true,opacity:.77,depthWrite:false});
  part(root,shape.hoop,edge,0,0,0,1).rotation.x=Math.PI*.5;
  const ring=part(root,shape.hoop,edge,0,0,0,.85);ring.rotation.x=Math.PI*.5;return {root,m,edge,dome,ring};
 }
 function each(list,pool,create,cb){
  for(let i=0;i<list.length;i++){if(!pool[i])pool[i]=create();pool[i].root.visible=true;cb(list[i],pool[i],i)}
  for(let i=list.length;i<pool.length;i++)pool[i].root.visible=false;
 }
 const v=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),sColor=new THREE.Color();
 function color(s){return sColor.set(s.color||'#f7c779')}
 return (shots,bursts,fields,t,camera)=>{
  paintShots(shots,t);
  each(bursts,effects,burst,(e,b,i)=>{
   const life=clamp(e.life/(e.maxLife||.45),0,1),r=Math.max(1,e.r||10)*(1-life*.75);b.root.position.set(e.x,HEIGHT-e.y,e.z);
   b.props??=new Map();
   for(const prop of b.props.values())prop.visible=false;
   const special=propKinds.has(e.kind)||!!models[e.kind];
   b.ring.visible=!special;b.beads.forEach(mesh=>mesh.visible=!special);
   if(special){
    if(!b.props.has(e.kind))b.props.set(e.kind,buildProp(b.root,e.kind));
    const prop=b.props.get(e.kind);prop.visible=true;prop.scale.setScalar(e.r*Math.min(1,life*5));
    prop.rotation.set(0,-(e.yaw||0),-(e.pitch||0),'YXZ');
    if(models[e.kind]&&!e.kind.endsWith('-cone-stream'))prop.rotation.y-=Math.PI/2; // Show the silhouette across the aim line.
    if(typeof prop.userData.pose==='function')prop.userData.pose(1-life);
    if(e.kind==='shears')prop.userData.arms.forEach((arm,k)=>arm.rotation.y=(k?1:-1)*(.02+.57*Math.max(0,(life-.38)/.62)));
    if(e.kind==='bell')prop.rotation.z=.32*Math.sin(life*9);
    if(e.kind==='firewheel')prop.rotation.y+=life*2;
    return;
   }
   b.m.color.copy(color(e));b.m.opacity=life*.85;b.ring.scale.setScalar(r);b.ring.quaternion.copy(camera.quaternion);
   b.beads.forEach((m,j)=>{const a=j*TAU/5+i;m.position.set(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2)*r*.5);m.scale.setScalar(Math.max(.01,life*r*.09))});
  });
  each(fields,zones,field,(z,b,i)=>{
   if(models[z.style]||['marsh','wind','lantern','clock','embers','cleaver-shrine','throne','nest','sundial'].includes(z.style)){
    b.scenery??=new Map();
    let patch=b.scenery.get(z.style);
    if(!patch){
     patch=joint(b.root,0,0,0);b.scenery.set(z.style,patch);patch.userData.zoneStyle=z.style;
     if(models[z.style])patch.userData.pose=models[z.style](patch);
     else if(z.style==='cleaver-shrine'){
      const lacquer=mat(0x92192c),tile=mat(0x241e2b),bone=mat(0xe4cdaf);
      part(patch,shape.ring,mat(0xcc2442,true),0,.008,0,1,1,.12).rotation.x=Math.PI/2;
      part(patch,shape.box,tile,0,.05,0,.48,.10,.40);
      for(const x of [-.16,.16])for(const d of [-.13,.13])
       part(patch,shape.pole,lacquer,x,.21,d,.05,.32,.05);
      for(let k=0;k<4;k++)part(patch,shape.box,tile,0,.39+k*.029,0,.55-k*.095,.036,.46-k*.08);
      for(let k=-3;k<=3;k++)part(patch,shape.cone,bone,k*.049,.32,.16,.022,.09,.022).rotation.z=Math.PI;
      part(patch,shape.gem,mat(0xff244a,true),0,.21,0,.052,.10,.05);
     }else if(z.style==='throne'){
      const frame=joint(patch,0,0,0),ivory=mat(0xe9d4ac),shadow=mat(0x301e28);
      patch.userData.frame=frame;
      part(frame,shape.box,mat(0x783041),0,.96,0,1.75,.22,1.8);
      for(const side of [-1,1]){
       for(const x of [-.72,.72])part(frame,shape.pole,ivory,x,.55,side*.75,.28,1.1,.28);
       part(frame,shape.box,ivory,0,1.43,side*.89,1.65,.19,.21);
      }
      for(let j=-3;j<=3;j++){
       const h=2.85-.18*Math.abs(j),skull=joint(frame,-.85,h,j*.29);
       part(frame,shape.pole,ivory,-.85,h/2,j*.29,.22,h,.22);
       part(skull,shape.ball,ivory,0,0,0,.25,.32,.24);
       part(skull,shape.box,ivory,.08,-.24,0,.24,.18,.28);
       for(const side of [-1,1])part(skull,shape.ball,shadow,.20,.01,side*.10,.065,.09,.075);
      }
      patch.userData.pools=Array.from({length:36},()=>part(patch,shape.ball,mat(0xa51033),0,0,0,.34,.034,.34));
     }else if(z.style==='sundial'){
      part(patch,shape.pole,mat(0xbb8541),0,0,0,.67,.045,.67);
      part(patch,shape.cone,mat(0xffc767),0,.12,0,.08,.24,.08).rotation.z=-.4;
      for(let k=0;k<12;k++){const a=k*TAU/12;part(patch,shape.box,mat(0x634731),Math.sin(a)*.27,.03,Math.cos(a)*.27,.015,.015,.06).rotation.y=a}
     }else if(z.style==='nest'){
      part(patch,shape.ball,mat(0x693d30),0,.06,0,1,.65,.93);
      for(let k=0;k<7;k++){const a=k*TAU/7;
       part(patch,shape.gem,mat(0x8c5040),.44*Math.cos(a),.43,.44*Math.sin(a),.36,.3,.31);
      }
      part(patch,shape.ball,mat(0xff7435,true),0,.56,0,.32,.09,.32);
     }else if(z.style==='marsh'){
      part(patch,shape.ball,mat(0x304d42),0,.012,0,.93,.03,.96);
      for(let k=0;k<13;k++){
       const angle=k*2.4,dist=.92*Math.sqrt(k/13),x=Math.cos(angle)*dist,zp=Math.sin(angle)*dist;
       part(patch,shape.ball,mat(k%2?0x587850:0x46695a),x,.035,zp,.18,.025,.17);
       const reed=part(patch,shape.pole,mat(0x8a9956),x,.17,zp,.018,.29,.018);
       reed.rotation.z=.17*Math.sin(angle);part(patch,shape.ball,mat(0x645034),x-.025*Math.sin(angle),.31,zp,.025,.065,.025);
      }
     }else if(z.style==='lantern'){
      part(patch,shape.pole,mat(0x63543b),0,0,0,.05,.7,.05);
      part(patch,shape.gem,mat(0xffdb85,true),0,.37,0,.14,.22,.14);
      part(patch,shape.cone,mat(0x44544e),0,.6,0,.23,.18,.23);
      part(patch,shape.hoop,mat(0x98dfbf,true),0,-.24,0,1).rotation.x=Math.PI/2;
     }else if(z.style==='wind'){
      for(let k=0;k<24;k++){const a=k*.52;part(patch,shape.gem,mat(0xbbf1e5,true),Math.cos(a)*.68,k/17-.3,Math.sin(a)*.68,.12,.035,.05)}
     }else{
      const clock=z.style==='clock',ink=mat(clock?0xffcf74:0xff7437,true);
      for(let k=0;k<12;k++){const a=k*TAU/12;
       part(patch,clock?shape.box:shape.gem,ink,Math.sin(a)*.9,.04,Math.cos(a)*.9,.035,.04,.13).rotation.y=a;
      }
      if(clock){const hand=joint(patch,0,0,0);part(hand,shape.box,ink,0,.05,.32,.035,.035,.64);patch.userData.hand=hand}
     }
    }
    for(const child of b.root.children)child.visible=child===patch;
    b.root.position.set(z.x,HEIGHT-z.y+.4,z.z);b.root.scale.setScalar(z.r);
    if(z.style==='throne'){
     patch.userData.frame.rotation.y=-z.yaw;
     patch.userData.pools.forEach((pool,j)=>{
      const tile=z.rivers[j];pool.visible=!!tile;
      if(tile)pool.position.set((tile.x-z.x)/z.r,(z.y-tile.y+.5)/z.r,(tile.z-z.z)/z.r);
     });
    }
    patch.userData.pose?.(z.style==='demon-arm'?(2.4-z.life)/2.4:t);
    if(z.style==='nest')patch.scale.y=1+.09*Math.sin(t*TAU/.6);
    if(z.style==='wind')patch.rotation.y=t*2;
    if(patch.userData.hand)patch.userData.hand.rotation.y=-t*TAU;
    return;
   }
   const spikes=z.style==='spikes';
   if(spikes&&!b.spikes){b.spikes=joint(b.root,0,0,0);for(let j=0;j<7;j++){
    const a=j*2.4,d=j?.58:0,h=j?.84:1.18;
    part(b.spikes,shape.cone,mat(0xf1dfb1),Math.cos(a)*d,h/2,Math.sin(a)*d,.15,h,.15).rotation.z=.13*Math.sin(a);
   }}
   if(spikes)b.spikes.scale.y=.55+.45*Math.max(0,z.hp??18)/18;
   for(const child of b.root.children)child.visible=child===b.spikes?spikes:!spikes&&!b.scenery?.has(child.userData.zoneStyle);
   const r=Math.max(1,z.r||12);b.root.position.set(z.x,HEIGHT-z.y,z.z);b.root.scale.setScalar(r);b.m.color.copy(color(z));b.edge.color.copy(b.m.color);b.ring.scale.setScalar(.84+.08*Math.sin(t*3+i));
  });
 };
}
function costume(head,chest,outfit){
 const hat=joint(head,-.22,2.5,0);
 if(outfit>=9){
  const add=(parent,type,color,x,y,z,w,h=w,d=w)=>part(parent,shape[type],mat(color),x,y,z,w,h,d);
  switch(outfit){
   case 9:{
    add(chest,'ball',0x459453,0,1,0,4.7,7.4,5.4);
    add(hat,'ball',0x58a65c,0,0,0,3.5,2,3.6);
    for(const side of [-1,1]){
     add(chest,'pole',0x459453,0,3,side*6.2,2.5,7,2.5);
     add(chest,'ball',0x459453,0,-.5,side*4.8,1.8,1.6,3);
     add(chest,'ball',0x58a65c,0,6.5,side*6.2,1.4);
    }
    for(let row=0;row<4;row++)for(let i=0;i<8;i++){
     const a=i*TAU/8,spine=add(chest,'cone',0xffe2a9,Math.cos(a)*4.5,row*3-4,Math.sin(a)*5.2,.17,1.9,.17);
     spine.rotation.set(Math.sin(a)*Math.PI/2,0,-Math.cos(a)*Math.PI/2);
    }
    for(let i=0;i<5;i++){const a=i*TAU/5;add(hat,'ball',0xff83bc,Math.cos(a),2.3,Math.sin(a),.8,.5,.8)}
    add(hat,'ball',0xffde66,0,2.5,0,.6);break;
   }
   case 10:{
    add(chest,'pole',0xf2dfbd,0,0,0,8.8,13,10.5);
    add(hat,'ball',0xd44f53,0,1.4,0,7,3.2,7);
    for(let i=0;i<9;i++){const a=i*2.4,r=i%2?4.6:2.7;add(hat,'ball',0xffedcc,Math.cos(a)*r,3.6,Math.sin(a)*r,1,.28,1)}
    break;
   }
   case 11:{
    add(chest,'ball',0xf6c746,-.4,0,0,4.8,7,5.6);
    for(const y of [-3,0,3])add(chest,'pole',0x352c31,0,y,0,9.5,1.3,11.2);
    for(const side of [-1,1]){
     const wing=add(chest,'ball',0xc7f0ec,-3.8,5,side*5,1,4.6,2.6);wing.rotation.x=side*.5;
     const stalk=add(hat,'pole',0x352c31,0,2,side*1.8,.35,4,.35);stalk.rotation.x=side*.3;
     add(hat,'ball',0x352c31,0,4,side*2.4,.7);
    }break;
   }
   case 12:{
    add(chest,'ball',0xef8e47,0,0,0,5.4,7,5.8);
    for(const side of [-1,1]){
     add(chest,'gem',0xffbc72,0,2,side*6.1,1.4,4,2.7);
     add(hat,'ball',0xffedc8,1,0,side*3.2,1.4);
     add(hat,'ball',0x302f4e,1.8,.2,side*3.5,.55);
    }
    add(chest,'gem',0xffbc72,-5,0,0,3,5,1.3);break;
   }
   case 13:{
    add(chest,'ball',0xe17c29,0,-.5,0,5.6,6.5,6.5);
    for(let i=0;i<8;i++){const a=i*TAU/8;add(chest,'pole',0xc26323,Math.cos(a)*5,-.5,Math.sin(a)*5.8,.35,9,.35)}
    add(hat,'ball',0xe99935,0,0,0,4,1.7,4);
    add(hat,'pole',0x537e40,0,2.3,0,1.4,3,1.4);
    for(const side of [-1,1])add(chest,'gem',0xffd972,5.1,1.5,side*2,.4,1.6,1.2);
    break;
   }
   case 14:{
    add(chest,'box',0xdbe3ec,0,0,0,9,12,10);
    add(chest,'box',0x6d7991,-5,2,0,3,9,7);
    add(chest,'box',0x33465c,4.6,3,0,.5,3.5,4.5);
    for(let i=0;i<3;i++)add(chest,'ball',[0xf06855,0x65d9ad,0xf5cd68][i],5,3,(i-1)*1.1,.35);
    const rim=add(hat,'ring',0xe2e8ee,0,-1.3,0,4.3,4.3,.55);rim.rotation.y=Math.PI/2;
    add(hat,'ball',0xe2e8ee,-1.5,.2,0,2.8,3,3.8);break;
   }
   case 15:{
    add(chest,'box',0x7752b4,0,0,0,10,12,11);
    add(chest,'box',0xf2c65b,0,0,0,10.2,2,11.2);
    add(chest,'box',0xf2c65b,0,0,0,2,12.2,11.3);
    for(const side of [-1,1]){const bow=add(hat,'ring',0xf2c65b,0,1,side*2,1.8,1.1,.6);bow.rotation.y=Math.PI/2;bow.rotation.x=side*.4}
    add(hat,'ball',0xf2c65b,0,1,0,.85);break;
   }
  }
  return hat;
 }
 if(outfit%3===0){
  const metal=new THREE.MeshStandardMaterial({color:0xb9ccd1,metalness:.55,roughness:.33});
  part(hat,new THREE.SphereGeometry(1,18,9,0,TAU,0,Math.PI/2),metal,0,0,0,4.1,3.35,4.35);
  const rim=part(hat,shape.ring,metal,0,.02,0,4.3);rim.rotation.x=Math.PI/2;
  for(const sign of [-1,1]){const handle=part(hat,shape.ring,metal,0,.15,sign*4.25,1.05,1.36,1.04);handle.rotation.x=Math.PI/2}
  for(let j=0;j<2;j++)for(let i=0;i<11;i++){
   const phi=.69+j*.48,a=(i+.34*j)*TAU/11,x=Math.cos(a)*Math.sin(phi),z=Math.sin(a)*Math.sin(phi);
   part(hat,shape.ball,mat(0x384b63),x*4.12,Math.cos(phi)*3.36,z*4.37,.26,.23,.26);
  }
  const spoon=joint(hat,-1.4,2.3,-.1);spoon.rotation.z=.39;
  part(spoon,shape.pole,metal,0,2.4,0,.45,5,.45);part(spoon,shape.ball,metal,0,5.9,0,1.02,1.73,.34);
 }else if(outfit%3===2){
  part(hat,shape.pole,mat(0xf1dfac),0,1,0,6,3,6);
  for(let j=0;j<7;j++){const a=j*TAU/7;part(hat,shape.ball,mat(0xfff3cf),2.1*Math.cos(a),3.6,2.1*Math.sin(a),2,2.7,2)}
 }
 if(Math.floor(outfit/3)===0){
  const duck=joint(chest,0,.18,0),gold=mat(0xffcd3e);
  const tube=part(duck,new THREE.TorusGeometry(4.65,1.32,8,20),gold,0,0,0,1.04,1,1.12);tube.rotation.x=Math.PI/2;
  part(duck,shape.ball,gold,4.38,1.25,0,1.65,2.05,1.65);
  part(duck,shape.ball,gold,4.78,2.48,0,2.15,1.83,1.98);
  part(duck,shape.ball,mat(0xfc7c35),6.65,2.16,0,1.43,.52,1.4);
  for(const z of [-1,1])part(duck,shape.ball,mat(0x34283b),5.48,2.96,z*1.64,.33);
 }
 if(outfit%3===1){
  const orange=mat(0xff7b3c),ivory=mat(0xffe1b4);
  part(hat,shape.box,orange,0,.2,0,8.85,.75,8.5);
  for(const [low,high,r0,r1,m] of [[.5,3.9,3.6,2.53,orange],[3.9,5.8,2.53,1.99,ivory],[5.8,7.7,1.99,1.4,orange],[7.7,8.8,1.4,1.06,ivory],[8.8,11,1.06,.38,orange]]){
   part(hat,new THREE.CylinderGeometry(r1,r0,high-low,16),m,0,(low+high)/2,0,1);
  }
  hat.rotation.z=.095;
 }
 if(Math.floor(outfit/3)===2){
  for(const sign of [-1,1]){
   const bow=part(chest,shape.cone,mat(0x9dea55),3.9,5.8,sign*1.9,2,3.6,2);
   bow.rotation.x=-sign*Math.PI/2;
  }
  part(chest,shape.ball,mat(0xe155b9),4,5.8,0,1.1);
 }else if(Math.floor(outfit/3)===1){
  for(let j=0;j<2;j++)for(let i=0;i<13;i++){
   const a=i*TAU/13+j*.19;
   const petal=part(chest,shape.ball,mat((i+j)%2?0xff81b8:0xdb61ac),Math.cos(a)*(4.08+j*.75),-.25-j*.62,Math.sin(a)*(4.78+j*.65),2.7,.64,1.88);
   petal.rotation.set(0,-a,.22);
  }
  part(chest,shape.pole,mat(0xffaac8),0,1.05,0,7.98,1.14,9.44);
 }
 return hat;
}
export function makeRenderer(canvas){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false});
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(58,1,.5,3100);
 const sky=scenery(scene);scene.fog=new THREE.FogExp2(0xd4a6a2,.00125);
 const env=new THREE.HemisphereLight(0xffedd5,0x8190a5,1.8),key=new THREE.DirectionalLight(0xffe6c4,2.2);
 key.position.set(-250,530,210);scene.add(env,key);
 const rim=new THREE.DirectionalLight(0xa8e6ff,1.45);rim.position.set(80,130,-260);scene.add(rim);
 const title=makeTitle(scene),groundGroup=new THREE.Group();scene.add(groundGroup);
 const paintCasting=makeCastPainter(THREE,scene,SPELLS,HEIGHT);
 const updateTerrain=makeTerrain(groundGroup),rigs=[],paintSpells=makeSpellParts(scene),paintFamiliars=makeFamiliars(scene);
 let pixelScale=1,frames=0,frameSeconds=0,lastDraw=0;
 let palette=null,logicalW=0,logicalH=0,oldDPR=0;
 const look=new THREE.Vector3(),eye=new THREE.Vector3(),target=new THREE.Vector3(),offset=new THREE.Vector3(),desired=new THREE.Vector3(),pos=new THREE.Vector3(),sideVec=new THREE.Vector3();
 let titleScene=0,wasDemo=false,titleEpoch=0,titleOutfits=[0,4];
 const titleStart=new THREE.Vector3(),titleEnd=new THREE.Vector3(),titleBolt={},titleBursts=[];
 function getRig(index,side,outfit){
  if(!rigs[index]||rigs[index].side!==side||rigs[index].outfit!==outfit){
   if(rigs[index]){scene.remove(rigs[index].root,rigs[index].grounding,rigs[index].gauge)}
   rigs[index]=makeWizard(scene,side,outfit);
  }
  return rigs[index];
 }
 function blocked(tiles,x,y,z){
  const i=Math.floor(x/12),j=Math.floor((HEIGHT-y)/12),k=Math.floor(z/12);
  return i>=0&&i<X&&j>=0&&j<Y&&k>=0&&k<Z&&tiles[i+X*(j+Y*k)]>0;
 }
 function moveCamera(state,p,yaw,pitch,distance){
  const tiles=state.tiles;look.set(Math.cos(yaw)*Math.cos(pitch),-Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch));
  eye.set(p.x,HEIGHT-p.y+14,p.z);sideVec.set(-Math.sin(yaw),0,Math.cos(yaw));
  // Converge the crosshair on the first surface intersected by the actual cast ray.
  let range=480;
  for(let d=8;d<range;d+=4){pos.copy(eye).addScaledVector(look,d);if(blocked(tiles,pos.x,pos.y,pos.z)){range=d;break}}
  for(const q of state.players.concat(state.summons||[])){
   if(q===p||q.hp<=0)continue;
   pos.set(q.x,HEIGHT-q.y+13,q.z).sub(eye);const along=pos.dot(look);
   if(along<0||along>range)continue;pos.addScaledVector(look,-along);
   if(Math.abs(pos.y)<=12&&Math.hypot(pos.x,pos.z)<7)range=along;
  }
  target.copy(eye).addScaledVector(look,range);
  const shoulder=Math.min(1,distance/65);
  desired.copy(eye).addScaledVector(look,-distance).addScaledVector(sideVec,9*shoulder);desired.y+=14*shoulder;
  offset.copy(desired).sub(eye);const length=offset.length();offset.normalize();
  for(let d=2;d<length;d+=2){
   pos.copy(eye).addScaledVector(offset,d);
   if(blocked(tiles,pos.x,pos.y,pos.z)){desired.copy(eye).addScaledVector(offset,Math.max(0,d-3));break}
  }
  camera.position.copy(desired);camera.lookAt(target);return camera.position.distanceTo(eye)<12;
 }
 function draw(state,me=0,yaw=0,pitch=0,time=0,distance=65){
  const elapsed=time-lastDraw;lastDraw=time;
  if(state&&elapsed>0&&elapsed<.25){
   frames++;frameSeconds+=elapsed;
   if(frameSeconds>=2){
    const fps=frames/frameSeconds;
    if(fps<45)pixelScale=Math.max(.65,pixelScale-.1);
    else if(fps>58)pixelScale=Math.min(1,pixelScale+.05);
    frames=0;frameSeconds=0;
   }
  }
  const width=canvas.clientWidth||canvas.width||960,height=canvas.clientHeight||canvas.height||540,dpr=Math.min(window.devicePixelRatio||1,1.5)*pixelScale;
  if(width!==logicalW||height!==logicalH||dpr!==oldDPR){
   logicalW=width;logicalH=height;oldDPR=dpr;renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  const p=worlds[state?.map]||worlds['Bellfall Keep'];
  if(p!==palette){sky.update(p);scene.fog.color.setHex(p.haze);palette=p}
  const demo=!state||!state.players?.length;title.visible=demo;groundGroup.visible=!demo;sky.layout(demo);
  if(demo&&!wasDemo){titleScene=Math.floor(Math.random()*4);titleEpoch=time;titleOutfits=[Math.floor(Math.random()*16),Math.floor(Math.random()*16)]}
  wasDemo=demo;
  const players=demo?[{x:395,y:420,z:192,side:0,outfit:titleOutfits[0],hp:100,yaw:.27,aim:-.1},{x:565,y:420,z:192,side:1,outfit:titleOutfits[1],hp:100,yaw:Math.PI-.27,aim:-.1}]:state.players;
  const clock=demo?(time-titleEpoch)*.52:time,cycle=clock%4,hideLocal=demo?false:moveCamera(state,players[me]||players[0],yaw,pitch,distance);
  const demoScale=1.74;
  if(demo&&titleScene===1){
   players[1].z+=Math.sin(cycle*Math.PI/2)*32;
   players[1].y-=Math.max(0,Math.sin(cycle*Math.PI))*25;
  }
  if(demo&&titleScene===2)players[1].x+=Math.sin(cycle*Math.PI/2)*16;
  if(demo){
   const framing=Math.max(1,1.55/camera.aspect),distance=141*framing;
   camera.position.set(480+Math.sin(clock*.17)*9,152+29*framing,192+distance);
   camera.lookAt(480,143,192);
  }else updateTerrain(state,p,camera);
  const creatures=demo?[]:[...(state.summons||[])];
  if(demo&&titleScene===3){
   for(let i=0;i<6;i++)creatures.push({id:i,kind:i<4?'squire':'wraith',side:0,hp:28,maxHp:28,
    x:435+i*13+Math.sin(clock*2+i)*9,y:420,z:170+(i%3)*19,yaw:0});
  }
  for(const a of players)if(a.monster&&a.hp>0)creatures.push({...a,kind:a.monster});
  paintFamiliars(creatures,players,clock,camera);
  sky.sky.position.copy(camera.position);sky.glitter.position.copy(camera.position);
  for(let i=0;i<players.length;i++){
   const a=players[i];
   if(a.monster){if(rigs[i]){rigs[i].root.visible=false;rigs[i].grounding.visible=false;rigs[i].gauge.visible=false}continue}
   const r=getRig(i,a.side||0,a.outfit??(a.side?4:0));r.root.visible=a.hp>0&&!(hideLocal&&i===me);r.grounding.visible=r.root.visible;
   r.gauge.visible=r.root.visible&&!demo&&i!==me&&a.hp<a.maxHp;
   if(!r.root.visible)continue;
   const cast=demo?(Math.cos((cycle-i*2)*Math.PI/2)*.5+.5):(a.cast>0||a.channel>=0?1:a.store>=0?.45:0);
   animateWizard(r,a,clock,i,cast,state?.time??clock);r.root.scale.setScalar(demo?demoScale:1);
   if(r.gauge.visible){const fraction=clamp(a.hp/a.maxHp,0,1);r.gauge.position.copy(r.root.position);r.gauge.position.y+=34;r.gauge.quaternion.copy(camera.quaternion);r.hpBar.scale.x=11.4*fraction;r.hpBar.position.x=(fraction-1)*5.7}
   let floor=HEIGHT-a.y;
   if(!demo){const jStart=clamp(Math.floor(a.y/TILE),0,Y-1),cx=clamp(Math.floor(a.x/TILE),0,X-1),cz=clamp(Math.floor(a.z/TILE),0,Z-1);
    let j=jStart;while(j<Y&&!state.tiles[cx+X*(j+Y*cz)])j++;r.grounding.visible=j<Y&&j-jStart<9;floor=HEIGHT-j*TILE;}
   r.grounding.position.set(a.x,floor+.28,a.z);r.grounding.scale.set(demo?42:20,demo?32:16,1);
  }
  for(let i=players.length;i<rigs.length;i++){if(!rigs[i])continue;rigs[i].root.visible=false;rigs[i].grounding.visible=false;rigs[i].gauge.visible=false}
  if(demo){
   const from=cycle<2?0:1,to=1-from,phase=(cycle%2)/2,progress=clamp((phase-.09)/.72,0,1);
   rigs[from].crystal.getWorldPosition(titleStart);rigs[to].chest.getWorldPosition(titleEnd);titleEnd.y+=10;
   pos.copy(titleStart).lerp(titleEnd,progress);pos.y+=Math.sin(progress*Math.PI)*16;pos.z+=Math.sin(progress*Math.PI)*7;
   Object.assign(titleBolt,{style:from?'kiln-heart':'north-star',x:pos.x,y:HEIGHT-pos.y,z:pos.z,r:2.8,vx:to?150:-150,vy:-Math.cos(progress*Math.PI)*30,vz:0,color:from?'#ffac67':'#83ffea'});
   titleBursts.length=0;
   if(phase>=.81)titleBursts.push({x:titleEnd.x,y:HEIGHT-titleEnd.y,z:titleEnd.z,r:13,life:1-(phase-.81)/.19,maxLife:1,color:titleBolt.color});
   const shots=phase>.09&&phase<.81?[{...titleBolt}]:[],zones=[];
   if(titleScene===1){
    shots.length=0;titleBursts.length=0;
    for(let i=0;i<3;i++){
     const fall=(clock*.48+i/3)%1,x=520+i*24;
     if(fall<.86)shots.push({style:'comet',x:x-45*(1-fall),y:270+fall*150,z:178+i*15,r:5,vx:45,vy:150,vz:0});
     else titleBursts.push({x,y:420,z:178+i*15,r:26,life:(1-fall)/.14,maxLife:1,color:'#a1cfff'});
    }
   }else if(titleScene===2){
    zones.push({style:'demon-arm',x:490,y:420,z:185,r:55,life:2.4*(1-cycle/4),color:'#c74563'});
    if(cycle>1.9&&cycle<2.4)titleBursts.push({x:510,y:420,z:192,r:32,life:1-(cycle-1.9)*2,maxLife:1,color:'#ff6954'});
    shots.forEach(shot=>{shot.style='cone-of-cold';shot.r=5});
   }else if(titleScene===3){
    shots.forEach(shot=>{shot.style=from?'incendiary-volley':'void-orb';shot.r=4});
    zones.push({style:'tentacle-field',x:515,y:420,z:192,r:35,color:'#985acb'});
   }
   paintSpells(shots,titleBursts,zones,clock,camera);
  }else{
   const visibleShots=[...(state.shots||[])];
   for(const wizard of players)if(wizard.hp>0&&wizard.bloodAmmo){
    for(let i=6-wizard.bloodAmmo;i<6;i++){
     const angle=clock*1.25+i*TAU/6;
     visibleShots.push({style:bloodWeapons[i%bloodWeapons.length].style,r:4,
      x:wizard.x+24*Math.cos(angle),y:wizard.y-27+3*Math.sin(angle*2),z:wizard.z+24*Math.sin(angle),
      vx:0,vy:-1,vz:0});
    }
   }
   for(const wizard of players)if(wizard.hp>0&&wizard.blocks?.length){
    const rise=clamp((state.time-wizard.liftedAt)/.45,0,1);
    wizard.blocks.forEach((block,i)=>{
     const phase=clock*1.4+i*TAU/9;
     const x=wizard.x+24*Math.cos(phase),y=wizard.y-31+3*Math.sin(phase*2),z=wizard.z+24*Math.sin(phase);
     visibleShots.push({style:'quarry-volley',r:6,x:block.x+(x-block.x)*rise,y:block.y+(y-block.y)*rise,z:block.z+(z-block.z)*rise,vx:0,vy:-1,vz:0});
    });
   }
   paintSpells(visibleShots,state.effects||[],state.zones||[],clock,camera);
  }
  paintCasting(demo?[]:players,state?.time??0,camera,me,hideLocal);
  renderer.render(scene,camera);
 }
 return {draw};
}
