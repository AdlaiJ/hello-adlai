import {W,H,D} from './wizard-world.js?v=compact-maps';
export const FLOOR=36,COLS=8,ROWS=6,CW=W/COLS,CD=D/ROWS;
// Start with solid rock. Only carved rooms and their connecting passages are open.
export function dungeonTiles(seed){
 const tiles=new Uint8Array(W*H*D).fill(85),visited=new Uint8Array(COLS*ROWS),openings=new Uint8Array(COLS*ROWS);
 let rand=seed>>>0;function next(){rand=(Math.imul(rand,1664525)+1013904223)>>>0;return rand/4294967296}
 const dirs=[[1,0,1,2],[-1,0,2,1],[0,1,4,8],[0,-1,8,4]];
 const stack=[0];visited[0]=1;
 while(stack.length){const at=stack.at(-1),cx=at%COLS,cz=Math.floor(at/COLS),options=dirs.filter(([dx,dz])=>cx+dx>=0&&cx+dx<COLS&&cz+dz>=0&&cz+dz<ROWS&&!visited[at+dx+dz*COLS]);
  if(!options.length){stack.pop();continue}const [dx,dz,bit,reverse]=options[Math.floor(next()*options.length)],to=at+dx+dz*COLS;openings[at]|=bit;openings[to]|=reverse;visited[to]=1;stack.push(to);
 }
 for(let i=0;i<openings.length;i++){if(i%COLS<COLS-1&&next()<.24){openings[i]|=1;openings[i+1]|=2}if(i+COLS<openings.length&&next()<.24){openings[i]|=4;openings[i+COLS]|=8}}
 for(let i=0;i<openings.length;i++){
  const cx=(i%COLS)*CW+CW/2,cz=Math.floor(i/COLS)*CD+CD/2,exits=openings[i],wide=i%5===0,rx=wide?8:5,rz=wide?6:4;
  for(let z=cz-CD/2;z<cz+CD/2;z++)for(let x=cx-CW/2;x<cx+CW/2;x++){
   const dx=x-cx,dz=z-cz,ax=Math.abs(dx),az=Math.abs(dz),room=ax<=rx&&az<=rz;
   const ew=az<=2&&(dx>=0?exits&1:exits&2),ns=ax<=2&&(dz>=0?exits&4:exits&8);
   if(!room&&!ew&&!ns)continue;
   const height=room?(wide?16:11):7+(2-(ew?az:ax));
   for(let y=FLOOR-height;y<FLOOR;y++)tiles[(z*H+y)*W+x]=0;
   if((!room&&(x%4===0||z%4===0))||(room&&(ax===rx-1||az===rz-1)))tiles[(z*H+FLOOR-height-1)*W+x]=195;
   if((ax===rx-1&&az===rz-1&&wide))for(let y=FLOOR-height;y<FLOOR;y++)tiles[(z*H+y)*W+x]=192;
   if((dx===0||dz===0)&&(x+z)%4===0)tiles[(z*H+FLOOR)*W+x]=180;
  }
 }
 return tiles;
}
