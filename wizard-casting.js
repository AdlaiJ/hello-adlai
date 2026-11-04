// Each spell pairs its spellbook rune with a choreographed formation and an accent.
const designs = new Map();
function formation(motion, entries) {
  for (const token of entries.trim().split(/\s+/)) {
    const [id, hex] = token.split(':');
    designs.set(id, {motion, color:'#'+hex});
  }
}
formation('fountain', 'witchspark:ffe36c bottle-rocket:ff964a thermal-font:87ffeb roman-candle:ff6375 vault-kick:dcff72 second-sun:ffc453');
formation('orbit', 'north-star:9acfff corner-pocket:75f7be catherine-wheel:ff8171 winter-ring:9feaff moonwalk:c1baff wild-hunt:c3f583 dawn-coronation:ffdb72');
formation('fault', 'fault-stitch:f5d95f fork-lightning:9cefff quarry-auger:d89963 worldbreaker:ffb554 fault-cross:f48356 unlace:c0a4ff');
formation('bloom', 'kiln-heart:ff783b crater-bell:eeb971 airburst:fff4a0 overbloom:f789dd heartwood:95dc71 aegis-break:be90ff phoenix-vigil:ffaf38');
formation('ribs', 'grave-squire:d3e4a8 rampart:bdadff bone-wall:f6deb1 bone-spikes:e4d5c5 hedge-hospice:81c76f rising-stair:ffc870 sky-shutter:a4e8f8 last-citadel:d8acff');
formation('weave', 'green-thread:80efb8 last-stitch:b4ffbb glass-graft:9af9ea root-needle:99d981 safety-net:f7b8ff field-dressing:f9c9ad tripwire:ff9bd9');
formation('vortex', 'gravity-well:b58cff lodestone:f287bc undertow:74c8ff hook-and-eye:d2b68c vampire-moth:f298c8 thieves-quill:e4a5ff ward-tax:ffda7f');
formation('fall', 'moon-mortar:d8cdff sky-toll:bda6fa dew-wash:81e1ff lead-anklet:a5b9da lead-bell:c6aba4 siege-clock:f5bf78 pilgrim-salve:7cf7ca');
formation('blades', 'crypt-bow:d3b0ff star-shears:fc9da5 silver-skewer:e0faff glass-fan:93ddff glass-knife:9fffe3 wisp-rapier:b5d7ff rime-axe:80e6ff ember-maul:ff9366 harvest-scythe:d3a5ff midnight-harvest:bc98ff');
formation('gate', 'foxstep:ffab71 hare-moon:efe398 fold-step:fddb89 switchback:a6eafa return-ticket:ffda81 cross-step:ffbfe1 pilgrim-step:f5da86 thunder-road:fff08a comet-retreat:ff9f59');
formation('shell', 'thimble-ward:b6a1ff looking-glass:b1f5ff smoke-skin:cad0ed spark-film:a2eff5 capacitor-shell:fff069 prism-parry:f69bff polar-aegis:81dfff snail-citadel:e0beb0 mirror-post:a2caff');
formation('flock', 'soul-wraith:8fffe1 ember-newt:ff9459 rime-owl:addfff balm-beetle:93ef98 bastion-crab:ffc28c storm-finch:b3caff quarry-mole:cda173 salamander-nest:ffa247 winter-court:aceaff familiar-feast:ffaf85 fire-skull:ff7046');
formation('pendulum', 'sundial-mine:ffcc73 hemlock-clock:e4acff vowbreaker:d69ce3 hush-feather:bbabe7 second-draft:83decf glass-receipt:c0fbf9 crimson-ledger:ef8189');
formation('altar', 'pocket-poultice:97f6bc lantern-well:ffdb90 root-tea:c2e59b tithe-dome:c4adff iron-choir:d1bbec pressure-valve:c8eeee');
formation('trail', 'comet-train:ffae72 recoil-rose:fc9ab3 cinder-brand:ff936b fevervine:bcdd77 mute-marsh:a2a580 peel-gilt:ffe294');

const TAU=Math.PI*2;
function formationPoint(motion,t,i,n){
  const lane=(i+.5)/n, a=lane*TAU, turn=t*TAU;
  switch(motion){
    case 'fountain': return [Math.sin(a)*(.16+.68*t),.8-1.6*t+.18*Math.sin(turn+a)];
    case 'orbit': return [Math.cos(a+turn)*.86,Math.sin(a+turn)*(.44+.24*t)];
    case 'fault': return [lane*1.6-.8+.13*Math.sin(turn+i*4),.84-1.68*t+.12*Math.sin(i*7)];
    case 'bloom': return [Math.cos(a)*(.14+.72*t),Math.sin(a)*(.14+.72*t)];
    case 'ribs': return [lane*1.56-.78,.72-t*(1.2+.3*Math.cos(a))];
    case 'weave': return [t*1.6-.8,.51*Math.sin(turn*1.5+a)];
    case 'vortex': return [Math.cos(a+turn*1.5)*(.9-.78*t),Math.sin(a+turn*1.5)*(.9-.78*t)];
    case 'fall': return [lane*1.6-.8+.12*Math.sin(turn+a),-.82+1.6*t*t];
    case 'blades': return [Math.cos(a)*(.9-1.65*t),Math.sin(a)*(.9-1.65*t)+.26*Math.sin(Math.PI*t)];
    case 'gate': return [Math.sin(turn+a)*.85,Math.sin(2*turn+2*a)*.42];
    case 'shell': return [Math.cos(a)*(.85-.24*t),Math.sin(a)*(.85-.24*t)];
    case 'flock': return [Math.cos(a+turn)*.72,Math.sin(a+turn)*.42+.19*Math.sin(3*turn+a)];
    case 'pendulum': return [.75*Math.sin(turn+a),.55*Math.cos(Math.sin(turn+a)*2)-.18];
    case 'altar': return [Math.cos(a)*(.75-.44*t),.65-1.25*t];
    case 'trail': return [1.65*t-.82,.38*Math.sin(turn+a)+.25*Math.cos(a)];
  }
}
// A rune's own cadence and slant distinguish spells within a shared formation.
function trace(d,t,i){
  const beat=Math.pow(t,d.cadence);
  const [x,y]=formationPoint(d.motion,beat,i,d.count);
  const curl=.12*Math.sin(Math.PI*t)*Math.sin(t*TAU*d.harmonic+i);
  return [x*d.cos-y*d.sin+curl,y*d.cos+x*d.sin];
}
export function castingDesign(spell){
  const design=designs.get(spell.id);
  if(!design)throw new Error('Missing casting design for '+spell.id);
  const power=Math.min(1,Math.sqrt(spell.cost/900));
  const seed=[...spell.id].reduce((v,c)=>(Math.imul(v,31)+c.charCodeAt(0))>>>0,0);
  const angle=((seed%101)/100-.5)*.8;
  return {...design,cos:Math.cos(angle),sin:Math.sin(angle),cadence:.72+(seed%137)/100,harmonic:1+(seed%4),power,size:8+44*power,count:3+Math.round(8*power),rune:spell.symbol};
}
export function makeCastPainter(THREE,scene,spells,worldHeight){
  const catalog=new Map(spells.map(s=>[s.id,{...castingDesign(s),duration:Math.max(.016,s.time)}]));
  const pool=[];
  function make(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=192;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
    scene.add(sprite);
    return {sprite,texture,ctx:canvas.getContext('2d')};
  }
  function paint(slot,d,age,progress){
    const c=slot.ctx;c.clearRect(0,0,192,192);c.save();c.translate(96,96);
    c.strokeStyle=c.fillStyle=d.color;c.lineWidth=2+d.power*2;c.lineCap='round';
    const phase=age*(.95+d.power*.35);
    for(let i=0;i<d.count;i++){
      const t=(phase+i*.137)%1;c.beginPath();
      for(let j=0;j<=10;j++){
        const [x,y]=trace(d,Math.max(0,t-(10-j)*.022),i);
        if(j===0)c.moveTo(x*83,y*83);else c.lineTo(x*83,y*83);
      }
      c.stroke();const [x,y]=trace(d,t,i);
      c.beginPath();c.arc(x*83,y*83,2+2*d.power,0,TAU);c.fill();
    }
    if(d.power>.39){c.globalAlpha=.65;c.beginPath();c.arc(0,0,83,phase,phase+TAU*progress);c.stroke()}
    c.globalAlpha=1;c.fillStyle='white';c.shadowBlur=8;c.shadowColor=d.color;
    c.font='bold '+Math.round(29+13*progress)+'px "Segoe UI Symbol","Segoe UI Emoji",sans-serif';
    c.textAlign='center';c.textBaseline='middle';c.fillText(d.rune,0,0);c.restore();slot.texture.needsUpdate=true;
  }
  return function draw(players,now,camera,me,closeView){
    let used=0;
    for(const [index,p] of players.entries()){
      const d=catalog.get(p.castVisual),age=now-p.castStarted;
      if(!d||p.hp<=0||age<0||age>d.duration+.28)continue;
      const slot=pool[used]??(pool[used]=make());used++;
      const progress=Math.min(1,age/d.duration),frame=Math.floor(age*30);
      if(slot.frame!==frame||slot.id!==p.castVisual){paint(slot,d,age,progress);slot.frame=frame;slot.id=p.castVisual}
      const sprite=slot.sprite;sprite.visible=true;
      sprite.material.opacity=Math.min(1,(d.duration+.28-age)/.28);
      const size=d.size*(.72+.28*progress);
      if(closeView&&index===me){
        sprite.position.set(2,-1.2,-7).applyQuaternion(camera.quaternion).add(camera.position);
        sprite.scale.setScalar(1.2+size*.038);
      }else{
        sprite.position.set(p.x+Math.cos(p.castYaw)*9,worldHeight-p.y+29,p.z+Math.sin(p.castYaw)*9);
        sprite.scale.setScalar(size);
      }
    }
    for(let i=used;i<pool.length;i++)pool[i].sprite.visible=false;
  };
}
