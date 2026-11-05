// All bones within a terrain chunk share draw calls. Rebuild only edited chunks.
export function boneWallChunk(THREE,shape,mat,tiles,cells,width,height,tileSize){
 if(!cells.length)return null;
 const batches=new Map(),frame=new THREE.Object3D(),part=new THREE.Object3D();
 const ivory=0xe7d5ad,shadow=0xb19979,joint=0xd1bd96,socket=0x332936;
 function add(type,color,x,y,z,sx,sy,sz,tilt=0,twist=0){
  part.position.set(x,y,z);part.rotation.set(twist,0,tilt);part.scale.set(sx,sy,sz);part.updateMatrix();
  const key=type+color;let batch=batches.get(key);
  if(!batch){batch={geometry:shape[type],material:mat(color),matrices:[]};batches.set(key,batch)}
  batch.matrices.push(new THREE.Matrix4().multiplyMatrices(frame.matrix,part.matrix));
 }
 function shaft(ax,ay,bx,by,z,thickness,color){
  const dx=bx-ax,dy=by-ay;add('pole',color,(ax+bx)/2,(ay+by)/2,z,thickness,Math.hypot(dx,dy),thickness,-Math.atan2(dx,dy));
 }
 for(const i of cells){
  const x=i%width,y=Math.floor(i/width)%height,z=Math.floor(i/(width*height));
  frame.position.set((x+.5)*tileSize,(height-y-.5)*tileSize,(z+.5)*tileSize);
  frame.rotation.y=-tiles.boneWalls.get(i)-Math.PI/2;frame.updateMatrix();
  const bend=Math.sin(y*.65+(x+z)*.31)*1.2;
  add('facet',shadow,0,0,-.6,5.6,6,3.7);
  shaft(0,-6,bend,5,1.1,4.8,ivory);add('ball',joint,bend,4.5,1,3.3,1.9,2.6);
  if((x+z)%3!==0){
   // Sweep a long rib inward as it climbs; knuckles mark the joins between sections.
   const sweep=2.3*Math.sin(y*.55+x+z),next=2.3*Math.sin((y-1)*.55+x+z);
   shaft(sweep,-6,next,6,2.1,5.4,ivory);
   add('ball',joint,sweep,-5.5,2.1,3.2,1.6,2.8);
   const side=y%2?1:-1;shaft(sweep,-3,side*6.4,3,1.2,2.8,shadow);
  }else for(const side of [-1,1]){
   shaft(bend,3,side*3.4,1.3,3,2.5,ivory);shaft(side*3.4,1.3,side*6.3,-2,2.5,2.1,joint);
   shaft(0,-2.4,side*5.8,-5.1,2.6,1.6,ivory);
  }
  if(tiles.boneWalls.has(i-width))continue;
  if((x+z)%3===0){
   add('ball',ivory,0,4,1,4.9,4.4,3.9);add('box',joint,0,1.8,3.3,6.2,2,3);
   for(const side of [-1,1]){
    add('facet',socket,side*1.95,4.4,4.25,1.55,1.45,.8);
    shaft(side*3,6,side*5,8.6,.4,2.2,shadow);add('cone',ivory,side*5,10,.4,1.05,4,1.05,-side*.28);
   }
   add('gem',socket,0,2.4,4.8,.65,.83,.4);
   for(let tooth=-2;tooth<=2;tooth++)add('cone',ivory,tooth*1.05,.35,4.25,.55,2,.55,Math.PI);
  }else{
   shaft(0,3,1.5,7.3,0,4.1,joint);add('cone',ivory,1.1,9.3,0,1.9,5.4,1.8,.18);
  }
 }
 const group=new THREE.Group();
 for(const batch of batches.values()){
  const mesh=new THREE.InstancedMesh(batch.geometry,batch.material,batch.matrices.length);
  batch.matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));mesh.computeBoundingSphere();group.add(mesh);
 }
 return group;
}
