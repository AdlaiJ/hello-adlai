// All models point along local +Y. Keep pose nodes below the root so ricochets and
// multiplayer interpolation can reorient the entire projectile independently.
export function makeProjectileArt(THREE) {
  const tau = Math.PI * 2;
  const shapes = new Map(), materials = new Map();
  function cached(key, create) {
    if (!shapes.has(key)) shapes.set(key, create());
    return shapes.get(key);
  }
  const gem = cached('gem', () => new THREE.OctahedronGeometry(1));
  const stone = cached('stone', () => new THREE.IcosahedronGeometry(1));
  const ball = cached('ball', () => new THREE.SphereGeometry(1, 14, 10));
  const cone = cached('cone', () => new THREE.ConeGeometry(1, 1, 9));
  const rod = cached('rod', () => new THREE.CylinderGeometry(1, 1, 1, 10));
  const ring = cached('ring', () => new THREE.TorusGeometry(1, .12, 6, 22));
  const box = cached('box', () => new THREE.BoxGeometry(1, 1, 1));
  function paint(color, type='lit') {
    const key=type+color;
    if (!materials.has(key)) {
      const material=type==='lit'
        ? new THREE.MeshStandardMaterial({color,roughness:.57,metalness:.16,flatShading:true})
        : new THREE.MeshBasicMaterial({color,vertexColors:type==='wake',transparent:type==='wake',opacity:type==='wake'?.78:1,depthWrite:type!=='wake'});
      materials.set(key,material);
    }
    return materials.get(key);
  }
  function silhouette(name, points, depth=.18) {
    return cached(name,()=>{
      const shape=new THREE.Shape();
      points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
      const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});
      geometry.translate(0,0,-depth/2);return geometry;
    });
  }
  function star(name,points,inner) {
    return silhouette(name,Array.from({length:points*2},(_,i)=>{
      const a=Math.PI/2+i*Math.PI/points,r=i%2?inner:1;
      return [r*Math.cos(a),r*Math.sin(a)];
    }));
  }
  const spark=star('star4',4,.24),compass=star('star8',8,.48);
  const crescent=silhouette('crescent',[[-.83,.55],[-.45,.99],[.18,1.04],[.74,.69],[.99,.12],[.88,-.47],[.42,-.91],[-.2,-.99],[-.72,-.69],[-.92,-.39],[-.38,-.61],[.12,-.55],[.44,-.22],[.45,.22],[.19,.56],[-.24,.7]],.23);
  const feather=silhouette('feather',[[-.04,-1],[-.43,-.37],[-.55,.02],[-.29,-.08],[-.55,.27],[-.5,.59],[-.29,.83],[.22,1.06],[.49,.57],[.46,.29],[.2,.09],[.41,.15],[.35,-.25],[.13,-.62]],.13);
  const leaf=silhouette('leaf',[[0,-1],[-.48,-.33],[-.65,.22],[-.54,.61],[-.24,.78],[.18,1.08],[.56,.53],[.49,.06],[.28,-.35]],.22);
  const shard=silhouette('shard',[[-.46,-.9],[-.72,-.36],[.19,1.24],[.53,.91],[.38,-.44]],.32);
  const zig=silhouette('bolt',[[-.66,-.96],[-.18,-.12],[-.64,-.2],[.13,.68],[.78,1.18],[.43,.19],[.84,.26]],.22);
  const heart=silhouette('heart',[[0,-1],[-.77,-.21],[-.94,.29],[-.84,.69],[-.56,.91],[-.26,.9],[0,.66],[.27,.9],[.61,.92],[.91,.66],[.97,.19],[.76,-.23]],.48);
  const hook=silhouette('hook',[[-.2,-.89],[.16,-.89],[.15,.41],[.27,.68],[.49,.77],[.74,.56],[.79,.25],[.52,.28],[.85,-.17],[1,.35],[.99,.67],[.75,.98],[.37,1.06],[.01,.92],[-.2,.61]],.27);
  const magnet=silhouette('horseshoe',[[-.94,.78],[-.53,.78],[-.53,-.23],[-.39,-.5],[0,-.63],[.39,-.5],[.53,-.23],[.53,.78],[.94,.78],[.94,-.25],[.78,-.69],[.46,-.94],[0,-1.02],[-.46,-.94],[-.78,-.69],[-.94,-.25]],.4);
  const wing=silhouette('wing',[[0,.2],[.82,.95],[1.38,.84],[1.2,.13],[.8,-.03],[1.04,-.24],[.84,-.76],[.36,-.55]],.12);
  const halfSeal=silhouette('wax',[[-.13,1],[-.68,.87],[-1,.38],[-.97,-.41],[-.61,-.82],[-.08,-.98],[-.25,-.46],[.04,-.19],[-.26,.19],[-.04,.48]],.29);
  function knotGeometry(name,paths) {
    // Narrow tapered tubes stay visible from the side and along the flight axis.
    return cached(name,()=>{
      const positions=[],colors=[],triangles=[];
      for(const path of paths){
        const base=positions.length/3;
        for(let j=0;j<path.length;j++){
          const [x,y,z,r]=path[j],a=path[Math.max(j-1,0)],b=path[Math.min(j+1,path.length-1)];
          const tangent=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
          const across=new THREE.Vector3().crossVectors(tangent,Math.abs(tangent.x)<.8?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1)).normalize();
          const up=new THREE.Vector3().crossVectors(tangent,across),brightness=1-.62*j/(path.length-1);
          for(let s=0;s<5;s++){
            const angle=tau*s/5,ca=r*Math.cos(angle),sa=r*Math.sin(angle);
            positions.push(x+across.x*ca+up.x*sa,y+across.y*ca+up.y*sa,z+across.z*ca+up.z*sa);
            colors.push(brightness,brightness,brightness);
            if(j){const i=base+(j-1)*5+s,k=base+(j-1)*5+(s+1)%5;triangles.push(i,k,i+5,i+5,k,k+5)}
          }
        }
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(triangles);g.computeVertexNormals();return g;
    });
  }
  function trail(style) {
    return cached('trail/'+style,()=>{
      let paths=[];
      if(style==='chain'){
        for(let j=0;j<5;j++)paths.push(Array.from({length:12},(_,i)=>{
          const a=tau*i/11,y=-.9-j*.42+Math.cos(a)*.29,side=Math.sin(a)*.15;
          return [j%2?side:0,y,j%2?0:side,.057-j*.007];
        }));
      }else{
        const braids=({split:2,coil:1,braid:2,rush:3,flare:3,arc:2,quill:1,fall:3,wisp:1})[style]||1;
        for(let k=0;k<braids;k++)paths.push(Array.from({length:19},(_,i)=>{
          const u=i/18,a=k*tau/braids,sign=k%2?-1:1;
          let x=Math.cos(a)*.2,z=Math.sin(a)*.2,r=.16,length=2.9;
          switch(style){
            case 'split': x=sign*(.23+.45*Math.sin(u*Math.PI));z=-sign*.2*u;break;
            case 'coil':case 'braid': {const b=a+u*tau*1.4,rad=.3+.3*u;x=Math.cos(b)*rad;z=Math.sin(b)*rad;r=.12;break}
            case 'rush': x=Math.cos(a)*(.48-.28*u);z=Math.sin(a)*(.48-.28*u);length=3.8-.4*k;r=.085;break;
            case 'arc': x=sign*(.3+.4*Math.sin(u*2.1));z=Math.sin(u*tau+.8*k)*.18;r=.09;break;
            case 'flare': x=Math.cos(a)*(.35+.34*Math.sin(u*5))*(1-u*.35);z=Math.sin(a)*(.35+.34*Math.sin(u*5));r=.31;break;
            case 'quill':x=.32*Math.sin(u*5);z=.3*u;length=2.1;r=.12;break;
            case 'fall':x=Math.cos(a)*(.12+.61*u);z=Math.sin(a)*(.12+.61*u);length=2.1+.35*k;r=.13;break;
            case 'wisp':x=Math.sin(u*6)*.42;z=Math.cos(u*5)*.2;length=3.2;r=.22;break;
          }
          return [x,-.5-length*u,z,Math.max(.016,r*(1-u))];
        }));
      }
      return knotGeometry('path/'+style,paths);
    });
  }
  const helix=knotGeometry('thread',[Array.from({length:30},(_,i)=>{
    const u=i/29,r=.82*(1-.77*u),a=tau*2.4*u;return [Math.cos(a)*r,-.8+u*2,Math.sin(a)*r,.08];
  })]);
  // Cant emblem-like projectiles so their faces are readable looking straight downrange.
  const canted=new Set(['kiln-heart','cinder-brand','north-star','moon-mortar','undertow','hush-feather',
    'vampire-moth','hook-and-eye','peel-gilt','thieves-quill','lead-anklet','hemlock-clock','vowbreaker',
    'unlace','lodestone','midnight-harvest','fork-lightning','familiar-storm']);

  return function build(style){
    const root=new THREE.Group(),core=new THREE.Group(),wake=new THREE.Group();root.add(core,wake);
    const tilt=canted.has(style)?.57:0;
    core.rotation.order='YXZ';
    let spin=2.6,roll=0,wobble=.07,trailSpin=-.8,cycle=()=>{};
    function mesh(g,color,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,type='lit',parent=core){
      const m=new THREE.Mesh(g,paint(color,type));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
    }
    function bright(g,color,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,parent=core){
      return mesh(g,color,x,y,z,sx,sy,sz,'bright',parent);
    }
    function band(color,y,r,lean=0){
      const m=mesh(ring,color,0,y,0,r);m.rotation.x=Math.PI/2+lean;return m;
    }
    function stream(name,color){return mesh(trail(name),color,0,0,0,1,1,1,'wake',wake)}
    function beads(color,n,r=.17,spread=.48){
      const drops=Array.from({length:n},()=>bright(stone,color,0,0,0,r,r,r,wake));
      return t=>drops.forEach((m,i)=>{
        const u=((t*.96+i/n)%1+1)%1,a=t*1.3+i*2.4;
        m.position.set(Math.cos(a)*spread*(.3+u),-.5-2.4*u,Math.sin(a)*spread*(.3+u));m.scale.setScalar(r*(1-u*.78));
      });
    }
    switch(style){
      case 'quarry-volley': {
        mesh(box,0xa88a67,0,0,0,2);
        mesh(box,0xc1a27b,0,.99,0,2,.05,2);spin=1.4;break;
      }
      case 'meteor-storm': {
        mesh(stone,0x433035,0,0,0,1.1,1,.94);
        band(0xff972c,0,1,.35);bright(gem,0xffbc5c,.54,.18,.52,.41);
        stream('flare',0xff612b);cycle=beads(0xffab46,6,.24,.7);spin=3;break;
      }
      case 'fire-skull': {
        mesh(ball,0xffdc9b,0,0,0,1,.88,.84);
        for(const side of [-1,1]){
          mesh(ball,0x451a22,side*.43,.68,.12,.37,.22,.34);
          bright(ball,0xff6824,side*.43,.84,.15,.18,.12,.18);
        }
        for(let i=-2;i<=2;i++)mesh(shard,0xffe7bd,i*.23,.65,-.48,.14,.35,.16);
        stream('flare',0xff5220);cycle=beads(0xffa32d,7,.24,.87);spin=.35;break;
      }
      case 'witchspark': {
        bright(spark,0xffc956,0,0,0,.94,1.12,1);bright(spark,0xfff6bb,0,0,0,.59,1.03,1).rotation.y=Math.PI/2;
        stream('wisp',0xff983d);spin=7;break;
      }
      case 'kiln-heart': {
        mesh(heart,0x922e30,0,0,0,1.02,1.03,1.65);
        bright(zig,0xffbc43,-.03,-.04,.43,.38,.78,.4);
        mesh(stone,0xbe4f32,-.46,.28,-.16,.53,.58,.54);stream('flare',0xff6427);cycle=beads(0xffb841,3,.18,.8);spin=2;break;
      }
      case 'cinder-brand': {
        bright(cached('brand-frame',()=>new THREE.TorusGeometry(.91,.12,4,4)),0xff7337,0,.03,0,.96,.96,.5);
        bright(zig,0xffe09c,0,.04,0,.53,.72,.8);bright(zig,0xef526d,0,.04,0,.47,.68,.8).rotation.y=Math.PI/2;
        stream('arc',0xef5d59);spin=3.6;break;
      }
      case 'nest-hatchling': {
        mesh(ball,0xdf5629,0,0,0,.55,.92,.4);
        mesh(ball,0xff8c3c,0,.78,0,.62,.48,.42);
        mesh(shard,0xc74725,.12,-1,0,.32,1,.24).rotation.z=.23;
        for(const side of [-1,1]){
          bright(ball,0xffe585,side*.37,.98,.24,.15);
          for(const y of [-.44,.38])mesh(ball,0xc94a26,side*.54,y,.03,.43,.15,.17).rotation.z=side*.36;
        }
        stream('flare',0xff7334);spin=.15;break;
      }
      case 'salamander-nest': {
        mesh(stone,0x683b32,0,0,0,.83,1.06,.83);band(0xff9d42,-.03,.81,.29);band(0xb86c39,-.45,.64,-.2);
        for(const sign of [-1,1])mesh(leaf,0xa7ac5e,sign*.35,-.71,0,.53,.67,.6).rotation.z=sign*.72;
        stream('coil',0xf68b45);spin=2.2;break;
      }
      case 'glass-fan': {
        mesh(shard,0x7dd9ec,0,0,0,.94,1.2,.8);bright(shard,0xdaffff,.12,.07,.15,.32,1.0,.3);
        mesh(shard,0x82a9f5,-.31,-.34,-.1,.38,.62,.9).rotation.z=-.36;
        stream('split',0x9adfea);spin=5;break;
      }
      case 'corner-pocket': {
        mesh(ball,0x16888b,0,0,0,.9);band(0xf1e6bc,0,.88,.45);
        mesh(ball,0xfff3d0,.58,.24,.48,.31,.31,.18);bright(ball,0xffffff,-.51,.48,.5,.13);
        cycle=beads(0x8df9df,5,.23,.65);spin=5.4;roll=2.2;break;
      }
      case 'north-star': {
        bright(compass,0xffd879,0,0,0,1.08);mesh(gem,0xffefbb,0,0,.04,.43,.62,.53);
        mesh(ring,0xdc9d48,0,.04,0,.78,.78,.76).rotation.y=.71;
        stream('braid',0xffdd99);cycle=beads(0xfff6cd,3,.12);spin=3;roll=.66;break;
      }
      case 'silver-skewer': {
        mesh(cone,0xebf3fa,0,.51,0,.41,1.84,.41);mesh(rod,0x496087,0,-.73,0,.14,1.65,.14);
        mesh(box,0xffdb8b,0,-.28,0,1.44,.18,.24);bright(gem,0xf9ffff,0,-.33,.13,.18);
        stream('rush',0xccecff);spin=5.5;wobble=0;break;
      }
      case 'moon-mortar': {
        mesh(ball,0xbcc8df,0,0,0,.92);mesh(ball,0x808ba9,.6,.46,.45,.24,.18,.17);mesh(ball,0x8d99b6,-.42,-.56,.62,.24,.2,.16);
        const orbit=bright(crescent,0xfddd9f,0,0,0,1.22,1.18,.75);orbit.rotation.y=.55;
        stream('wisp',0xb7a2e8);cycle=beads(0xd4cef7,3,.14);spin=1.7;break;
      }
      case 'undertow': {
        mesh(rod,0x889ba8,0,.12,0,.13,1.68,.13);mesh(box,0xcadfe4,0,.41,0,1.3,.18,.22);
        for(const sign of [-1,1]){const arm=mesh(hook,0x557c91,sign*.12,.02,0,sign*.81,.88,.94);arm.rotation.z=Math.PI}
        mesh(ring,0x9fc4cb,0,-.87,0,.33);
        stream('chain',0x8fd0e1);spin=2.1;break;
      }
      case 'hush-feather': {
        const plume=mesh(feather,0xc5a3f2,-.09,.08,0,1.15,1.14,.56);plume.rotation.z=-.21;
        bright(gem,0xffdeff,.02,-.16,.05,.085,1.09,.09);stream('quill',0xbe86dd);
        cycle=t=>plume.rotation.y=.39*Math.sin(t*6);spin=1.55;wobble=.19;break;
      }
      case 'root-needle': {
        mesh(cone,0x6d5331,0,.23,0,.37,2.33,.37);mesh(leaf,0x79ba5b,-.36,-.37,0,.63,.66,.75).rotation.z=.92;
        mesh(leaf,0xb4d36c,.32,-.6,0,.49,.58,.65).rotation.z=-.78;
        stream('coil',0x83ab54);spin=4.5;break;
      }
      case 'vampire-moth': {
        mesh(gem,0x493957,0,0,0,.28,.87,.29);
        const wings=[-1,1].map(sign=>mesh(wing,0xba6089,sign*.08,.02,0,sign*.98,.89,.6));
        for(const sign of [-1,1])bright(ball,0xc1ffd8,sign*.13,.51,.19,.11);
        stream('split',0x8feab9);cycle=t=>wings.forEach((m,i)=>m.rotation.y=(i?1:-1)*(.06+.7*Math.sin(t*15)));spin=.8;wobble=.2;break;
      }
      case 'roman-candle': {
        mesh(rod,0xce4156,0,-.09,0,.53,1.34,.53);band(0xffda8e,.27,.53);band(0xffda8e,-.44,.53);
        bright(cone,0xffbd59,0,.73,0,.55,.66,.55);stream('braid',0xff6c61);cycle=beads(0xffde7e,5,.22,.9);spin=8;break;
      }
      case 'airburst': {
        mesh(ball,0x688ea1,0,-.02,0,.85);band(0xcad8ce,0,.85);mesh(rod,0xebc080,0,.78,0,.36,.33,.36);
        const fuse=bright(star('fuse-star',6,.22),0xffe09a,0,1.06,0,.45);stream('fall',0xd1edf1);
        cycle=t=>fuse.scale.setScalar(.32+.16*(.5+.5*Math.sin(t*21)));spin=4;break;
      }
      case 'fork-lightning': {
        bright(zig,0xfff4b8,0,0,0,.84,1.24,1);bright(zig,0xffb74a,-.55,-.16,.07,.48,.64,.47).rotation.z=.54;
        bright(zig,0xb8e9ff,.31,-.44,-.13,.55,.77,.67).rotation.y=.95;
        const trail=stream('rush',0xfdd575);cycle=t=>trail.scale.x=.75+.3*Math.sin(t*26);spin=5.4;break;
      }
      case 'quarry-auger': {
        mesh(cone,0x727e8d,0,.19,0,.83,2.16,.83);mesh(helix,0xf4c76f);mesh(rod,0x4c5969,0,-.86,0,.71,.45,.71);
        stream('coil',0xcd9f63);cycle=beads(0xd2a67a,3,.13);spin=14;break;
      }
      case 'recoil-rose': {
        mesh(cone,0x768145,0,.36,0,.34,2.12,.34);
        for(let i=0;i<5;i++){const a=tau*i/5,m=mesh(leaf,i%2?0xe74573:0xfa7b87,Math.cos(a)*.39,-.4,Math.sin(a)*.39,.58,.63,.55);m.rotation.y=-a+Math.PI/2;m.rotation.x=.48}
        bright(gem,0xffbf89,0,-.55,0,.39,.44,.39);stream('arc',0xe87d8c);spin=6;break;
      }
      case 'hook-and-eye': {
        mesh(hook,0xe8b65b,-.33,.03,0,.97,1.05,.97);mesh(ring,0xffdc88,-.37,-.91,0,.35);
        const loop=stream('coil',0xdfb88e);loop.position.x=-.35;cycle=t=>loop.rotation.y=t*2.6;spin=2.7;break;
      }
      case 'peel-gilt': {
        mesh(leaf,0xffcd57,-.08,.03,0,1.18,1.02,1.62).rotation.z=-.29;
        bright(crescent,0xffeda6,.13,-.15,.17,.62,.75,.41);mesh(leaf,0xbd813d,.51,-.66,-.18,.44,.51,.83);
        stream('quill',0xf6c35c);cycle=beads(0xffda78,4,.18,.86);spin=4.1;wobble=.19;break;
      }
      case 'thieves-quill': {
        mesh(feather,0x3b2e54,-.1,-.14,0,.91,.94,.89).rotation.z=.16;
        mesh(cone,0xffcc80,.11,.84,0,.25,.94,.19);bright(gem,0xbe8de7,0,-.17,.11,.09,1.06,.08);
        stream('quill',0x75509a);cycle=beads(0x9772d8,3,.21,.48);spin=2;break;
      }
      case 'lead-anklet': {
        mesh(ring,0x69717d,0,.37,0,.84,.62,1.29);mesh(box,0xa78965,.73,.31,0,.41,.52,.48);
        mesh(ring,0xa1a8b2,-.38,-.13,0,.26,.41,.24).rotation.y=.65;
        const weight=mesh(stone,0x414452,-.39,-.68,0,.63,.59,.63);
        stream('chain',0x9a91aa);cycle=t=>weight.position.x=-.35+.19*Math.sin(t*7);spin=3.1;break;
      }
      case 'hemlock-clock': {
        mesh(ball,0x98713a,0,0,0,.9,.94,.36);mesh(ball,0xb8c38f,0,.02,.15,.79,.8,.23);
        mesh(ring,0xf2cd7b,0,0,.16,.88,.9,.55);mesh(ring,0xb79555,0,.97,0,.25);
        const hand=mesh(gem,0x3f5947,0,.23,.42,.067,.32,.07);
        for(let k=0;k<4;k++){const a=k*Math.PI/2;mesh(box,0x465444,Math.cos(a)*.61,Math.sin(a)*.63,.33,.1,.12,.08)}
        stream('coil',0x9eb875);cycle=t=>{const a=Math.floor(t*8)*Math.PI/6;hand.position.set(.24*Math.sin(a),.24*Math.cos(a),.42);hand.rotation.z=-a};spin=2.15;break;
      }
      case 'fevervine': {
        mesh(gem,0xa3b942,0,.14,0,.55,1.04,.54);mesh(helix,0x63558b,0,-.02,0,1.09);
        for(let k=0;k<3;k++){const a=tau*k/3;mesh(cone,0xef84ab,Math.cos(a)*.46,.15-k*.3,Math.sin(a)*.46,.2,.7,.2).rotation.z=.45}
        stream('braid',0xc6779a);cycle=beads(0xbfd970,3,.18,.73);spin=4.6;break;
      }
      case 'vowbreaker': {
        const halves=[mesh(halfSeal,0x9f3657,-.07,.01,0,.87,.9,.96),mesh(halfSeal,0xba4168,.06,.04,0,-.87,.9,.96)];
        bright(zig,0xffdba3,0,.02,0,.27,.74,.92);
        for(const sign of [-1,1])mesh(box,0xf9c885,sign*.31,-.85,-.09,.35,.68,.09).rotation.z=sign*.18;
        stream('split',0xcc7199);cycle=t=>{const split=.12+.08*Math.sin(t*5.4);halves[0].position.x=-split;halves[1].position.x=split};spin=2.9;break;
      }
      case 'mute-marsh': {
        mesh(ball,0x778c5b,0,0,0,.65,1,.64);mesh(rod,0x78804e,0,-.77,0,.14,.63,.14);
        for(let k=0;k<3;k++){const a=tau*k/3;const petal=mesh(leaf,k%2?0x6a774b:0x92a879,Math.cos(a)*.42,-.23,Math.sin(a)*.42,.53,.86,.59);petal.rotation.y=-a+Math.PI/2;petal.rotation.x=.27}
        bright(ball,0xc1c0eb,0,.84,0,.23);cycle=beads(0x9bbca9,5,.22,.93);spin=2.7;break;
      }
      case 'unlace': {
        const eyelets=[mesh(ring,0xf2b1c2,-.47,.03,0,.44,.64,.55),mesh(ring,0x92dfd9,.47,.03,0,.44,.64,.55)];
        const strand=stream('braid',0xf1a0b8);strand.position.y=.54;
        const strand2=stream('arc',0x92d5d6);strand2.position.y=.45;
        cycle=t=>eyelets.forEach((m,i)=>{const sign=i?1:-1;m.position.x=sign*(.46+.13*Math.sin(t*6));m.rotation.y=sign*.58*Math.sin(t*5.2)});
        spin=3.4;trailSpin=2.4;break;
      }
      case 'lodestone': {
        mesh(magnet,0x993c52,0,0,0,.98,1.02,1.36);
        for(const sign of [-1,1])mesh(box,sign<0?0x91c5e4:0xffcacc,sign*.72,.69,0,.43,.39,.56);
        const field=stream('arc',0xa49bdc);cycle=t=>field.scale.x=.9+.17*Math.sin(t*6);spin=3.15;break;
      }
      case 'midnight-harvest': {
        const blade=mesh(crescent,0xd9e8bb,.18,.17,0,.98,1,.8);
        mesh(rod,0x825e64,-.45,-.62,0,.14,1.23,.14).rotation.z=-.31;
        bright(gem,0xaceab8,-.38,-.38,.03,.21,.25,.21);
        stream('arc',0xa7dda8);cycle=t=>blade.rotation.y=.2*Math.sin(t*5);spin=1.7;roll=7;break;
      }
      case 'familiar-archer': {
        mesh(shard,0xf8e5bb,0,.65,0,.48,.68,.42);
        mesh(ball,0xcaad81,0,-.32,0,.12,1.05,.12);
        for(const side of [-1,1])bright(shard,0xc197ff,side*.17,-1.02,0,.2,.42,.2).rotation.z=-side*.42;
        spin=.4;break;
      }
      case 'familiar-ember': {
        bright(stone,0xffb442,0,0,0,.69,.9,.67);mesh(gem,0xed583a,.1,-.19,0,.72,.76,.76);
        bright(cone,0xffde82,0,-.91,0,.52,1.38,.52).rotation.z=Math.PI;
        stream('flare',0xff7132);spin=7.2;cycle=beads(0xffb95a,3,.13,.57);break;
      }
      case 'familiar-frost': {
        mesh(gem,0xb8eafd,0,.19,0,.51,1.29,.49);
        for(let k=0;k<3;k++){const a=k*Math.PI/3,m=bright(box,0x96e5fa,0,-.37,0,1.53,.15,.15);m.rotation.y=a}
        stream('rush',0x8edaf8);spin=7.9;break;
      }
      case 'familiar-storm': {
        bright(zig,0xffe878,0,0,0,.55,1.09,.64);
        for(const sign of [-1,1])bright(shard,0xddc5ff,sign*.43,-.34,0,.35,.57,.7).rotation.z=-sign*.87;
        stream('split',0xf0ce73);spin=8.4;break;
      }
      default:
        bright(gem,0xffe8ad,0,0,0,.7,1,.7);stream('wisp',0xf7c477);
    }
    return {root,animate(t){
      core.rotation.set(tilt+wobble*Math.sin(t*3.9),spin*t,roll*t);
      wake.rotation.y=trailSpin*t;cycle(t);
    }};
  };
}
