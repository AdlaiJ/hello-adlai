// Invite-only, four-player matches. The room creator resolves damage and scores.
export function validPose(s){return !!s&&Array.isArray(s.p)&&s.p.length===3&&s.p.every(Number.isFinite)&&Math.abs(s.p[0])<200&&s.p[1]>-40&&s.p[1]<150&&Math.abs(s.p[2])<200&&Array.isArray(s.q)&&s.q.length===4&&s.q.every(v=>Number.isFinite(v)&&Math.abs(v)<=1.01)&&Array.isArray(s.base)&&s.base.length===3&&s.base.every(v=>Number.isFinite(v)&&Math.abs(v)<200)}
export function raySphere(origin,direction,center,radius){const v=center.map((n,i)=>n-origin[i]),t=v.reduce((n,x,i)=>n+x*direction[i],0),d=v.reduce((n,x)=>n+x*x,0)-t*t;if(d>radius*radius)return Infinity;const near=t-Math.sqrt(Math.max(0,radius*radius-d)),far=t+Math.sqrt(Math.max(0,radius*radius-d));return far<0?Infinity:Math.max(0,near)}
export function validDirection(d){return Array.isArray(d)&&d.length===3&&d.every(Number.isFinite)&&Math.abs(Math.hypot(...d)-1)<.02}
export function roomInvite(code){const u=new URL('https://adlaijohnson.com/volt-arena.html');u.searchParams.set('room',code);return u.href}
export const WEAPONS={rifle:{name:'Rifle',delay:150,damage:18,pellets:1,spread:0},shotgun:{name:'Shotgun',delay:800,damage:11,pellets:8,spread:.1},pistols:{name:'Dual pistols',delay:220,damage:23,pellets:1,spread:.012},rocket:{name:'Rocket launcher',delay:1100,damage:70,pellets:1,spread:0}};
export function bubbleSpeed(point,fields){let slow=false,fast=false;for(const f of fields){if(f.age>=.6&&f.age<7.6&&Math.hypot(...point.map((v,i)=>v-f.to[i]))<4){slow ||= f.kind==='slow';fast ||= f.kind==='fast'}}return slow?.55:fast?1.5:1}

export function portalRay(origin,direction,range,pairs){
 const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const valid=p=>Array.isArray(p)&&p.length===6&&p.every(Number.isFinite)&&p.slice(0,3).every(v=>Math.abs(v)<200)&&Math.abs(Math.hypot(...p.slice(3))-1)<.01;
 const basis=n=>{const r=Math.abs(n[1])>.5?[1,0,0]:[n[2],0,-n[0]];return [r,cross(n,r)]};let nearest=null;
 for(const pair of pairs){if(!Array.isArray(pair)||pair.length!==2||!pair.every(valid))continue;
 for(let i=0;i<2;i++){const a=pair[i],b=pair[1-i],n=a.slice(3),out=b.slice(3),denom=dot(direction,n);if(denom>=-1e-6)continue;
 const distance=dot(a.slice(0,3).map((v,k)=>v-origin[k]),n)/denom;if(distance<.00001||distance>range||(nearest&&distance>=nearest.distance))continue;
 const point=origin.map((v,k)=>v+direction[k]*distance),rel=point.map((v,k)=>v-a[k]),[right,up]=basis(n),[exitRight,exitUp]=basis(out),x=dot(rel,right),y=dot(rel,up);
 if((x/.65)**2+(y/.9425)**2>=1)continue;
 const transform=v=>{const x=-dot(v,right),y=dot(v,up),z=-dot(v,n);return out.map((_,k)=>exitRight[k]*x+exitUp[k]*y+out[k]*z)};
 nearest={distance,point,origin:out.map((v,k)=>b[k]-exitRight[k]*x+exitUp[k]*y+v*.04),direction:transform(direction)};
 }}return nearest;
}

export const MAX_PLAYERS=4;
export function freePlayerSlot(used){for(let id=1;id<MAX_PLAYERS;id++)if(!used.has(id))return id;return -1}
export function validMatchState(s){return !!s&&['hp','score','life'].every(k=>Array.isArray(s[k])&&s[k].length===MAX_PLAYERS&&s[k].every(v=>Number.isInteger(v)&&v>=0&&v<100000))&&s.hp.every(v=>v<=100)&&Array.isArray(s.active)&&s.active.length===MAX_PLAYERS&&s.active.every(v=>typeof v==='boolean')}
export function setupOnline(api){
 const {THREE,scene,camera,robot,pos,solidMeshes,solids}=api,$=id=>document.getElementById(id);
 const css=document.createElement('style');css.textContent='#matchLobby{border-top:1px solid #53677b;margin-top:12px;padding-top:10px}#matchLobby button{padding:8px 12px;margin:3px}#matchCode{width:140px;padding:9px;border-radius:6px;background:#22394b;color:white;border:1px solid #61778a}#matchStatus{font-size:12px}#matchHud{position:fixed;top:68px;right:22px;background:#101d2bcc;padding:10px 14px;border-radius:8px;pointer-events:none;font-size:13px}#matchHud{min-width:220px;max-width:calc(100vw - 44px)}#matchHud[hidden]{display:none}.healthLabel{display:flex;justify-content:space-between;font-weight:bold;margin-bottom:7px}.healthTrack{height:15px;background:#253545;border:1px solid #607c8e;border-radius:5px;overflow:hidden}.healthFill{height:100%;width:100%;background:#79ffe4;transition:width .18s ease,background .18s ease}.matchScore{margin-top:8px;color:#c9d8e5;font-size:12px}#hitFlash{position:fixed;inset:0;pointer-events:none;box-shadow:inset 0 0 90px #ff5c5555;opacity:0}';document.head.append(css);
 let weapon='rifle',pistolSide=1;const picker=document.createElement('div');picker.innerHTML='<label for="weapon">Weapon</label><select id="weapon"><option value="rifle">Rifle · automatic</option><option value="shotgun">Shotgun · close-range spread</option><option value="pistols">Dual pistols · alternating shots</option><option value="rocket">Rocket launcher · explosive projectile</option></select><p id="weaponHelp" style="font-size:12px;color:#79f4db">Left click fires; Z fires in drag-to-look mode. Weapons also work in solo practice.</p>';$('abilityHelp').after(picker);
 const lobby=document.createElement('section');lobby.id='matchLobby';lobby.innerHTML='<b>Online arena · up to 4 players</b><div><button id="matchCreate">Create room</button><input id="matchCode" aria-label="Room code" placeholder="room word" maxlength="180" autocomplete="off" autocapitalize="none"><button id="matchJoin">Join</button></div><button id="matchCopy" disabled>Copy invite</button><button id="matchLeave" disabled>Leave room</button><p id="matchStatus" role="status">Share the same room word with up to three friends. Left click fires; use Z in drag-to-look mode. Keep the host page open. Direct connections may be blocked on some networks.</p>';
 picker.after(lobby);const hud=document.createElement('div');hud.id='matchHud';hud.hidden=true;hud.innerHTML='<div class="healthLabel"><span>HEALTH</span><span id="healthValue">100 / 100</span></div><div class="healthTrack" id="healthTrack" role="progressbar" aria-label="Health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="healthFill" id="healthFill"></div></div><div class="matchScore" id="matchScore"></div>';document.body.append(hud);const flash=document.createElement('div');flash.id='hitFlash';document.body.append(flash);
 const freshState=()=>({hp:Array(4).fill(100),score:Array(4).fill(0),life:Array(4).fill(0),active:[true,false,false,false]});
 let peer=null,conn=null,host=false,connected=false,playerId=0,epoch=0,room='',timer=null,reconnectTimer=null,poseClock=0,worldClock=0,lastWorld='',shooting=false,lastShot=0,shotId=0,lastRemoteShot=Array(4).fill(0),lastAccepted=Array(4).fill(-Infinity),state=freshState(),deadUntil=Array(4).fill(0),shieldUntil=Array(4).fill(0),seenLife=Array(4).fill(0),flashTime=0,hitTime=0;
 const links=new Map(),poses=new Map(),worlds=new Map(),localGroups=[],rigs=new Map(),worldMeshes=new Map();
 const myId=()=>playerId,say=t=>$('matchStatus').textContent=t;
 robot.traverse(o=>{if(o.isGroup)localGroups.push(o)});
 const colors=['#79ffe4','#53bbff','#ffa45c','#c28aff'];
 for(let id=0;id<4;id++){const remote=robot.clone(true),groups=[];remote.traverse(o=>{if(o.isGroup)groups.push(o);if(o.isMesh){o.material=o.material.clone();if(o.material.color)o.material.color.lerp(new THREE.Color(colors[id]),.55)}});remote.visible=false;scene.add(remote);
 const rope=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:colors[id]}));rope.visible=false;scene.add(rope);rigs.set(id,{remote,groups,rope,gateKey:'',gateMeshes:[]})}
 const gun=new THREE.Group();camera.add(gun);scene.add(camera);const gunGeo=new THREE.BoxGeometry(1,1,1),gunMat=new THREE.MeshStandardMaterial({color:'#607c96',metalness:.6,roughness:.35});
 function buildGun(){gun.clear();const block=(x,y,z,w,h,d)=>{const m=new THREE.Mesh(gunGeo,gunMat);m.position.set(x,y,z);m.scale.set(w,h,d);gun.add(m)};
 if(weapon==='pistols'){for(const x of [-.3,.3]){block(x,-.27,-.5,.13,.15,.38);block(x,-.38,-.36,.11,.23,.14)}}
 else if(weapon==='rocket'){block(.32,-.27,-.6,.3,.3,.9);block(.32,-.46,-.4,.12,.23,.15);block(.32,-.1,-.65,.1,.08,.22)}
 else{block(.29,-.27,-.55,.18,.19,.6);block(.29,-.4,-.35,.12,.24,.16);block(.29,-.22,-.94,weapon==='shotgun'?.23:.08,.08,.35);block(.29,-.16,-.6,.08,.08,.17)}}
 $('weapon').onchange=()=>{weapon=$('weapon').value;buildGun()};buildGun();gun.visible=false;
 const rockets=[],fields=[],blasts=[];let bubbleClock=Array(4).fill(-Infinity);
 const traces=[];
 function updateRemoteEffects(id){
 const rig=rigs.get(id),remotePose=poses.get(id),remote=rig.remote,remoteRope=rig.rope,gateMeshes=rig.gateMeshes;
  const h=remotePose?.hook;remoteRope.visible=remote.visible&&Array.isArray(h)&&h.length===3&&h.every(v=>Number.isFinite(v)&&Math.abs(v)<200);
  if(remoteRope.visible){const a=remoteRope.geometry.attributes.position;a.setXYZ(0,remote.position.x,remote.position.y+1.2,remote.position.z);a.setXYZ(1,...h);a.needsUpdate=true;remoteRope.geometry.computeBoundingSphere()}
  const gates=remotePose?.gates||[];if(!Array.isArray(gates)||gates.length>2)return;const key=JSON.stringify(gates);if(key===rig.gateKey)return;rig.gateKey=key;
  for(const m of gateMeshes){scene.remove(m);m.geometry.dispose();m.material.dispose()}gateMeshes.length=0;
  gates.forEach((g,i)=>{if(!Array.isArray(g)||g.length!==6||!g.every(Number.isFinite)||g.slice(0,3).some(v=>Math.abs(v)>100)||Math.abs(Math.hypot(...g.slice(3))-1)>.01)return;const m=new THREE.Mesh(new THREE.RingGeometry(.65,.8,32),new THREE.MeshBasicMaterial({color:i?0xffa34d:0x65caff,side:THREE.DoubleSide}));m.position.set(g[0]+g[3]*.03,g[1]+g[4]*.03,g[2]+g[5]*.03);m.scale.y=1.45;m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...g.slice(3)));scene.add(m);gateMeshes.push(m)})
 }
 function deliver(c,m){if(!c?.open)return false;try{c.send(m);return true}catch{return false}}
 function send(m,exclude=-1){if(host){for(const [id,c] of links)if(id!==exclude)deliver(c,m);return true}return deliver(conn,m)}
 function clearRemoteWorld(id){const ids=id===undefined?[...worldMeshes.keys()]:[id];for(const owner of ids){for(const r of worldMeshes.get(owner)||[]){scene.remove(r.mesh);const mi=solidMeshes.indexOf(r.mesh),bi=solids.indexOf(r.box);if(mi>=0)solidMeshes.splice(mi,1);if(bi>=0)solids.splice(bi,1);r.mesh.geometry.dispose();r.mesh.material.dispose()}worldMeshes.delete(owner)}}
 function hidePlayer(id){poses.delete(id);const rig=rigs.get(id);rig.remote.visible=false;rig.rope.visible=false;updateRemoteEffects(id);clearRemoteWorld(id);worlds.delete(id)}
 function cleanup(message='Offline movement practice.'){clearCombat();epoch++;clearTimeout(timer);clearTimeout(reconnectTimer);connected=false;shooting=false;for(let id=0;id<4;id++)hidePlayer(id);for(const c of links.values())clearTimeout(c.joinTimer);links.clear();state=freshState();gun.visible=false;hud.hidden=true;const old=peer;peer=null;conn=null;old?.destroy();playerId=0;$('matchCopy').disabled=true;$('matchLeave').disabled=true;$('matchCreate').disabled=false;$('matchJoin').disabled=false;api.setOnline(false);say(message)}
 function snapshot(){return {weapon,p:robot.position.toArray(),q:robot.quaternion.toArray(),base:pos.toArray(),bones:localGroups.slice(1).map(o=>[...o.position.toArray(),...o.quaternion.toArray(),o.visible?1:0]),ability:api.ability(),hook:api.hook(),gates:api.portals()}}
 function updateHud(){
  hud.hidden=!connected;if(!connected)return;
  const i=myId(),hp=state.hp[i];$('healthValue').textContent=hp+' / 100';
  $('healthTrack').setAttribute('aria-valuenow',String(hp));$('healthFill').style.width=hp+'%';
  $('healthFill').style.background=hp<=25?'#ff5c65':hp<=50?'#ffc45b':'#79ffe4';
  $('matchScore').textContent=(hp<=0?'RESPAWNING… · ':'')+state.active.map((active,id)=>active?((id===i?'YOU':'P'+(id+1))+' '+state.score[id]):null).filter(Boolean).join(' · ')+' | '+state.active.filter(Boolean).length+'/4 · '+room+(hitTime>0?' · HIT':'');
 }
 function receiveState(s){if(!validMatchState(s))return;const id=myId();if(s.hp[id]<state.hp[id])flashTime=.25;state=s;for(let p=0;p<4;p++)if(!s.active[p])hidePlayer(p);if(state.life[id]>seenLife[id]){seenLife[id]=state.life[id];api.spawn(id)}updateHud()}
 function tracer(from,to,who){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from),new THREE.Vector3(...to)]),new THREE.LineBasicMaterial({color:who===myId()?0x79ffe4:0xffad65}));scene.add(line);traces.push({line,life:.09})}
 function baseFor(id){return id===myId()?pos.toArray():poses.get(id)?.base}
 function damage(victim,amount,owner){if(!connected||!state.active[victim]||state.hp[victim]<=0||performance.now()<shieldUntil[victim])return;state.hp[victim]=Math.max(0,state.hp[victim]-amount);if(!state.hp[victim]){if(victim!==owner)state.score[owner]++;deadUntil[victim]=performance.now()+2500}if(victim===myId())flashTime=.25;else hitTime=.2;send({type:'state',state});updateHud()}
 function sphere(at,r,color,opacity=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,10),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1}));m.position.fromArray(at);scene.add(m);return m}
 function dispose(m){scene.remove(m);m.geometry.dispose();m.material.dispose()}
 function addRocket(from,d,owner){rockets.push({mesh:sphere(from,.16,0xffb34d),d:new THREE.Vector3(...d),owner,age:0})}
 function explode(at,owner){blasts.push({mesh:sphere(at,.2,0xff9944,.5),age:0});if(!connected||host){if(connected)for(let id=0;id<4;id++){const base=baseFor(id);if(!base||!state.active[id])continue;const target=new THREE.Vector3(base[0],base[1]+1,base[2]),delta=target.clone().sub(new THREE.Vector3(...at)),dist=delta.length();if(dist>=4)continue;const obstruction=new THREE.Raycaster(new THREE.Vector3(...at),delta.normalize(),.05,dist).intersectObjects(solidMeshes,false)[0];if(!obstruction)damage(id,Math.round(70*(1-dist/4)),owner)}send({type:'blast',at,owner})}}
 function portalPairs(){return [api.portals(),...[...poses.values()].map(p=>p.gates)]}
 function traceBullet(origin,direction,id){let from=origin.slice(),d=direction.slice(),remaining=100;
 for(let hop=0;hop<8&&remaining>.001;hop++){
 const wall=new THREE.Raycaster(new THREE.Vector3(...from),new THREE.Vector3(...d),0,remaining).intersectObjects(solidMeshes,false)[0];let distance=Math.min(remaining,wall?.distance??remaining),hit=-1;
 const gate=portalRay(from,d,remaining,portalPairs());let portal=gate&&gate.distance<=distance+.0001?gate:null;if(portal)distance=portal.distance;
 for(let victim=0;victim<4;victim++){if(victim===id||!state.active[victim]||state.hp[victim]<=0)continue;const target=baseFor(victim);if(connected&&target){const t=Math.min(raySphere(from,d,[target[0],target[1]+.9,target[2]],.55),raySphere(from,d,[target[0],target[1]+1.65,target[2]],.34));if(t<distance){distance=t;hit=victim;portal=null}}}
 const to=from.map((v,k)=>v+d[k]*distance);tracer(from,to,id);send({type:'trace',from,to,who:id,hit:hit>=0});if(hit>=0)return hit;if(!portal)return -1;
 remaining-=distance;from=portal.origin;d=portal.direction;
 }return -1;
 }
 function resolveShot(id,direction,w='rifle'){
 const spec=WEAPONS[w],now=performance.now();if(!spec||!validDirection(direction)||(connected&&state.hp[id]<=0)||now-lastAccepted[id]<spec.delay-10)return;lastAccepted[id]=now;
 const base=baseFor(id);if(!base)return;const origin=[base[0],base[1]+1.5,base[2]],forward=new THREE.Vector3(...direction);
 if(w==='rocket'){addRocket(origin,direction,id);send({type:'rocket',from:origin,d:direction,owner:id});return}
 const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));if(right.length()<.01)right.set(1,0,0);right.normalize();const up=new THREE.Vector3().crossVectors(right,forward).normalize();const totals=Array(4).fill(0);
 for(let i=0;i<spec.pellets;i++){const angle=i*2.39996,spread=spec.spread*Math.sqrt(i+1)/Math.sqrt(spec.pellets),d=forward.clone().addScaledVector(right,Math.cos(angle)*spread).addScaledVector(up,Math.sin(angle)*spread).normalize();const victim=traceBullet(origin,d.toArray(),id);if(victim>=0)totals[victim]+=spec.damage}

 totals.forEach((total,victim)=>{if(total)damage(victim,total,id)});
 }
 function fire(){if(!api.active()||(connected&&state.hp[myId()]<=0))return;const now=performance.now();if(now-lastShot<WEAPONS[weapon].delay)return;lastShot=now;pistolSide*=-1;
 const dir=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize().toArray();if(host||!connected)resolveShot(myId(),dir,weapon);else send({type:'shot',id:++shotId,d:dir,w:weapon});
 }
 function addBubble(from,to,kind){fields.push({from,to,kind,age:0,mesh:sphere(from,.25,kind==='slow'?0xc18aff:0x65ffbc,.22)})}
 function throwBubble(id,d,kind){const now=performance.now();if(!validDirection(d)||!['slow','fast'].includes(kind)||now-bubbleClock[id]<4000||(connected&&state.hp[id]<=0))return;const kit=id===myId()?api.ability():poses.get(id)?.ability;if(kit!=='bubble')return;const base=baseFor(id);if(!base)return;bubbleClock[id]=now;const from=[base[0],base[1]+1.5,base[2]],ray=new THREE.Raycaster(new THREE.Vector3(...from),new THREE.Vector3(...d),0,18),hit=ray.intersectObjects(solidMeshes,false)[0],distance=Math.max(0,(hit?.distance??18)-.4),to=from.map((v,i)=>v+d[i]*distance);addBubble(from,to,kind);send({type:'bubble',from,to,kind})}
 function effects(dt){
 for(let i=rockets.length-1;i>=0;i--){const r=rockets[i];let step=28*dt,collided=false;for(let hop=0;hop<8&&step>.00001;hop++){const ray=new THREE.Raycaster(r.mesh.position,r.d,0,step),hit=ray.intersectObjects(solidMeshes,false)[0];let distance=hit?.distance??Infinity;
 if(host||!connected){for(let id=0;id<4;id++){if(id===r.owner||!state.active[id]||state.hp[id]<=0)continue;const base=baseFor(id);if(base)distance=Math.min(distance,raySphere(r.mesh.position.toArray(),r.d.toArray(),[base[0],base[1]+1,base[2]],.65))}}
 const gate=portalRay(r.mesh.position.toArray(),r.d.toArray(),step,portalPairs());
 if(gate&&gate.distance<=distance+.0001){r.mesh.position.fromArray(gate.origin);r.d.fromArray(gate.direction);step-=gate.distance;continue}
 r.mesh.position.addScaledVector(r.d,Math.min(step,distance));collided=distance<=step;break}
 r.age+=dt;if(collided||r.age>4){const at=r.mesh.position.clone().addScaledVector(r.d,-.05).toArray();dispose(r.mesh);rockets.splice(i,1);if(host||!connected)explode(at,r.owner)}}
 for(let i=fields.length-1;i>=0;i--){const f=fields[i];f.age+=dt;f.mesh.position.fromArray(f.from).lerp(new THREE.Vector3(...f.to),Math.min(1,f.age/.6));f.mesh.scale.setScalar(f.age<.6?1:16);f.mesh.material.opacity=f.age>6.6?Math.max(0,(7.6-f.age)*.22):.22;if(f.age>=7.6){dispose(f.mesh);fields.splice(i,1)}}
 for(let i=blasts.length-1;i>=0;i--){const b=blasts[i];b.age+=dt;b.mesh.scale.setScalar(1+b.age*50);b.mesh.material.opacity=Math.max(0,.5-b.age);if(b.age>.5){dispose(b.mesh);blasts.splice(i,1)}}
 }
 function clearCombat(){for(const a of [rockets,fields,blasts]){for(const v of a)dispose(v.mesh);a.length=0}bubbleClock=Array(4).fill(-Infinity)}
 function syncWorld(data,id){if(!Number.isInteger(id)||id<0||id>=4||id===myId())return;if(!Array.isArray(data)||data.length>720)return;for(const p of data)if(!Array.isArray(p)||p.length!==7||!p.slice(0,6).every(Number.isFinite)||p.slice(0,3).some(v=>Math.abs(v)>80)||p.slice(3,6).some(v=>v<=0||v>8)||typeof p[6]!=='boolean')return;clearRemoteWorld(id);worlds.set(id,data);const remoteWorld=[];worldMeshes.set(id,remoteWorld);for(const [x,y,z,w,h,d,step] of data){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:'#779db7'}));mesh.position.set(x,y,z);mesh.userData.collidable=true;mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);const box={x:x-w/2,X:x+w/2,y:y-h/2,Y:y+h/2,z:z-d/2,Z:z+d/2,step};solidMeshes.push(mesh);solids.push(box);remoteWorld.push({mesh,box})}}
 function keepHostRoom(c,token,message){
 if(token!==epoch)return;if(!host){if(conn===c)cleanup(message);return}
 const id=[...links].find(([,link])=>link===c)?.[0];if(id===undefined)return;
 clearTimeout(c.joinTimer);links.delete(id);state.active[id]=false;hidePlayer(id);c.close();send({type:'state',state});updateHud();say(message+' Room '+room+' stays open ('+state.active.filter(Boolean).length+'/4). Rejoin with the same word.');
 }
 function restoreRoomService(token){
  if(token!==epoch||!peer||peer.destroyed)return;
  clearTimeout(reconnectTimer);
  reconnectTimer=setTimeout(()=>{if(token!==epoch||!peer||peer.destroyed||!peer.disconnected)return;try{peer.reconnect()}catch{}restoreRoomService(token)},2000);
 }
 function bind(c,token,id=0){
 if(!host)conn=c;
 c.on('open',()=>{if(token!==epoch||(host?links.get(id)!==c:conn!==c))return;clearTimeout(c.joinTimer);clearTimeout(timer);
 if(host){state.active[id]=true;state.hp[id]=100;state.score[id]=0;state.life[id]=0;lastAccepted[id]=-Infinity;lastRemoteShot[id]=0;bubbleClock[id]=-Infinity;shieldUntil[id]=performance.now()+2000;
 deliver(c,{type:'welcome',id,state});deliver(c,{type:'pose',id:0,s:snapshot()});for(const [pid,p] of poses)if(pid!==id)deliver(c,{type:'pose',id:pid,s:p});deliver(c,{type:'world',id:0,parts:api.builds()});for(const [pid,parts] of worlds)if(pid!==id)deliver(c,{type:'world',id:pid,parts});for(const f of fields)deliver(c,{type:'bubble',from:f.from,to:f.to,kind:f.kind,age:f.age});send({type:'state',state});say('Room '+room+' · '+state.active.filter(Boolean).length+'/4 players. Share the same word to invite more.');updateHud()}
 });
 c.on('data',m=>{if(token!==epoch||(host?links.get(id)!==c:conn!==c)||!m||typeof m!=='object')return;
 if(!host&&m.type==='full'){cleanup('Room is full (4 players). Ask the host for a free spot.');return}
 if(!host&&m.type==='welcome'){if(!Number.isInteger(m.id)||m.id<1||m.id>3||!validMatchState(m.state))return;playerId=m.id;state=m.state;connected=true;seenLife=state.life.slice();lastWorld='';api.setOnline(true);api.spawn(playerId);say('Joined room '+room+' as Player '+(playerId+1)+'. Up to four players can join.');updateHud();return}
 if(!connected)return;const sender=host?id:m.id;
 if(m.type==='pose'&&Number.isInteger(sender)&&sender>=0&&sender<4&&sender!==myId()&&state.active[sender]&&validPose(m.s)){poses.set(sender,m.s);if(host)send({type:'pose',id:sender,s:m.s},sender);return}
 if(m.type==='world'&&Number.isInteger(sender)&&sender>=0&&sender<4&&state.active[sender]){syncWorld(m.parts,sender);if(host&&worlds.has(sender))send({type:'world',id:sender,parts:worlds.get(sender)},sender);return}
 if(host&&m.type==='throwBubble'){throwBubble(id,m.d,m.kind);return}
 if(host&&m.type==='shot'&&Number.isSafeInteger(m.id)&&m.id>lastRemoteShot[id]){lastRemoteShot[id]=m.id;resolveShot(id,m.d,m.w||'rifle');return}
 const validPoint=p=>Array.isArray(p)&&p.length===3&&p.every(v=>Number.isFinite(v)&&Math.abs(v)<400);
 if(!host&&m.type==='rocket'&&validPoint(m.from)&&validDirection(m.d)&&Number.isInteger(m.owner)&&m.owner>=0&&m.owner<4){addRocket(m.from,m.d,m.owner);return}
 if(!host&&m.type==='blast'&&validPoint(m.at)){blasts.push({mesh:sphere(m.at,.2,0xff9944,.5),age:0});return}
 if(!host&&m.type==='bubble'&&validPoint(m.from)&&validPoint(m.to)&&['slow','fast'].includes(m.kind)){addBubble(m.from,m.to,m.kind);if(Number.isFinite(m.age))fields[fields.length-1].age=Math.max(0,Math.min(7.6,m.age));return}
 if(!host&&m.type==='state')receiveState(m.state);else if(!host&&m.type==='trace'&&[m.from,m.to].every(validPoint)){tracer(m.from,m.to,m.who);if(m.hit&&m.who===myId())hitTime=.2}
 });
 c.on('close',()=>keepHostRoom(c,token,host?'A player disconnected.':'The host closed the room.'));c.on('error',()=>keepHostRoom(c,token,'Connection failed.'));
 }
 let loading;function loadPeer(){if(window.Peer)return Promise.resolve();if(!loading)loading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';script.onload=resolve;script.onerror=()=>{loading=null;script.remove();reject(Error('load'))};document.head.append(script)});return loading}
 const words='amber arrow atlas beach birch bloom cloud coral comet crane delta drift ember flame frost globe grove ivory lemon lunar maple melon ocean olive orbit otter peach pearl prism raven river robin rocket silver solar spark stone storm sugar tiger tulip violet water whale willow winter'.split(' ');
 async function connect(isHost,code='',attempt=0){cleanup();host=isHost;const token=epoch;room=isHost?words[crypto.getRandomValues(new Uint32Array(1))[0]%words.length]:code;say('Connecting…');$('matchCreate').disabled=$('matchJoin').disabled=true;$('matchLeave').disabled=false;timer=setTimeout(()=>{if(token===epoch)cleanup('Connection timed out. Check the room word or try another network.')},25000);
  try{await loadPeer();if(token!==epoch)return;peer=new Peer(isHost?'volt-arena-v2-'+room:undefined,{secure:true,debug:0});peer.on('open',()=>{if(token!==epoch)return;clearTimeout(reconnectTimer);if(connected)return;if(host){clearTimeout(timer);connected=true;playerId=0;state=freshState();api.setOnline(true);api.spawn(0);updateHud();$('matchCode').value=room;$('matchCopy').disabled=false;say('Room '+room+' ready. Share the word or invite; waiting for up to three friends.')}else bind(peer.connect('volt-arena-v2-'+room,{reliable:true,serialization:'json'}),token)});
  peer.on('connection',c=>{if(token!==epoch||!host){c.on('open',()=>c.close());return}const id=freePlayerSlot(new Set(links.keys()));if(id<0){c.on('open',()=>{deliver(c,{type:'full'});setTimeout(()=>c.close(),500)});return}links.set(id,c);bind(c,token,id);c.joinTimer=setTimeout(()=>{if(token===epoch&&!state.active[id])keepHostRoom(c,token,'A player could not connect.')},15000)});peer.on('error',e=>{if(token!==epoch)return;if(e.type==='network'||e.type==='socket-error'||e.type==='socket-closed'){say('Room service interrupted. Reconnecting with the same room word.');restoreRoomService(token);return}if(host&&e.type==='webrtc'){say('A player could not connect. Room '+room+' remains open.');return}if(host&&e.type==='unavailable-id'&&attempt<12){connect(true,'',attempt+1);return}cleanup(e.type==='peer-unavailable'?'Room not found. Check the word and keep the host page open.':'Online connection unavailable. Try again or another network.')});peer.on('disconnected',()=>{if(token!==epoch)return;say('Reconnecting to the room service. Keep this tab open; your room word is still '+room+'.');restoreRoomService(token)});
  }catch{if(token===epoch)cleanup('Could not load online play. Check your connection and try again.')}
 }
 $('matchCreate').onclick=()=>connect(true);$('matchJoin').onclick=()=>{let code=$('matchCode').value.trim().toLowerCase();try{if(code.includes('://'))code=new URL(code).searchParams.get('room')||''}catch{}if(!/^[a-z]{4,6}$/.test(code)){say('Enter a 4–6 letter room word or paste an invite.');return}connect(false,code)};$('matchLeave').onclick=()=>cleanup();$('matchCopy').onclick=async()=>{const u=new URL(roomInvite(room));try{await navigator.clipboard.writeText(u.href);say('Invite copied. Send it to your friend.')}catch{$('matchCode').value=u.href;$('matchCode').select();say('Copy the selected invite link.')}};
 const invite=new URL(location.href).searchParams.get('room');if(invite&&/^[a-z]{4,6}$/.test(invite)){$('matchCode').value=invite;say('Invite ready. Press Join to connect.')}
 addEventListener('mousedown',e=>{if(e.button===0&&document.pointerLockElement&&api.active()){shooting=true;fire()}});addEventListener('mouseup',()=>shooting=false);addEventListener('keydown',e=>{if(e.code==='KeyZ'&&api.active()){shooting=true;fire()}});addEventListener('keyup',e=>{if(e.code==='KeyZ')shooting=false});addEventListener('blur',()=>shooting=false);addEventListener('pagehide',()=>cleanup());
 return {bubble(kind){const d=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).toArray();if(host||!connected)throwBubble(myId(),d,kind);else send({type:'throwBubble',d,kind})},movementScale(){return bubbleSpeed([pos.x,pos.y+1,pos.z],fields)},canMove:()=>!connected||state.hp[myId()]>0,tick(dt){
  effects(dt);if(!api.active())shooting=false;if(shooting)fire();flashTime=Math.max(0,flashTime-dt);hitTime=Math.max(0,hitTime-dt);flash.style.opacity=flashTime>0?'1':'0';gun.visible=api.active()&&!api.third();gun.rotation.z=weapon==='pistols'?pistolSide*Math.max(0,.12-(performance.now()-lastShot)/1000):0;gun.position.z=Math.max(0,.08-(performance.now()-lastShot)/1500);
  for(let i=traces.length-1;i>=0;i--){traces[i].life-=dt;if(traces[i].life<=0){const t=traces.splice(i,1)[0];scene.remove(t.line);t.line.geometry.dispose();t.line.material.dispose()}}
  // Background tabs can stop sending animation snapshots. Only actual connection closure ends a connected room.
  if(!connected)return;if(!api.active())shooting=false;if(shooting)fire();poseClock+=dt;worldClock+=dt;
  if(poseClock>=.05){poseClock=0;send({type:'pose',id:myId(),s:snapshot()});updateHud()}
  if(worldClock>=.2){worldClock=0;const parts=api.builds(),json=JSON.stringify(parts);if(json!==lastWorld){lastWorld=json;send({type:'world',id:myId(),parts})}}
  for(const [id,rig] of rigs){const remotePose=poses.get(id),remote=rig.remote,remoteGroups=rig.groups;remote.visible=id!==myId()&&state.active[id]&&state.hp[id]>0&&!!remotePose;
 if(remote.visible){remote.position.lerp(new THREE.Vector3(...remotePose.p),1-Math.exp(-18*dt));remote.quaternion.slerp(new THREE.Quaternion(...remotePose.q).normalize(),1-Math.exp(-18*dt));if(Array.isArray(remotePose.bones))remotePose.bones.slice(0,remoteGroups.length-1).forEach((b,i)=>{if(Array.isArray(b)&&b.length===8&&b.every(Number.isFinite)&&b.slice(0,3).every(v=>Math.abs(v)<5)&&b.slice(3,7).every(v=>Math.abs(v)<=1.01)){const g=remoteGroups[i+1];g.position.fromArray(b);g.quaternion.fromArray(b,3).normalize();g.visible=!!b[7]}})}updateRemoteEffects(id)}
  if(host){const now=performance.now();for(let id=0;id<4;id++)if(state.active[id]&&state.hp[id]<=0&&now>=deadUntil[id]){state.hp[id]=100;state.life[id]++;shieldUntil[id]=now+1800;if(id===myId()){seenLife[id]=state.life[id];api.spawn(id)}send({type:'state',state});updateHud()}}
 }};
}
