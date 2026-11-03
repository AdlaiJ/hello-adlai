// History contains only this life; consuming an echo removes it permanently.
export function aimedEcho(history,eye,dir,blocked){let best=null,score=.965;for(const h of history){const d=h.p.map((v,i)=>v+(i===1?1:0)-eye[i]),len=Math.hypot(...d);if(len<.4)continue;const dot=d.reduce((s,v,i)=>s+v*dir[i],0)/len;if(dot>score&&!blocked(eye,d.map(v=>v/len),len)){score=dot;best=h}}return best}
export function createAfterimage(api){let history=[],clock=0,age=0,serial=0,cooldown=0,rewinding=false;const remove=h=>api.remove(h.mesh);
 function clear(){history.forEach(remove);history=[];clock=0;age=0;rewinding=false;cooldown=0;api.clear?.()}
 function consume(index,blast){const removed=history.splice(index);for(const h of removed){remove(h);api.consume(h.id,blast&&h===removed[0])}return removed[0]}
 function step(dt,held){age+=dt;cooldown=Math.max(0,cooldown-dt);while(history.length&&age-history[0].time>8){const h=history.shift();remove(h)}
 rewinding=held&&history.length>0;if(rewinding){clock=0;const h=history.at(-1),p=api.position(),d=h.p.map((x,i)=>x-p[i]),distance=Math.hypot(...d),travel=Math.min(distance,30*dt),next=p.map((x,i)=>x+(distance?d[i]/distance*travel:0));if(!api.free(next)){rewinding=false;return false}api.move(next);if(distance<=travel+.001){consume(history.length-1,true)}return true}
 clock+=dt;const p=api.position();if(!held&&clock>=.4&&(!history.length||Math.hypot(...p.map((v,i)=>v-history.at(-1).p[i]))>.8)&&api.free(p)){clock=0;const h={id:++serial,p:p.slice(),time:age,yaw:api.yaw()};h.mesh=api.make(h.p,h.yaw);history.push(h);api.record(h.id,h.p,h.yaw);if(history.length>16)remove(history.shift())}return false}
 function target(eye,dir){return aimedEcho(history,eye,dir,api.blocked)}
 function jump(eye,dir){if(cooldown>0)return false;const h=target(eye,dir);if(!h||!api.free(h.p))return false;api.move(h.p);consume(history.indexOf(h),false);cooldown=2;clock=0;return true}
 function retreat(){const h=history.at(-1);if(!h||!api.free(h.p))return false;api.move(h.p);consume(history.length-1,false);clock=0;return true}
 return {step,jump,clear,target,retreat,get count(){return history.length},get cooldown(){return cooldown},get rewinding(){return rewinding}};
}
