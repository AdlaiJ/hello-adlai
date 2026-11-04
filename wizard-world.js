export const W=240, H=45, D=128, T=12;
export const MAPS=['Bellfall Keep','Ember Quarry','Frostglass Bridge','Thornroot Ruins','Sunken Oasis','Void Cathedral'];

export function markChangedChunk(revisions,index){
 const x=index%W,z=Math.floor(index/(W*H)),cx=Math.floor(x/16),cz=Math.floor(z/16);
 const columns=Math.ceil(W/16),key=cx+cz*columns;
 const mark=k=>revisions.set(k,(revisions.get(k)||0)+1);
 mark(key);
 if(x%16===0&&x>0)mark(key-1);
 if(x%16===15&&x+1<W)mark(key+1);
 if(z%16===0&&z>0)mark(key-columns);
 if(z%16===15&&z+1<D)mark(key+columns);
}

export function makeTiles(map){
 const tiles=new Uint8Array(W*H*D);
 function column(x,z,top,bottom,hp){
  for(let y=top;y<bottom;y++)tiles[x+W*(y+H*z)]=hp;
 }
 for(let z=0;z<D;z++)for(let x=0;x<W;x++){
  if(map===MAPS[0]){
   const dx=Math.abs(x%80-39.5),dz=Math.abs(z%64-31.5);
   column(x,z,38,H,22);
   const tower=Math.abs(dx-23)<3&&Math.abs(dz-19)<3;
   const rampart=(Math.abs(dx-23)<1.5&&dz<19&&dz>3)||(Math.abs(dz-19)<1.5&&dx<23&&dx>4);
   if(tower||rampart){
    const height=tower?12:6;
    column(x,z,38-height-(Math.floor((x+z)/3)%2),38,30);
   }else if(dx<5&&dz<5){
    column(x,z,38-Math.floor(5-Math.max(dx,dz)),38,26);
   }
  }else if(map===MAPS[1]){
   // Quarry terraces descend into three broad pits. Cuts through the rims form ramps.
   const dx=(x%80-40)/34,dz=(z%64-32)/27,r=Math.hypot(dx,dz);
   const depth=Math.max(0,1-r)*10,rim=Math.max(0,1-Math.abs(r-.89)*6)*6*Math.min(1,Math.abs(dz)*3);
   const floor=33+Math.floor(depth-rim+1.5*Math.sin(x*.09+z*.07));
   column(x,z,floor,H,18);
   if(r>.95&&Math.abs((x+z)%37-18)<2&&z%24<4)column(x,z,floor-5,floor,26);
  }else if(map===MAPS[2]){
   const river=Math.abs(z-64-20*Math.sin(x*.045)),cross=Math.abs(x%56-28);
   const floor=34+Math.floor(Math.max(0,1-river/15)*10);
   column(x,z,floor,H,18);
   if(cross<4&&river<18){
    column(x,z,33,35,24);
    if(cross>2&&z%11<2)column(x,z,35,H,26);
   }else if(river>20&&cross>20&&z%32<6)column(x,z,29,34,22);
  }else if(map===MAPS[3]){
   // Root lanes connect mossy courtyards beneath raised stone walkways.
   const lane=Math.min(Math.abs(x%48-24),Math.abs(z%32-16));
   const floor=lane<4?39:37;
   column(x,z,floor,H,22);
   const dx=Math.abs(x%48-24),dz=Math.abs(z%32-16);
   if(dx>13&&dx<17&&dz>8&&dz<12)column(x,z,28,floor,30);
   if(dx<18&&dz>9&&dz<12)column(x,z,29,31,26);
   if(dx<7&&dz>12)column(x,z,37-Math.floor((dz-12)*1.5),floor,24);
   if(lane>6&&Math.abs((x+2*z)%43-21)<2)column(x,z,34,floor,24);
  }else if(map===MAPS[4]){
   // Dunes surround a lower basin with island cover and broken aqueducts.
   const basin=Math.hypot((x-120)/90,(z-64)/42);
   const floor=basin<.7?41:35+Math.floor(3*Math.sin(x*.08)*Math.cos(z*.09));
   column(x,z,floor,H,18);
   if(basin<.7&&Math.hypot(x%32-16,z%24-12)<5)column(x,z,36,floor,24);
   const aqueduct=Math.abs(z-27)<2||Math.abs(z-101)<2;
   if(aqueduct&&x%40<32){
    column(x,z,29,31,26);
    if(x%16<3)column(x,z,31,floor,30);
   }
   if(Math.abs(x-120)<5&&Math.abs(z-64)<5)column(x,z,34,floor,30);
  }else if(map===MAPS[5]){
   // A broad nave, side aisles, and concentric stair rings around the altar.
   const dx=Math.abs(x-120),dz=Math.abs(z-64),radius=Math.hypot(dx,dz);
   const floor=radius<12?32:radius<18?33:radius<24?34:radius<30?35:38;
   column(x,z,floor,H,24);
   if((Math.abs(z-34)<3||Math.abs(z-94)<3)&&Math.abs(x%36-18)<3)column(x,z,28,floor,34);
   if((Math.abs(z-19)<2||Math.abs(z-109)<2)&&x%48>12)column(x,z,31,floor,30);
   if(dx>90&&dz<8)column(x,z,35,floor,28);
  }
 }
 return tiles;
}
