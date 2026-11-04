import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const X=80,Y=45,Z=32,TILE=12,HEIGHT=540,TAU=Math.PI*2;
const clamp=THREE.MathUtils.clamp;
const frac=n=>n-Math.floor(n);
const noise=n=>frac(Math.sin(n*127.1+311.7)*43758.5453);
const worlds={
 'Bellfall Keep':{sky:0x242744,haze:0xd4a6a2,ridge:0x756987,ruin:0x5e5875,top:0x9da78e,rock:0x665e72,sun:0xffe6be},
 'Ember Quarry':{sky:0x311f3b,haze:0xf4a172,ridge:0x936269,ruin:0x774e60,top:0xc8946c,rock:0x724b52,sun:0xffc498},
 'Frostglass Bridge':{sky:0x172f4d,haze:0xb7dce7,ridge:0x7297b8,ruin:0x59819a,top:0xc3e2df,rock:0x66869e,sun:0xe5fff3}
};
const themes=[
 {dark:0x293d70,cloth:0x4879b5,hem:0x69abbc,point:0x84eedd,trim:0xffca79,skin:0x6399df,hair:0xffe2bf},
 {dark:0x672b43,cloth:0xb95867,hem:0xe58d80,point:0xffa177,trim:0xffd386,skin:0xda6f78,hair:0xe1d8e0}
];
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
function makeWizard(parent,side){
 const p=themes[side?1:0],root=joint(parent,0,0,0),pelvis=joint(root,0,7,0),chest=joint(pelvis,0,1,0);
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
 const hat=costume(head,chest,side),legs=[],arms=[];
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
 const hpBar=part(gauge,shape.box,mat(side?0xffa695:0x8ef3e3,true),0,0,.13,11.4,.8,.13);
 const grounding=part(parent,new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0x282537,map:haloTexture(),transparent:true,opacity:.59,depthWrite:false}),0,0,0,21,17,1);grounding.rotation.x=-Math.PI/2;
 return {p,side,root,pelvis,chest,head,hat,cape,scarf,legs,arms,wand,crystal,light,shield,grounding,wisps,wispMat,gauge,hpBar};
}
function animateWizard(r,p,time,index,cast){
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
 r.crystal.rotation.y=time*2;r.light.material.opacity=.4+cast*.45;
 const st=p.statuses||{};
 r.light.scale.setScalar(7+cast*7+Math.sin(time*6)*.6);r.shield.visible=p.shield>0||st.reflect>0||st.phased>0;
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
 for(let i=0;i<54;i++){
  const a=i*TAU/54,dist=850+noise(i+4)*200,h=160+noise(i+19)*230;
  obj.position.set(480+Math.cos(a)*dist,h/2-47,192+Math.sin(a)*dist);
  obj.scale.set(160+noise(i+90)*160,h,125+noise(i+52)*150);obj.rotation.set(0,noise(i+8)*TAU,0);obj.updateMatrix();peaks.setMatrixAt(i,obj.matrix);
  tint.setScalar(.66+.32*noise(i));peaks.setColorAt(i,tint);
 }
 scene.add(peaks);
 const ruins=new THREE.Group(),brick=new THREE.MeshStandardMaterial({roughness:.98,flatShading:true});
 for(const [x,z,s] of [[-192,-98,1.25],[200,-285,.9],[844,-236,1.25],[1130,9,1],[320,740,.95]]){
  const root=joint(ruins,x,19,z);root.scale.setScalar(s);
  part(root,shape.pole,brick,0,52,0,53,106,53);part(root,shape.pole,brick,0,107,0,64,12,64);
  for(let i=0;i<8;i++){const a=i*TAU/8;part(root,shape.box,brick,Math.cos(a)*27,118,Math.sin(a)*27,12,15,11).rotation.y=-a}
 }
 scene.add(ruins);
 const stars=new Float32Array(390*3);
 for(let i=0;i<390;i++){
  const y=.09+noise(i+1)*.84,a=noise(i+522)*TAU,r=Math.sqrt(1-y*y);
  stars[i*3]=r*Math.cos(a)*1600;stars[i*3+1]=y*1600;stars[i*3+2]=r*Math.sin(a)*1600;
 }
 const points=new THREE.BufferGeometry();points.setAttribute('position',new THREE.BufferAttribute(stars,3));
 const glitter=new THREE.Points(points,new THREE.PointsMaterial({color:0xfff4d4,size:2.8,transparent:true,opacity:.78,sizeAttenuation:true,fog:false,depthWrite:false}));scene.add(glitter);
 return {sky,glitter,update(p){sky.material.uniforms.zenith.value.setHex(p.sky);sky.material.uniforms.horizon.value.setHex(p.haze);peaks.material.color.setHex(p.ridge);brick.color.setHex(p.ruin)}};
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
function makeTerrain(scene){
 const mesh=new THREE.InstancedMesh(shape.box,new THREE.MeshStandardMaterial({roughness:.97,flatShading:true}),X*Y*Z);
 mesh.count=0;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(mesh);
 let last=null,version=-1;
 const o=new THREE.Object3D(),c=new THREE.Color(),layer=X*Y;o.scale.set(11.87,11.87,11.87);
 return (tiles,ver,p)=>{
  if(tiles===last&&ver===version)return;
  last=tiles;version=ver;let k=0;
  for(let z=0;z<Z;z++)for(let y=0;y<Y;y++)for(let x=0;x<X;x++){
   const i=x+X*y+layer*z,hp=tiles[i];if(!(hp>0))continue;
   const top=y===0||!tiles[i-X];
   if(!top&&y<Y-1&&tiles[i+X]&&x>0&&tiles[i-1]&&x<X-1&&tiles[i+1]&&z>0&&tiles[i-layer]&&z<Z-1&&tiles[i+layer])continue;
   o.position.set(x*TILE+6,HEIGHT-y*TILE-6,z*TILE+6);o.updateMatrix();mesh.setMatrixAt(k,o.matrix);
   const grain=((i*13+(i>>3)*7)%43)/43;
   c.setHex(top?p.top:p.rock).multiplyScalar((.87+grain*.14)*(hp<8?.68:hp<14?.84:1));
   mesh.setColorAt(k++,c);
  }
  mesh.count=k;
  mesh.instanceMatrix.clearUpdateRanges();mesh.instanceMatrix.addUpdateRange(0,k*16);mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor){mesh.instanceColor.clearUpdateRanges();mesh.instanceColor.addUpdateRange(0,k*3);mesh.instanceColor.needsUpdate=true}
 };
}
function makeSpellParts(scene){
 const bolts=[],effects=[],zones=[];
 function bolt(){const root=joint(scene,0,0,0),m=new THREE.MeshBasicMaterial(),gem=part(root,shape.gem,m,0,0,0,1),shine=halo(root,0xffffff,6);
  const trail=part(root,shape.cone,new THREE.MeshBasicMaterial({transparent:true,opacity:.52,depthWrite:false}),0,0,0,1);return {root,m,gem,shine,trail}}
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
  each(shots,bolts,bolt,(s,b,i)=>{
   const r=clamp(s.r||3,1,35),tone=color(s);b.root.position.set(s.x,HEIGHT-s.y,s.z);b.m.color.copy(tone);b.gem.scale.setScalar(r);
   b.gem.rotation.set(t*4+i,t*5,t*.8);b.shine.material.color.copy(tone);b.shine.scale.setScalar(r*6.7);
   v.set(s.vx||0,-(s.vy||0),s.vz||0);b.trail.visible=v.lengthSq()>1;
   if(b.trail.visible){v.normalize();b.trail.material.color.copy(tone);b.trail.quaternion.setFromUnitVectors(up,v.clone().negate());b.trail.position.copy(v).multiplyScalar(-r*1.9);b.trail.scale.set(r*.78,r*3.8,r*.78)}
  });
  each(bursts,effects,burst,(e,b,i)=>{
   const life=clamp(e.life/(e.maxLife||.45),0,1),r=Math.max(1,e.r||10)*(1-life*.75);b.root.position.set(e.x,HEIGHT-e.y,e.z);
   b.m.color.copy(color(e));b.m.opacity=life*.85;b.ring.scale.setScalar(r);b.ring.quaternion.copy(camera.quaternion);
   b.beads.forEach((m,j)=>{const a=j*TAU/5+i;m.position.set(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*2)*r*.5);m.scale.setScalar(Math.max(.01,life*r*.09))});
  });
  each(fields,zones,field,(z,b,i)=>{
   const r=Math.max(1,z.r||12);b.root.position.set(z.x,HEIGHT-z.y,z.z);b.root.scale.setScalar(r);b.m.color.copy(color(z));b.edge.color.copy(b.m.color);b.ring.scale.setScalar(.84+.08*Math.sin(t*3+i));
  });
 };
}
function costume(head,chest,side){
 const hat=joint(head,-.22,2.5,0);
 if(!side){
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
  const duck=joint(chest,0,.18,0),gold=mat(0xffcd3e);
  const tube=part(duck,new THREE.TorusGeometry(4.65,1.32,8,20),gold,0,0,0,1.04,1,1.12);tube.rotation.x=Math.PI/2;
  part(duck,shape.ball,gold,4.38,1.25,0,1.65,2.05,1.65);
  part(duck,shape.ball,gold,4.78,2.48,0,2.15,1.83,1.98);
  part(duck,shape.ball,mat(0xfc7c35),6.65,2.16,0,1.43,.52,1.4);
  for(const z of [-1,1])part(duck,shape.ball,mat(0x34283b),5.48,2.96,z*1.64,.33);
 }else{
  const orange=mat(0xff7b3c),ivory=mat(0xffe1b4);
  part(hat,shape.box,orange,0,.2,0,8.85,.75,8.5);
  for(const [low,high,r0,r1,m] of [[.5,3.9,3.6,2.53,orange],[3.9,5.8,2.53,1.99,ivory],[5.8,7.7,1.99,1.4,orange],[7.7,8.8,1.4,1.06,ivory],[8.8,11,1.06,.38,orange]]){
   part(hat,new THREE.CylinderGeometry(r1,r0,high-low,16),m,0,(low+high)/2,0,1);
  }
  hat.rotation.z=.095;
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
 const updateTerrain=makeTerrain(groundGroup),rigs=[],paintSpells=makeSpellParts(scene);
 let palette=null,logicalW=0,logicalH=0,oldDPR=0;
 const look=new THREE.Vector3(),eye=new THREE.Vector3(),target=new THREE.Vector3(),offset=new THREE.Vector3(),desired=new THREE.Vector3(),pos=new THREE.Vector3(),sideVec=new THREE.Vector3();
 const titleStart=new THREE.Vector3(),titleEnd=new THREE.Vector3(),titleBolt={},titleBursts=[];
 function getRig(index,side){
  if(!rigs[index]||rigs[index].side!==side){
   if(rigs[index]){scene.remove(rigs[index].root,rigs[index].grounding,rigs[index].gauge)}
   rigs[index]=makeWizard(scene,side);
  }
  return rigs[index];
 }
 function blocked(tiles,x,y,z){
  const i=Math.floor(x/12),j=Math.floor((HEIGHT-y)/12),k=Math.floor(z/12);
  return i>=0&&i<X&&j>=0&&j<Y&&k>=0&&k<Z&&tiles[i+X*(j+Y*k)]>0;
 }
 function moveCamera(state,p,yaw,pitch){
  const tiles=state.tiles;look.set(Math.cos(yaw)*Math.cos(pitch),-Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch));
  eye.set(p.x,HEIGHT-p.y+14,p.z);sideVec.set(-Math.sin(yaw),0,Math.cos(yaw));
  // Converge the crosshair on the first surface intersected by the actual cast ray.
  let range=480;
  for(let d=8;d<range;d+=4){pos.copy(eye).addScaledVector(look,d);if(blocked(tiles,pos.x,pos.y,pos.z)){range=d;break}}
  for(const q of state.players){
   if(q===p||q.hp<=0)continue;
   pos.set(q.x,HEIGHT-q.y+13,q.z).sub(eye);const along=pos.dot(look);
   if(along<0||along>range)continue;pos.addScaledVector(look,-along);
   if(Math.abs(pos.y)<=12&&Math.hypot(pos.x,pos.z)<7)range=along;
  }
  target.copy(eye).addScaledVector(look,range);
  desired.copy(eye).addScaledVector(look,-65).addScaledVector(sideVec,9);desired.y+=14;
  offset.copy(desired).sub(eye);const length=offset.length();offset.normalize();
  for(let d=2;d<length;d+=2){
   pos.copy(eye).addScaledVector(offset,d);
   if(blocked(tiles,pos.x,pos.y,pos.z)){desired.copy(eye).addScaledVector(offset,Math.max(0,d-3));break}
  }
  camera.position.copy(desired);camera.lookAt(target);return camera.position.distanceTo(eye)<12;
 }
 function draw(state,me=0,yaw=0,pitch=0,time=0){
  const width=canvas.clientWidth||canvas.width||960,height=canvas.clientHeight||canvas.height||540,dpr=Math.min(window.devicePixelRatio||1,1.65);
  if(width!==logicalW||height!==logicalH||dpr!==oldDPR){
   logicalW=width;logicalH=height;oldDPR=dpr;renderer.setPixelRatio(dpr);renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
  }
  const p=worlds[state?.map]||worlds['Bellfall Keep'];
  if(p!==palette){sky.update(p);scene.fog.color.setHex(p.haze);palette=p}
  const demo=!state||!state.players?.length;title.visible=demo;groundGroup.visible=!demo;
  const players=demo?[{x:395,y:420,z:192,side:0,hp:100,yaw:.27,aim:-.1},{x:565,y:420,z:192,side:1,hp:100,yaw:Math.PI-.27,aim:-.1}]:state.players;
  const clock=demo?time*.52:time,cycle=clock%4,hideLocal=demo?false:moveCamera(state,players[me]||players[0],yaw,pitch);
  const demoScale=1.74;
  if(demo){
   const framing=Math.max(1,1.55/camera.aspect),distance=141*framing;
   camera.position.set(480+Math.sin(clock*.17)*9,152+29*framing,192+distance);
   camera.lookAt(480,143,192);
  }else updateTerrain(state.tiles,state.terrainVersion,p);
  sky.sky.position.copy(camera.position);sky.glitter.position.copy(camera.position);
  for(let i=0;i<players.length;i++){
   const a=players[i],r=getRig(i,a.side||0);r.root.visible=a.hp>0&&!(hideLocal&&i===me);r.grounding.visible=r.root.visible;
   r.gauge.visible=r.root.visible&&!demo&&i!==me&&a.hp<a.maxHp;
   if(!r.root.visible)continue;
   const cast=demo?(Math.cos((cycle-i*2)*Math.PI/2)*.5+.5):(a.cast>0?1:a.store>=0?.45:0);
   animateWizard(r,a,clock,i,cast);r.root.scale.setScalar(demo?demoScale:1);
   if(r.gauge.visible){const fraction=clamp(a.hp/a.maxHp,0,1);r.gauge.position.copy(r.root.position);r.gauge.position.y+=34;r.gauge.quaternion.copy(camera.quaternion);r.hpBar.scale.x=11.4*fraction;r.hpBar.position.x=(fraction-1)*5.7}
   let floor=HEIGHT-a.y;
   if(!demo){const jStart=clamp(Math.floor(a.y/TILE),0,Y-1),cx=clamp(Math.floor(a.x/TILE),0,X-1),cz=clamp(Math.floor(a.z/TILE),0,Z-1);
    let j=jStart;while(j<Y&&!state.tiles[cx+X*(j+Y*cz)])j++;r.grounding.visible=j<Y&&j-jStart<9;floor=HEIGHT-j*TILE;}
   r.grounding.position.set(a.x,floor+.28,a.z);r.grounding.scale.set(demo?42:20,demo?32:16,1);
  }
  for(let i=players.length;i<rigs.length;i++){rigs[i].root.visible=false;rigs[i].grounding.visible=false;rigs[i].gauge.visible=false}
  if(demo){
   const from=cycle<2?0:1,to=1-from,phase=(cycle%2)/2,progress=clamp((phase-.09)/.72,0,1);
   rigs[from].crystal.getWorldPosition(titleStart);rigs[to].chest.getWorldPosition(titleEnd);titleEnd.y+=10;
   pos.copy(titleStart).lerp(titleEnd,progress);pos.y+=Math.sin(progress*Math.PI)*16;pos.z+=Math.sin(progress*Math.PI)*7;
   Object.assign(titleBolt,{x:pos.x,y:HEIGHT-pos.y,z:pos.z,r:2.8,vx:to?150:-150,vy:-Math.cos(progress*Math.PI)*30,vz:0,color:from?'#ffac67':'#83ffea'});
   titleBursts.length=0;
   if(phase>=.81)titleBursts.push({x:titleEnd.x,y:HEIGHT-titleEnd.y,z:titleEnd.z,r:13,life:1-(phase-.81)/.19,maxLife:1,color:titleBolt.color});
   paintSpells(phase>.09&&phase<.81?[titleBolt]:[],titleBursts,[],clock,camera);
  }else paintSpells(state.shots||[],state.effects||[],state.zones||[],clock,camera);
  renderer.render(scene,camera);
 }
 return {draw};
}
