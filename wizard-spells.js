// Coordinates are measured from each wizard's feet. All persistent effects are
// scheduled by the match simulation so pausing also pauses their timers.
const color = {
  Evocation: '#ff905b', Movement: '#eac767', Summoning: '#87da75',
  Restoration: '#8aefd1', Warding: '#bdabff', Hexes: '#ee88c9'
};

function spell(category, id, name, symbol, cost, time, description, cast) {
  return { category, id, name, symbol, cost, time, description, cast };
}

function bolt(category, options) {
  const stats = { color: color[category], ...options };
  return (api, wizard, angle) => api.bolt(wizard, angle, { ...stats });
}

function mark(api, wizard, category, radius = 30) {
  api.fx(wizard.x, wizard.y - 11, radius, color[category], 'ring', wizard.z);
}

function ward(wizard, amount) {
  wizard.shield = Math.min(100, wizard.shield + amount);
}

function aimPoint(wizard, pitch, distance, yawOffset = 0) {
  const horizontal = Math.cos(pitch) * distance;
  const yaw = wizard.yaw + yawOffset;
  return { x: wizard.x + Math.cos(yaw) * horizontal,
    y: wizard.y - 12 + Math.sin(pitch) * distance, z: wizard.z + Math.sin(yaw) * horizontal };
}

function distanceFrom(wizard, x, y, z) {
  return Math.hypot(wizard.x - x, wizard.y - 12 - y, wizard.z - z);
}

function buildAhead(api, p, distance, heightOffset, width, height, yawOffset = 0) {
  const center = aimPoint(p, 0, distance, yawOffset);
  api.build(p, center.x, p.y + heightOffset, width, height, center.z);
}

const damage = [
  spell('Evocation', 'witchspark', 'Witchspark', '✦', 2, 0,
    'Flick a quick spark for 12 damage. Its tiny mana cost makes it a reliable finishing shot.',
    bolt('Evocation', { style: 'witchspark', speed: 410, damage: 12, r: 3, life: 1.7 })),
  spell('Evocation', 'kiln-heart', 'Kiln Heart', '☄', 24, .72,
    'Launch a slow molten heart that explodes on impact, blasting a pocket out of cover.',
    bolt('Evocation', { style: 'kiln-heart', speed: 220, damage: 27, r: 8, blast: 44, life: 3.6 })),
  spell('Evocation', 'crater-bell', 'Crater Bell', '◉', 22, .42,
    'Ring out a shockwave in every direction. It hits nearby enemies and carves surrounding blocks for 24 damage.',
    (api, p) => api.area(p, p.x, p.y - 8, 58, 24, color.Evocation, p.z)),
  spell('Evocation', 'fault-stitch', 'Fault Stitch', 'ϟ', 34, .85,
    'Tear a seam along your aim. Four blasts erupt in sequence, each farther from your starting point.',
    (api, p, a) => {
      const origin = { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
      let segment = 0;
      api.zone(p, p.x, p.y - 12, 8, 1.1, .24, (world, owner) => {
        if (segment >= 4) return;
        const point = aimPoint(origin, a, 32 + 31 * segment++);
        world.area(owner, point.x, point.y, 22, 14, color.Evocation, point.z);
      }, color.Evocation, p.z);
    }),
  spell('Hexes', 'cinder-brand', 'Cinder Brand', '♢', 13, .28,
    'Brand the first wizard hit. The bolt deals 7 damage and ignites them for four seconds.',
    bolt('Hexes', { style: 'cinder-brand', speed: 320, damage: 7, r: 5, life: 2.2,
      onHit(api, p, target) { if (target) api.status(target, 'burn', 4); } })),
  spell('Evocation', 'salamander-nest', 'Salamander Nest', '♨', 35, .8,
    'Plant a furnace where the seed hits. It scorches nearby enemies and blocks every half second for three seconds.',
    bolt('Evocation', { style: 'salamander-nest', speed: 270, gravity: 130, damage: 3, r: 6, life: 4,
      onHit(api, p, target, x, y, z) {
        api.zone(p, x, y, 33, 3, .5, (world, owner, zx, zy, zz) =>
          world.area(owner, zx, zy, 33, 7, color.Evocation, zz), color.Evocation, z);
      } })),
  spell('Evocation', 'sundial-mine', 'Sundial Mine', '☼', 26, .35,
    'Leave a sun rune at your feet. After 1.2 seconds it erupts for 37 damage in every direction.',
    (api, p) => {
      let fired = false;
      api.zone(p, p.x, p.y - 5, 52, 1.35, 1.2, (world, owner, x, y, z) => {
        if (fired) return;
        fired = true;
        world.area(owner, x, y, 52, 37, color.Evocation, z);
      }, color.Evocation, p.z);
    }),
  spell('Evocation', 'star-shears', 'Star Shears', '✂', 16, .18,
    'Snap two close-range blades across your aim. Their overlapping cuts can hit the same wizard twice.',
    (api, p, a) => {
      for (const offset of [-.33, .33]) {
        const tip = aimPoint(p, a, 33, offset);
        api.area(p, tip.x, tip.y, 23, 12, color.Evocation, tip.z);
      }
    })
];

const ranged = [
  spell('Evocation', 'glass-fan', 'Glass Fan', '⋔', 18, .35,
    'Throw five glass slivers in a widening fan. Up close, more than one can hit.',
    (api, p, a) => {
      for (let i = -2; i <= 2; i++)
        api.bolt(p, a, { style: 'glass-fan', speed: 335, damage: 7, r: 3, color: color.Evocation, life: 1.5, yawOffset: i * .135 });
    }),
  spell('Evocation', 'corner-pocket', 'Corner Pocket', '◇', 12, .2,
    'Shoot a glass marble that can bank off three surfaces. Use corners to reach hidden enemies.',
    bolt('Evocation', { style: 'corner-pocket', speed: 360, damage: 15, r: 4, bounces: 3, life: 3.6 })),
  spell('Evocation', 'north-star', 'North Star', '✶', 21, .55,
    'Release a slow star that bends its flight toward a living enemy.',
    bolt('Evocation', { style: 'north-star', speed: 180, damage: 19, r: 6, homing: 3, life: 4 })),
  spell('Evocation', 'silver-skewer', 'Silver Skewer', '➳', 23, .75,
    'Fire a fast, narrow lance with piercing power for a line of enemies.',
    bolt('Evocation', { style: 'silver-skewer', speed: 660, damage: 17, r: 3, pierce: 3, life: 1.75 })),
  spell('Evocation', 'moon-mortar', 'Moon Mortar', '☾', 18, .5,
    'Lob a heavy moon shell in a falling arc. Aim above a barricade to blast the far side.',
    bolt('Evocation', { style: 'moon-mortar', speed: 300, gravity: 300, damage: 21, r: 6, blast: 31, life: 4 })),
  spell('Movement', 'undertow', 'Undertow', '⚓', 16, .32,
    'Hook a wizard and yank them almost five blocks toward you. Solid cover stops the pull.',
    bolt('Movement', { style: 'undertow', speed: 380, damage: 8, r: 4, life: 1.9,
      onHit(api, p, target) {
        if (!target) return;
        const dx = p.x - target.x, dy = p.y - target.y, dz = p.z - target.z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance > 1) {
          const pull = Math.min(1, 58 / distance);
          api.blink(target, dx * pull, dy * pull, dz * pull);
        }
      } })),
  spell('Hexes', 'hush-feather', 'Hush Feather', '♩', 14, .4,
    'Nick a wizard for 5 damage and prevent them from starting spells for two seconds.',
    bolt('Hexes', { style: 'hush-feather', speed: 300, damage: 5, r: 4, life: 2.6,
      onHit(api, p, target) { if (target) api.status(target, 'silence', 2); } })),
  spell('Hexes', 'root-needle', 'Root Needle', '♧', 8, .27,
    'A thorn pins its target in place for 1.2 seconds. They can still cast.',
    bolt('Hexes', { style: 'root-needle', speed: 360, damage: 5, r: 4, life: 2,
      onHit(api, p, target) { if (target) api.status(target, 'root', 1.2); } }))
];

const boost = [
  spell('Movement', 'foxstep', 'Foxstep', '»', 8, .08,
    'Enchantment quickens your running speed for four seconds.',
    (api, p) => { api.status(p, 'haste', 4); mark(api, p, 'Movement'); }),
  spell('Movement', 'hare-moon', 'Hare Moon', '♞', 12, .25,
    'Empower your jumps for six seconds. Reach perches before the enchantment ends.',
    (api, p) => { api.status(p, 'leap', 6); mark(api, p, 'Movement'); }),
  spell('Movement', 'fold-step', 'Fold Step', '⇥', 16, .12,
    'Blink up to eight blocks along your aim. A blocked path cuts the step short.',
    (api, p, a) => {
      mark(api, p, 'Movement', 18);
      const point = aimPoint(p, a, 96);
      api.blink(p, point.x - p.x, point.y - (p.y - 12), point.z - p.z);
      mark(api, p, 'Movement', 25);
    }),
  spell('Movement', 'bottle-rocket', 'Bottle Rocket', '⇧', 18, .16,
    'Burst upward, even in midair. The backblast deals 12 damage to the ground and opponents below you.',
    (api, p) => { api.area(p, p.x, p.y + 3, 23, 12, color.Movement, p.z); p.vy = -410; }),
  spell('Movement', 'comet-train', 'Comet Train', '⌁', 32, .5,
    'Sprint for three seconds while sparks burst at your current position every half second.',
    (api, p) => {
      api.status(p, 'haste', 3);
      api.zone(p, p.x, p.y - 8, 10, 3, .5, (world, owner) =>
        world.area(owner, owner.x, owner.y - 5, 22, 6, color.Movement, owner.z), color.Movement, p.z);
    }),
  spell('Movement', 'switchback', 'Switchback', '⇄', 30, .55,
    'Trade positions with the nearest enemy within about twelve blocks, as far as the terrain allows.',
    (api, p) => {
      const distance = target => distanceFrom(target, p.x, p.y - 12, p.z);
      const targets = api.enemies(p).filter(t => distance(t) <= 140);
      targets.sort((a, b) => distance(a) - distance(b));
      if (!targets.length) { mark(api, p, 'Movement', 14); return; }
      const other = targets[0], dx = other.x - p.x, dy = other.y - p.y, dz = other.z - p.z;
      api.blink(p, dx, dy, dz); api.blink(other, -dx, -dy, -dz);
      mark(api, other, 'Movement'); mark(api, p, 'Movement');
    }),
  spell('Movement', 'return-ticket', 'Return Ticket', '↶', 24, .2,
    'Mark your position. After three seconds the mark pulls you back toward it, stopping at solid terrain.',
    (api, p) => {
      let recalled = false;
      api.zone(p, p.x, p.y, 18, 3.15, 3, (world, owner, x, y, z) => {
        if (recalled) return;
        recalled = true;
        world.blink(owner, x - owner.x, y - owner.y, z - owner.z); mark(world, owner, 'Movement');
      }, color.Movement, p.z);
    }),
  spell('Movement', 'pilgrim-step', 'Pilgrim Step', '▰', 10, .22,
    'Place a floating stepping stone ahead and below your feet. Use it as a bridge or a landing.',
    (api, p) => buildAhead(api, p, 44, 18, 48, 12))
];

const healing = [
  spell('Restoration', 'pocket-poultice', 'Pocket Poultice', '✚', 8, .5,
    'Restore 14 health as soon as the cast finishes.',
    (api, p) => { api.heal(p, 14); mark(api, p, 'Restoration'); }),
  spell('Restoration', 'green-thread', 'Green Thread', '❧', 17, .42,
    'Wrap yourself in a thread that regenerates health for six seconds while you move.',
    (api, p) => { api.status(p, 'regen', 6); mark(api, p, 'Restoration'); }),
  spell('Restoration', 'lantern-well', 'Lantern Well', '⚘', 28, .75,
    'Plant a healing lantern. Stay within its circle to recover 5 health every second for six seconds.',
    (api, p) => api.zone(p, p.x, p.y - 12, 41, 6.1, 1, (world, owner, x, y, z) => {
      if (distanceFrom(owner, x, y, z) <= 41) world.heal(owner, 5);
    }, color.Restoration, p.z)),
  spell('Restoration', 'vampire-moth', 'Vampire Moth', 'ʚ', 19, .45,
    'Send out a seeking moth. A hit deals 9 damage and restores 12 health to its caster.',
    bolt('Restoration', { style: 'vampire-moth', speed: 160, homing: 2, damage: 9, r: 5, life: 3.2,
      onHit(api, p, target) { if (target) { api.heal(p, 12); mark(api, p, 'Restoration'); } } })),
  spell('Restoration', 'last-stitch', 'Last Stitch', '✜', 27, .95,
    'Recover half of your missing health, rounded up. Cast it when badly wounded.',
    (api, p) => { api.heal(p, Math.ceil((p.maxHp - p.hp) / 2)); mark(api, p, 'Restoration', 42); }),
  spell('Restoration', 'glass-graft', 'Glass Graft', '◈', 9, .3,
    'Melt up to 25 shield points into an equal amount of missing health. Spare shielding stays intact.',
    (api, p) => {
      const amount = Math.min(25, p.shield, p.maxHp - p.hp);
      p.shield -= amount; api.heal(p, amount); mark(api, p, 'Restoration', 22);
    }),
  spell('Restoration', 'overbloom', 'Overbloom', '✿', 22, .65,
    'Bloom for 18 health. Any healing beyond full health becomes a shield instead, up to 100 shielding.',
    (api, p) => {
      const missing = p.maxHp - p.hp;
      api.heal(p, 18); ward(p, Math.max(0, 18 - missing)); mark(api, p, 'Restoration');
    }),
  spell('Restoration', 'hedge-hospice', 'Hedge Hospice', '⌂', 36, 1,
    'Raise short destructible hedges to either side of yourself and recover 16 health in their shelter.',
    (api, p) => {
      for (const side of [-1, 1]) buildAhead(api, p, 34, -16, 12, 36, side * Math.PI / 2);
      api.heal(p, 16); mark(api, p, 'Restoration');
    })
];

const shields = [
  spell('Warding', 'thimble-ward', 'Thimble Ward', '⬡', 8, .25,
    'Gain 14 points of shielding. Stored shields absorb damage and stack up to 100.',
    (api, p) => { ward(p, 14); mark(api, p, 'Warding'); }),
  spell('Warding', 'iron-choir', 'Iron Choir', '♜', 20, .5,
    'Harden your robes with protective armor, reducing incoming damage for five seconds.',
    (api, p) => { api.status(p, 'armor', 5); mark(api, p, 'Warding'); }),
  spell('Warding', 'looking-glass', 'Looking Glass', '◐', 24, .3,
    'Envelop yourself in a mirror that reflects incoming projectiles for two seconds.',
    (api, p) => { api.status(p, 'reflect', 2); mark(api, p, 'Warding'); }),
  spell('Warding', 'smoke-skin', 'Smoke Skin', '◌', 26, .08,
    'Turn into mist and become immune to damage for 1.2 seconds.',
    (api, p) => { api.status(p, 'phased', 1.2); mark(api, p, 'Warding'); }),
  spell('Warding', 'rampart', 'Rampart', '▦', 16, .45,
    'Raise a destructible wall six blocks high in front of you.',
    (api, p) => buildAhead(api, p, 40, -36, 24, 72)),
  spell('Warding', 'winter-ring', 'Winter Ring', '❄', 21, .35,
    'Surround yourself with frost. Every nearby enemy is slowed for three seconds as you gain 8 shielding.',
    (api, p) => {
      for (const target of api.enemies(p)) if (distanceFrom(target, p.x, p.y - 12, p.z) <= 74) api.status(target, 'slow', 3);
      ward(p, 8); mark(api, p, 'Warding', 74);
    }),
  spell('Warding', 'tithe-dome', 'Tithe Dome', '⌒', 30, .75,
    'Raise a ward circle. Every second you remain inside grants 6 shielding, for up to five seconds.',
    (api, p) => api.zone(p, p.x, p.y - 12, 35, 5.1, 1, (world, owner, x, y, z) => {
      if (distanceFrom(owner, x, y, z) <= 35) { ward(owner, 6); mark(world, owner, 'Warding', 22); }
    }, color.Warding, p.z)),
  spell('Warding', 'aegis-break', 'Aegis Break', '✷', 18, .3,
    'Shatter up to 35 of your shield points. Each point increases the damage and reach of the outward blast.',
    (api, p) => {
      const spent = Math.min(35, p.shield);
      p.shield -= spent; api.area(p, p.x, p.y - 10, 28 + spent, 6 + spent, color.Warding, p.z);
    })
];

function nearby(api, owner, x, y, z, radius) {
  return api.enemies(owner).filter(target => distanceFrom(target, x, y, z) <= radius);
}

const evocationArts = [
  spell('Evocation', 'roman-candle', 'Roman Candle', '⋮', 21, .2,
    'Your staff fires four sparks at quarter-second intervals. Turn between shots to sweep the volley.',
    (api, p) => api.zone(p, p.x, p.y-12, 8, 1.04, .25, (world, owner) => {
      world.bolt(owner, owner.aim, { style: 'roman-candle', speed: 350, r: 3, damage: 8, color: color.Evocation, life: 2 });
    }, color.Evocation, p.z)),
  spell('Evocation', 'airburst', 'Airburst', '✹', 14, .22,
    'Fire a timed shell. It bursts after half a second in open air or detonates early on contact.',
    bolt('Evocation', { style: 'airburst', speed: 260, r: 4, damage: 6, life: .5,
      onHit(api,p,t,x,y,z) { api.area(p,x,y,35,16,color.Evocation,z); },
      onExpire(api,p,x,y,z) { api.area(p,x,y,35,16,color.Evocation,z); } })),
  spell('Evocation', 'fork-lightning', 'Fork Lightning', '↯', 27, .54,
    'Hit a wizard to arc lightning to the two closest enemies within seven blocks of them.',
    bolt('Evocation', { style: 'fork-lightning', speed: 380, r: 4, damage: 15, life: 2,
      onHit(api,p,target,x,y,z) {
        if (!target) return;
        const others=nearby(api,p,x,y,z,84).filter(q=>q!==target);
        others.sort((a,b)=>distanceFrom(a,x,y,z)-distanceFrom(b,x,y,z));
        for (const q of others.slice(0,2)) api.area(p,q.x,q.y-12,9,11,color.Evocation,q.z);
      } })),
  spell('Evocation', 'quarry-auger', 'Quarry Auger', '⛏', 33, .66,
    'An auger slug drills into the first solid surface it strikes, bursting three times deeper into the wall.',
    (api,p,pitch) => {
      const yaw=p.yaw;
      api.bolt(p,pitch,{ style: 'quarry-auger',speed:300,r:5,damage:9,life:3,color:color.Evocation,
        onHit(world,owner,target,x,y,z) {
          if(target)return;
          let bite=0;
          const entry={x,y:y+12,z,yaw};
          world.zone(owner,x,y,8,.65,.2,(sim,caster)=>{
            const tip=aimPoint(entry,pitch,10+18*bite++);
            sim.area(caster,tip.x,tip.y,16,32,color.Evocation,tip.z);
          },color.Evocation,z);
        }});
    }),
  spell('Evocation', 'catherine-wheel', 'Catherine Wheel', '⚙', 31, .5,
    'Spin eight small blasts around your body, one after another. Move to carry the wheel with you.',
    (api,p) => {
      let spoke=p.yaw;
      api.zone(p,p.x,p.y-12,10,1.63,.2,(world,owner)=>{
        world.area(owner,owner.x+38*Math.cos(spoke),owner.y-12,20,9,color.Evocation,owner.z+38*Math.sin(spoke));
        spoke+=Math.PI/4;
      },color.Evocation,p.z);
    }),
  spell('Evocation', 'pressure-valve', 'Pressure Valve', '↗', 16, .32,
    'A steam blast strikes in front of you. Enemies caught in it are shoved away and tossed into the air.',
    (api,p,a) => {
      const at=aimPoint(p,a,33);
      api.area(p,at.x,at.y,29,9,color.Evocation,at.z);
      for(const q of nearby(api,p,at.x,at.y,at.z,38)){
        const dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)||1;
        api.blink(q,26*dx/len,-5,26*dz/len);q.vy=-225;
      }
    })
];

const movementArts = [
  spell('Movement','recoil-rose','Recoil Rose','↢',14,.18,
    'Shoot a thorn forward and spring three blocks backward, away from your aim.',
    (api,p,a)=>{
      api.bolt(p,a,{ style: 'recoil-rose',speed:385,damage:12,r:4,color:color.Movement,life:2});
      const end=aimPoint(p,a,36);
      api.blink(p,p.x-end.x,p.y-12-end.y,p.z-end.z);
    }),
  spell('Movement','hook-and-eye','Hook and Eye','➰',23,.32,
    'Fire a hook. On contact it pulls you toward its impact point by up to ten blocks.',
    bolt('Movement',{ style: 'hook-and-eye',speed:385,damage:4,r:4,life:2.5,
      onHit(api,p,target,x,y,z){
        const dx=x-p.x,dy=y-(p.y-12),dz=z-p.z,scale=Math.min(1,120/(Math.hypot(dx,dy,dz)||1));
        api.blink(p,dx*scale,dy*scale,dz*scale);mark(api,p,'Movement');
      }})),
  spell('Movement','rising-stair','Rising Stair','▟',21,.48,
    'Conjure four ascending steps in front of you. Each step is two blocks higher than the last.',
    (api,p)=>{for(let i=0;i<4;i++)buildAhead(api,p,24+i*23,4-i*24,30,12);}),
  spell('Movement','thermal-font','Thermal Font','♒',19,.3,
    'Place a five-second updraft at your feet. Any wizard in its core is repeatedly lifted.',
    (api,p)=>api.zone(p,p.x,p.y-12,38,5,.28,(world,owner,x,y,z)=>{
      for(const q of [owner,...world.enemies(owner)])if(distanceFrom(q,x,y,z)<=38)q.vy=-255;
    },color.Movement,p.z)),
  spell('Movement','moonwalk','Moonwalk','☽',18,.16,
    'Blink sideways and briefly become mist. Your aim stays pointed at the same opponent.',
    (api,p)=>{
      const end=aimPoint(p,0,58,Math.PI/2);
      api.blink(p,end.x-p.x,0,end.z-p.z);api.status(p,'phased',.45);mark(api,p,'Movement');
    })
];

const familiars = [
  ['ember-newt','Ember Newt','♆',29,.65,'ember','Spits explosive fireballs at enemies.'],
  ['rime-owl','Rime Owl','❅',27,.55,'frost','Fires shards that slow its targets.'],
  ['balm-beetle','Balm Beetle','⚕',26,.55,'medic','While near you, restores 5 of your health every 1.5 seconds.'],
  ['bastion-crab','Bastion Crab','⛨',28,.6,'bastion','While near you, grants you 5 shielding every 1.5 seconds.'],
  ['storm-finch','Storm Finch','Ϟ',34,.7,'storm','Fires three sparks in a volley.'],
  ['quarry-mole','Quarry Mole','⛰',31,.7,'burrow','Chases enemies, chewing through blocks and hurting enemies with close-range pulses.']
].map(([id,name,symbol,cost,time,kind,behavior])=>
  spell('Summoning',id,name,symbol,cost,time,
    behavior+' Your familiar has 28 health and lasts 12 seconds. You can keep three familiars at once.',
    (api,p)=>api.summon(p,kind)));

const hexArts = [
  spell('Hexes','peel-gilt','Peel Gilt','♤',11,.24,
    'Strip up to 20 shielding from the wizard hit. Half the amount stripped becomes your shield.',
    bolt('Hexes',{ style: 'peel-gilt',speed:335,r:4,damage:1,life:2.5,onHit(api,p,q){
      if(!q)return;const stripped=Math.min(q.shield,20);q.shield-=stripped;ward(p,stripped/2);mark(api,q,'Hexes');
    }})),
  spell('Hexes','thieves-quill','Thief’s Quill','✎',8,.34,
    'A seeking quill steals up to 12 unspent mana from its target, limited by the room left in your pool.',
    bolt('Hexes',{ style: 'thieves-quill',speed:210,r:4,damage:2,homing:1.8,life:3,onHit(api,p,q){
      if(!q||!Number.isFinite(q.mana))return;
      const taken=Math.min(12,q.mana,p.maxMana-p.mana);q.mana-=taken;p.mana+=taken;mark(api,q,'Hexes');
    }})),
  spell('Hexes','lead-anklet','Lead Anklet','⚒',12,.27,
    'Drag a struck wizard sharply downward and slow their running speed for 1.5 seconds.',
    bolt('Hexes',{ style: 'lead-anklet',speed:355,r:4,damage:5,life:2,onHit(api,p,q){
      if(q){q.vy=Math.max(q.vy,330);api.status(q,'slow',1.5);}
    }})),
  spell('Hexes','hemlock-clock','Hemlock Clock','⌚',20,.45,
    'Mark a struck enemy for three seconds. If they move four blocks from the mark, it bursts around them.',
    bolt('Hexes',{ style: 'hemlock-clock',speed:345,r:4,damage:3,life:3,onHit(api,p,q){
      if(!q)return;
      let triggered=false;
      api.zone(p,q.x,q.y-12,48,3,.15,(world,owner,x,y,z)=>{
        if(triggered||q.hp<=0||distanceFrom(q,x,y,z)<48)return;
        triggered=true;world.area(owner,q.x,q.y-12,23,24,color.Hexes,q.z);
      },color.Hexes,q.z);
    }})),
  spell('Hexes','fevervine','Fevervine','☣',23,.55,
    'Poison a target with a burning vine. For three seconds the marked wizard can spread burns to nearby enemies.',
    bolt('Hexes',{ style: 'fevervine',speed:290,r:5,damage:2,life:3,onHit(api,p,q){
      if(!q)return;
      api.status(q,'burn',3);
      api.zone(p,q.x,q.y-12,16,3,.5,(world,owner)=>{
        if(q.hp<=0)return;
        for(const other of nearby(world,owner,q.x,q.y-12,q.z,48))if(other!==q)world.status(other,'burn',2);
      },color.Hexes,q.z);
    }})),
  spell('Hexes','vowbreaker','Vowbreaker','♭',21,.38,
    'Mark an enemy for four seconds. If caught winding up a spell, they suffer a 20-damage burst.',
    bolt('Hexes',{ style: 'vowbreaker',speed:315,r:5,damage:4,life:2.5,onHit(api,p,q){
      if(!q)return;
      let spent=false;
      api.zone(p,q.x,q.y-12,10,4,.08,(world,owner)=>{
        if(spent||q.hp<=0||!(q.cast>0 || q.pending>=0))return;
        spent=true;world.area(owner,q.x,q.y-12,18,20,color.Hexes,q.z);
      },color.Hexes,q.z);
    }})),
  spell('Hexes','mute-marsh','Mute Marsh','♮',26,.6,
    'Throw a seed that plants a four-second patch of silence. Enemies inside cannot begin new spells.',
    bolt('Hexes',{ style: 'mute-marsh',speed:255,gravity:120,r:5,damage:2,life:4,onHit(api,p,q,x,y,z){
      api.zone(p,x,y,38,4,.24,(world,owner,gx,gy,gz)=>{
        for(const target of nearby(world,owner,gx,gy,gz,38))world.status(target,'silence',.32);
      },color.Hexes,z);
    }})),
  spell('Hexes','unlace','Unlace','♘',10,.2,
    'Unravel a struck wizard’s active speed and jumping boosts. Each boost removed adds a small burst.',
    bolt('Hexes',{ style: 'unlace',speed:410,r:3,damage:4,life:2,onHit(api,p,q){
      if(!q?.statuses)return;
      for(const status of ['haste','leap'])if(q.statuses[status]>0){
        q.statuses[status]=0;api.area(p,q.x,q.y-12,11,8,color.Hexes,q.z);
      }
    }})),
  spell('Hexes','lodestone','Lodestone','⊛',29,.65,
    'Anchor a magnet on impact. It drags nearby enemies toward its center every third of a second for three seconds.',
    bolt('Hexes',{ style: 'lodestone',speed:280,r:5,damage:3,life:3,onHit(api,p,q,x,y,z){
      api.zone(p,x,y,50,3,.33,(world,owner,gx,gy,gz)=>{
        for(const target of nearby(world,owner,gx,gy,gz,50)){
          const scale=Math.min(1,14/Math.max(1,distanceFrom(target,gx,gy,gz)));
          world.blink(target,(gx-target.x)*scale,(gy-target.y+12)*scale,(gz-target.z)*scale);
        }
      },color.Hexes,z);
    }})),
  spell('Hexes','sky-toll','Sky Toll','☋',15,.31,
    'Ring a bell that catches airborne enemies within eight blocks. They plummet and lose movement for one second.',
    (api,p)=>{
      mark(api,p,'Hexes',96);
      for(const q of nearby(api,p,p.x,p.y-12,p.z,96))if(!q.ground){
        q.vy=Math.max(q.vy,270);api.status(q,'root',1);
      }
    })
];

const restorationArts = [
  spell('Restoration','dew-wash','Dew Wash','☔',12,.28,
    'Wash away burns, roots and slowing effects. Each removed effect restores 5 health.',
    (api,p)=>{
      let cleared=0;
      for(const k of ['burn','root','slow'])if(p.statuses[k]>0){p.statuses[k]=0;cleared++;}
      api.heal(p,5*cleared);mark(api,p,'Restoration');
    }),
  spell('Restoration','second-draft','Second Draft','⏳',31,.48,
    'Remember your current health. Three seconds later, restore up to 32 health lost since casting, if you survive.',
    (api,p)=>{
      const recorded=p.hp;
      api.zone(p,p.x,p.y-12,15,3.04,3,(world,owner)=>{
        if(owner.hp>0){world.heal(owner,Math.min(32,Math.max(0,recorded-owner.hp)));mark(world,owner,'Restoration');}
      },color.Restoration,p.z);
    }),
  spell('Restoration','root-tea','Root Tea','☕',18,.42,
    'Stand inside a narrow circle to sip three doses of tea. Each second you stay by the cup restores 9 health.',
    (api,p)=>api.zone(p,p.x,p.y-12,12,3.04,1,(world,owner,x,y,z)=>{
      if(owner.hp>0&&distanceFrom(owner,x,y,z)<=12&&Math.hypot(owner.vx,owner.vz)<8)world.heal(owner,9);
    },color.Restoration,p.z)),
  spell('Restoration','crimson-ledger','Crimson Ledger','§',4,.62,
    'Exchange up to 12 health for twice as much mana. The exchange always leaves you at least 1 health.',
    (api,p)=>{
      const spent=Math.min(12,Math.max(0,p.hp-1),(p.maxMana-p.mana)/2);
      p.hp-=spent;p.mana+=2*spent;mark(api,p,'Restoration');
    }),
  spell('Restoration','heartwood','Heartwood','♥',19,.58,
    'Restore 8 health immediately, plus 5 for every nearby enemy within six blocks, up to 28 total.',
    (api,p)=>{
      const crowd=nearby(api,p,p.x,p.y-12,p.z,72).length;
      api.heal(p,8+Math.min(4,crowd)*5);mark(api,p,'Restoration',72);
    }),
  spell('Restoration','pilgrim-salve','Pilgrim Salve','✣',24,.36,
    'Lay a salve on your route. Travel at least six blocks from the mark within three seconds to earn a 20-health heal.',
    (api,p)=>{
      let spent=false;
      api.zone(p,p.x,p.y-12,12,3,.15,(world,owner,x,y,z)=>{
        if(spent||owner.hp<=0||distanceFrom(owner,x,y,z)<72)return;
        spent=true;world.heal(owner,20);mark(world,owner,'Restoration');
      },color.Restoration,p.z);
    }),
  spell('Restoration','midnight-harvest','Midnight Harvest','☘',21,.38,
    'Throw a sickle for 14 damage. A finishing hit restores 24 health. A surviving target grants 4 instead.',
    bolt('Restoration',{ style: 'midnight-harvest',speed:320,r:5,damage:14,life:2.5,onHit(api,p,q){
      if(q&&p.hp>0){api.heal(p,q.hp<=0?24:4);mark(api,p,'Restoration');}
    }}))
];

const wardingArts = [
  spell('Warding','sky-shutter','Sky Shutter','▤',19,.42,
    'Build a canopy overhead and a second roof just ahead. Walk underneath to screen incoming high shots.',
    (api,p)=>{
      buildAhead(api,p,0,-56,48,12);buildAhead(api,p,31,-56,48,12);mark(api,p,'Warding',18);
    }),
  spell('Warding','tripwire','Tripwire','⌖',17,.3,
    'Set a ward at your feet for five seconds. An enemy stepping within three blocks grants you 20 shield.',
    (api,p)=>{
      let spent=false;
      api.zone(p,p.x,p.y-12,36,5,.2,(world,owner,x,y,z)=>{
        if(spent||!nearby(world,owner,x,y,z,36).length)return;
        spent=true;ward(owner,20);mark(world,owner,'Warding');
      },color.Warding,p.z);
    }),
  spell('Warding','glass-receipt','Glass Receipt','▧',17,.1,
    'Gain 10 shield. After two seconds, recover half the shielding lost since this cast as health, up to 18.',
    (api,p)=>{
      ward(p,10);const shield=p.shield;
      api.zone(p,p.x,p.y-12,12,2.04,2,(world,owner)=>{
        if(owner.hp>0)world.heal(owner,Math.min(18,Math.max(0,shield-owner.shield)/2));
      },color.Warding,p.z);
      mark(api,p,'Warding');
    }),
  spell('Warding','snail-citadel','Snail Citadel','⛊',20,.28,
    'Plant your feet for 1.5 seconds. In exchange, gain 18 shield and armor for three seconds.',
    (api,p)=>{api.status(p,'root',1.5);api.status(p,'armor',3);ward(p,18);mark(api,p,'Warding');}),
  spell('Warding','mirror-post','Mirror Post','♙',27,.57,
    'Plant a mirror post. Every second for four seconds, standing within two blocks grants a short reflection window.',
    (api,p)=>api.zone(p,p.x,p.y-12,24,4.05,1,(world,owner,x,y,z)=>{
      if(distanceFrom(owner,x,y,z)<=24){world.status(owner,'reflect',.45);mark(world,owner,'Warding');}
    },color.Warding,p.z)),
  spell('Warding','safety-net','Safety Net','▨',19,.2,
    'If you begin falling quickly within four seconds, a platform forms beneath you and your descent slows.',
    (api,p)=>{
      let caught=false;
      api.zone(p,p.x,p.y-12,12,4,.1,(world,owner)=>{
        if(caught||owner.hp<=0||owner.vy<175)return;
        caught=true;world.build(owner,owner.x,owner.y+26,48,12,owner.z);owner.vy=50;mark(world,owner,'Warding');
      },color.Warding,p.z);
    })
];

const grandSpells = [
  spell('Warding','bone-wall','Bone Wall','⚒',240,3,
    'Raise a barricade of ivory ribs five blocks ahead. Each block stops shots and breaks after 48 damage.',
    (api,p)=>{const at=aimPoint(p,0,60);
      for(let i=-7;i<=7;i++){const x=at.x-Math.sin(p.yaw)*i*10,z=at.z+Math.cos(p.yaw)*i*10,y=api.surface(x,z,p.y-120);
        if(y!==null)for(let j=0;j<(i%2===0?7:4);j++)api.bone(x,y-6-j*12,z)}
    }),
  spell('Hexes','bone-spikes','Bone Floor Spikes','♆',380,4,
    'Raise seven clusters of bone spikes straight ahead for six seconds. Each cluster deals 12 damage every half second to enemies near the ground.',
    (api,p)=>{for(let i=1;i<=7;i++){const at=aimPoint(p,0,i*42),y=api.surface(at.x,at.z,p.y-120);
      if(y!==null)api.zone(p,at.x,y,24,6,.5,(a,o,x,y,z)=>{for(const q of a.enemies(o))
        if(Math.hypot(q.x-x,q.z-z)<=24&&q.y>=y-26&&q.y<=y+6)a.hurt(q,12)},'#f3dfa7',at.z,'spikes')}
    }),
  spell('Evocation','fire-skull','Fire Skull','☠',650,5.5,
    'Launch a flaming skull that curves toward an enemy. It explodes for 40 damage; a direct hit deals 40 more and burns for three seconds.',
    bolt('Evocation',{style:'fire-skull',speed:245,r:9,homing:1.4,life:7,damage:40,blast:68,color:'#ff6630',onHit:(a,p,q)=>{if(q)a.status(q,'burn',3)}})),
  spell('Restoration','phoenix-vigil','Phoenix Vigil','☀',900,7.5,
    'For ten seconds, the first time your health falls below half while alive, recover 55 health and blast nearby enemies for 45 damage.',
    (api,p)=>{let spent=false;api.zone(p,p.x,p.y-12,20,10,.1,(a,o)=>{if(!spent&&o.hp>0&&o.hp<o.maxHp/2){
      spent=true;a.heal(o,55);a.area(o,o.x,o.y-12,90,45,'#ffac48',o.z)}},'#ffac48',p.z)}),
  spell('Movement','thunder-road','Thunder Road','⟿',50,1.8,
    'Blink up to 24 blocks along your aim. Both ends erupt for 22 damage in a four-block radius.',
    (api,p,pitch)=>{
      const end=aimPoint(p,pitch,288);
      api.area(p,p.x,p.y-12,48,22,color.Movement,p.z);
      api.blink(p,end.x-p.x,end.y+12-p.y,end.z-p.z);
      api.area(p,p.x,p.y-12,48,22,color.Movement,p.z);
    }),
  spell('Warding','last-citadel','Last Citadel','♖',100,2.5,
    'Raise four destructible pillars around you, gain 65 shielding, and reflect incoming shots for three seconds.',
    (api,p)=>{
      for(const dx of [-36,36])for(const dz of [-36,36])api.build(p,p.x+dx,p.y-42,36,84,p.z+dz);
      ward(p,65);api.status(p,'reflect',3);mark(api,p,'Warding',65);
    }),
  spell('Summoning','wild-hunt','Call the Wild Hunt','♧',180,3.2,
    'Call an Ember Newt, a Rime Owl and a Storm Finch at once. They fill your three familiar slots for 12 seconds.',
    (api,p)=>{
      const yaw=p.yaw;
      for(const [i,kind] of ['ember','frost','storm'].entries()){
        p.yaw=yaw+(i-1)*1.6;api.summon(p,kind);
      }
      p.yaw=yaw;mark(api,p,'Summoning',68);
    }),
  spell('Restoration','second-sun','Second Sun','☀',300,4,
    'Restore 60 health and kindle a sanctuary for eight seconds. Each second inside restores 10 health and grants 4 shielding.',
    (api,p)=>{
      api.heal(p,60);
      api.zone(p,p.x,p.y-12,96,8.05,1,(world,owner,x,y,z)=>{
        if(owner.hp>0&&distanceFrom(owner,x,y,z)<=96){world.heal(owner,10);ward(owner,4);mark(world,owner,'Restoration',36)}
      },color.Restoration,p.z);
    }),
  spell('Hexes','gravity-well','Gravity Well','◍',450,5,
    'Open a well ten blocks straight ahead. Six pulses drag enemies toward its center, where a final blast deals 55 damage.',
    (api,p)=>{
      const at=aimPoint(p,0,120);let pulses=0;
      api.zone(p,at.x,at.y,120,3.55,.5,(world,owner,x,y,z)=>{
        if(++pulses===7){world.area(owner,x,y,78,55,color.Hexes,z);return}
        for(const target of nearby(world,owner,x,y,z,120)){
          const pull=Math.min(1,22/Math.max(1,distanceFrom(target,x,y,z)));
          world.blink(target,(x-target.x)*pull,(y+12-target.y)*pull,(z-target.z)*pull);
        }
        world.fx(x,y,70,color.Hexes,'ring',z);
      },color.Hexes,at.z);
    }),
  spell('Evocation','worldbreaker','Worldbreaker','✺',700,7,
    'After a seven-second windup, release five expanding blasts along your aim. Each tears through cover. The final blast reaches nine blocks and deals 90 damage.',
    (api,p,pitch)=>{
      const origin={x:p.x,y:p.y,z:p.z,yaw:p.yaw};let step=0;
      api.zone(p,p.x,p.y-12,16,1.31,.25,(world,owner)=>{
        const at=aimPoint(origin,pitch,72+step*72);
        world.area(owner,at.x,at.y,48+step*15,34+step*14,'#ffcd65',at.z);
        step++;
      },color.Evocation,p.z);
    })
];

function armament(id,name,symbol,cost,time,form,tint,strikes,reach,arc,damage,delay,trait,extra){
  const entry=spell('Summoning',id,name,symbol,cost,time,
    'Summon for 12 seconds. Press this slot again to attack for free. '+strikes+' swings, '+damage+' damage each. '+extra,
    (api,p)=>{p.weapon={id,until:api.now()+12,strikes,ready:api.now(),swing:-1}});
  entry.melee={form,tint,reach,arc,damage,delay,trait};
  return entry;
}
function localTargets(api,p,r){
  return api.enemies(p).filter(q=>Math.hypot(q.x-p.x,q.y-p.y,q.z-p.z)<=r);
}
const arsenal=[
  armament('glass-knife','Glass Knife','†',8,.35,'knife',0x95fff1,4,25,1.8,9,.22,'','Quick cuts with a short reach.'),
  armament('wisp-rapier','Wisp Rapier','⚔',32,.8,'rapier',0x9bccff,4,47,.8,17,.38,'','Long, narrow thrusts.'),
  armament('rime-axe','Rime Axe','❄',85,1.5,'axe',0x78dfff,3,37,2.5,24,.8,'slow','Each sweep chills its targets for two seconds.'),
  armament('ember-maul','Ember Maul','⚒',210,2.4,'hammer',0xff864b,3,38,2.1,30,1,'burn','Heavy overhead blows ignite targets for two seconds.'),
  armament('harvest-scythe','Harvest Scythe','☾',520,4,'scythe',0xcaa0ff,4,49,3.5,33,.85,'drain','Wide sweeps heal you for 8 per enemy struck.'),
  spell('Warding','spark-film','Spark Film','◌',6,.25,'Gain 9 energy shield instantly after casting and extinguish burning.',
    (a,p)=>{ward(p,9);p.statuses.burn=0;mark(a,p,'Warding')}),
  spell('Warding','capacitor-shell','Capacitor Shell','ϟ',48,1,'Gain 24 shield. For six seconds each point your shield absorbs restores one mana.',
    (a,p)=>{ward(p,24);a.status(p,'capacitor',6)}),
  spell('Warding','prism-parry','Prism Parry','◇',115,.45,'Gain 18 shield and reflect incoming projectiles for two seconds. Parry just before impact.',
    (a,p)=>{ward(p,18);a.status(p,'reflect',2);mark(a,p,'Warding')}),
  spell('Warding','polar-aegis','Polar Aegis','⬡',410,3.5,'Gain 65 shield. For eight seconds, enemies within six blocks are chilled whenever your shield absorbs damage.',
    (a,p)=>{ward(p,65);a.status(p,'polar',8)}),
  spell('Movement','vault-kick','Vault Kick','↟',12,.2,'Spring into the air and deal 10 damage to nearby enemies at takeoff.',
    (a,p)=>{p.vy=-380;for(const q of localTargets(a,p,38))a.hurt(q,10);mark(a,p,'Movement')}),
  spell('Movement','cross-step','Cross Step','⇥',24,.35,'Blink six blocks to your right and gain haste for one second.',
    (a,p)=>{a.blink(p,-72*Math.sin(p.yaw),0,72*Math.cos(p.yaw));a.status(p,'haste',1)}),
  spell('Restoration','field-dressing','Field Dressing','✚',14,.7,'Heal 12 health and remove slowing effects.',(a,p)=>{a.heal(p,12);p.statuses.slow=0;mark(a,p,'Restoration')}),
  spell('Hexes','lead-bell','Lead Bell','♩',38,.85,'Ground enemies within five blocks by rooting them for 1.4 seconds.',(a,p)=>{for(const q of localTargets(a,p,60))a.status(q,'root',1.4);mark(a,p,'Hexes',60)}),
  spell('Evocation','fault-cross','Fault Cross','✣',75,1.4,'Four blasts strike six blocks away in a cross around you, each dealing 27 damage.',
    (a,p)=>{for(let i=0;i<4;i++){const at=aimPoint(p,0,72,i*Math.PI/2);a.area(p,at.x,at.y,36,27,'#ffbe72',at.z)}}),
  spell('Restoration','familiar-feast','Familiar Feast','♧',95,1.6,'Heal yourself for 16 and restore 24 health to each of your living familiars.',
    (a,p)=>{a.heal(p,16);for(const f of a.allies(p))a.heal(f,24);mark(a,p,'Restoration')}),
  spell('Hexes','ward-tax','Ward Tax','♜',145,2,'Strip up to 30 shield from each enemy within eight blocks. Half the energy becomes your shield.',
    (a,p)=>{for(const q of localTargets(a,p,96)){const n=Math.min(30,q.shield);q.shield-=n;ward(p,n/2)}mark(a,p,'Hexes',96)}),
  spell('Movement','comet-retreat','Comet Retreat','☄',185,1.8,'Blast your starting point for 36 damage and blink ten blocks backwards.',
    (a,p)=>{a.area(p,p.x,p.y-12,54,36,'#ff985b',p.z);a.blink(p,-120*Math.cos(p.yaw),0,-120*Math.sin(p.yaw))}),
  spell('Summoning','winter-court','Winter Court','♛',295,3,'Call two frost familiars and slow enemies within eight blocks for three seconds.',
    (a,p)=>{a.summon(p,'frost');a.summon(p,'frost');for(const q of localTargets(a,p,96))a.status(q,'slow',3);mark(a,p,'Summoning',96)}),
  spell('Evocation','siege-clock','Siege Clock','◷',640,5,'Mark a point sixteen blocks along your aim. Three blasts hit it one second apart, each dealing 40 damage.',
    (a,p,pitch)=>{const at=aimPoint(p,pitch,192);a.zone(p,at.x,at.y,70,3.05,1,(w,o,x,y,z)=>w.area(o,x,y,70,40,'#ffc563',z),'#ffc563',at.z)}),
  spell('Restoration','dawn-coronation','Dawn Coronation','♕',850,6,'Restore 65 health, remove burning, root and silence, and gain one shield for every point of overhealing.',
    (a,p)=>{const missing=p.maxHp-p.hp;a.heal(p,65);ward(p,Math.max(0,65-missing));for(const key of ['burn','root','silence'])p.statuses[key]=0;mark(a,p,'Restoration',72)})
];

export const SPELLS = [...damage, ...ranged, ...boost, ...healing, ...shields, ...evocationArts,
  ...movementArts, ...familiars, ...hexArts, ...restorationArts, ...wardingArts, ...grandSpells, ...arsenal];
