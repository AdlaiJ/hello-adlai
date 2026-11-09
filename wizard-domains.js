// Domain shells are temporary collision surfaces, never edits to map blocks.
export const DOMAIN_STYLES=new Set(['cleaver-shrine','unlimited-void','wizzone','curse-growing-branches','curse-iron-mountain','curse-captivating-skandha','curse-self-embodiment','curse-flash-domain','hakari-idle-death-gamble','demiplane-of-sanctuary','demiplane-of-stars','demiplane-of-cinders']);
export function crossesDomain(zones,from,to){
 for(const z of zones){
  if(!z.barrier||z.life<=0||z.p?.hp<=0)continue;
  const ax=from.x-z.x,ay=from.y-z.y,az=from.z-z.z;
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
  const aa=dx*dx+dy*dy+dz*dz;if(aa<1e-12)continue;
  const bb=2*(ax*dx+ay*dy+az*dz),cc=ax*ax+ay*ay+az*az-z.r*z.r;
  const disc=bb*bb-4*aa*cc;if(disc<0)continue;
  const root=Math.sqrt(disc),t1=(-bb-root)/(2*aa),t2=(-bb+root)/(2*aa);
  if((t1>=0&&t1<=1)||(t2>=0&&t2<=1))return true;
 }
 return false;
}
