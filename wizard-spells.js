// Coordinates are measured from each wizard's feet. All persistent effects are
// scheduled by the match simulation so pausing also pauses their timers.
const color = {
  Damage: '#ff905b', Ranged: '#93daff', Boost: '#eac767',
  Healing: '#8aefd1', Shield: '#bdabff'
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
  spell('Damage', 'witchspark', 'Witchspark', '✦', 2, 0,
    'Flick a quick spark for 12 damage. Its tiny mana cost makes it a reliable finishing shot.',
    bolt('Damage', { speed: 410, damage: 12, r: 3, life: 1.7 })),
  spell('Damage', 'kiln-heart', 'Kiln Heart', '☄', 24, .72,
    'Launch a slow molten heart that explodes on impact, blasting a pocket out of cover.',
    bolt('Damage', { speed: 220, damage: 27, r: 8, blast: 44, life: 3.6 })),
  spell('Damage', 'crater-bell', 'Crater Bell', '◉', 22, .42,
    'Ring out a shockwave in every direction. It hits nearby enemies and carves surrounding blocks for 24 damage.',
    (api, p) => api.area(p, p.x, p.y - 8, 58, 24, color.Damage, p.z)),
  spell('Damage', 'fault-stitch', 'Fault Stitch', 'ϟ', 34, .85,
    'Tear a seam along your aim. Four blasts erupt in sequence, each farther from your starting point.',
    (api, p, a) => {
      const origin = { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
      let segment = 0;
      api.zone(p, p.x, p.y - 12, 8, 1.1, .24, (world, owner) => {
        if (segment >= 4) return;
        const point = aimPoint(origin, a, 32 + 31 * segment++);
        world.area(owner, point.x, point.y, 22, 14, color.Damage, point.z);
      }, color.Damage, p.z);
    }),
  spell('Damage', 'cinder-brand', 'Cinder Brand', '♢', 13, .28,
    'Brand the first wizard hit. The bolt deals 7 damage and ignites them for four seconds.',
    bolt('Damage', { speed: 320, damage: 7, r: 5, life: 2.2,
      onHit(api, p, target) { if (target) api.status(target, 'burn', 4); } })),
  spell('Damage', 'salamander-nest', 'Salamander Nest', '♨', 35, .8,
    'Plant a furnace where the seed hits. It scorches nearby enemies and blocks every half second for three seconds.',
    bolt('Damage', { speed: 270, gravity: 130, damage: 3, r: 6, life: 4,
      onHit(api, p, target, x, y, z) {
        api.zone(p, x, y, 33, 3, .5, (world, owner, zx, zy, zz) =>
          world.area(owner, zx, zy, 33, 7, color.Damage, zz), color.Damage, z);
      } })),
  spell('Damage', 'sundial-mine', 'Sundial Mine', '☼', 26, .35,
    'Leave a sun rune at your feet. After 1.2 seconds it erupts for 37 damage in every direction.',
    (api, p) => {
      let fired = false;
      api.zone(p, p.x, p.y - 5, 52, 1.35, 1.2, (world, owner, x, y, z) => {
        if (fired) return;
        fired = true;
        world.area(owner, x, y, 52, 37, color.Damage, z);
      }, color.Damage, p.z);
    }),
  spell('Damage', 'star-shears', 'Star Shears', '✂', 16, .18,
    'Snap two close-range blades across your aim. Their overlapping cuts can hit the same wizard twice.',
    (api, p, a) => {
      for (const offset of [-.33, .33]) {
        const tip = aimPoint(p, a, 33, offset);
        api.area(p, tip.x, tip.y, 23, 12, color.Damage, tip.z);
      }
    })
];

const ranged = [
  spell('Ranged', 'glass-fan', 'Glass Fan', '⋔', 18, .35,
    'Throw five glass slivers in a widening fan. Up close, more than one can hit.',
    (api, p, a) => {
      for (let i = -2; i <= 2; i++)
        api.bolt(p, a, { speed: 335, damage: 7, r: 3, color: color.Ranged, life: 1.5, yawOffset: i * .135 });
    }),
  spell('Ranged', 'corner-pocket', 'Corner Pocket', '◇', 12, .2,
    'Shoot a glass marble that can bank off three surfaces. Use corners to reach hidden enemies.',
    bolt('Ranged', { speed: 360, damage: 15, r: 4, bounces: 3, life: 3.6 })),
  spell('Ranged', 'north-star', 'North Star', '✶', 21, .55,
    'Release a slow star that bends its flight toward a living enemy.',
    bolt('Ranged', { speed: 180, damage: 19, r: 6, homing: 3, life: 4 })),
  spell('Ranged', 'silver-skewer', 'Silver Skewer', '➳', 23, .75,
    'Fire a fast, narrow lance with piercing power for a line of enemies.',
    bolt('Ranged', { speed: 660, damage: 17, r: 3, pierce: 3, life: 1.75 })),
  spell('Ranged', 'moon-mortar', 'Moon Mortar', '☾', 18, .5,
    'Lob a heavy moon shell in a falling arc. Aim above a barricade to blast the far side.',
    bolt('Ranged', { speed: 300, gravity: 300, damage: 21, r: 6, blast: 31, life: 4 })),
  spell('Ranged', 'undertow', 'Undertow', '⚓', 16, .32,
    'Hook a wizard and yank them almost five blocks toward you. Solid cover stops the pull.',
    bolt('Ranged', { speed: 380, damage: 8, r: 4, life: 1.9,
      onHit(api, p, target) {
        if (!target) return;
        const dx = p.x - target.x, dy = p.y - target.y, dz = p.z - target.z;
        const distance = Math.hypot(dx, dy, dz);
        if (distance > 1) {
          const pull = Math.min(1, 58 / distance);
          api.blink(target, dx * pull, dy * pull, dz * pull);
        }
      } })),
  spell('Ranged', 'hush-feather', 'Hush Feather', '♩', 14, .4,
    'Nick a wizard for 5 damage and prevent them from starting spells for two seconds.',
    bolt('Ranged', { speed: 300, damage: 5, r: 4, life: 2.6,
      onHit(api, p, target) { if (target) api.status(target, 'silence', 2); } })),
  spell('Ranged', 'root-needle', 'Root Needle', '♧', 8, .27,
    'A thorn pins its target in place for 1.2 seconds. They can still cast.',
    bolt('Ranged', { speed: 360, damage: 5, r: 4, life: 2,
      onHit(api, p, target) { if (target) api.status(target, 'root', 1.2); } }))
];

const boost = [
  spell('Boost', 'foxstep', 'Foxstep', '»', 8, .08,
    'Enchantment quickens your running speed for four seconds.',
    (api, p) => { api.status(p, 'haste', 4); mark(api, p, 'Boost'); }),
  spell('Boost', 'hare-moon', 'Hare Moon', '♞', 12, .25,
    'Empower your jumps for six seconds. Reach perches before the enchantment ends.',
    (api, p) => { api.status(p, 'leap', 6); mark(api, p, 'Boost'); }),
  spell('Boost', 'fold-step', 'Fold Step', '⇥', 16, .12,
    'Blink up to eight blocks along your aim. A blocked path cuts the step short.',
    (api, p, a) => {
      mark(api, p, 'Boost', 18);
      const point = aimPoint(p, a, 96);
      api.blink(p, point.x - p.x, point.y - (p.y - 12), point.z - p.z);
      mark(api, p, 'Boost', 25);
    }),
  spell('Boost', 'bottle-rocket', 'Bottle Rocket', '⇧', 18, .16,
    'Burst upward, even in midair. The backblast deals 12 damage to the ground and opponents below you.',
    (api, p) => { api.area(p, p.x, p.y + 3, 23, 12, color.Boost, p.z); p.vy = -410; }),
  spell('Boost', 'comet-train', 'Comet Train', '⌁', 32, .5,
    'Sprint for three seconds while sparks burst at your current position every half second.',
    (api, p) => {
      api.status(p, 'haste', 3);
      api.zone(p, p.x, p.y - 8, 10, 3, .5, (world, owner) =>
        world.area(owner, owner.x, owner.y - 5, 22, 6, color.Boost, owner.z), color.Boost, p.z);
    }),
  spell('Boost', 'switchback', 'Switchback', '⇄', 30, .55,
    'Trade positions with the nearest enemy within about twelve blocks, as far as the terrain allows.',
    (api, p) => {
      const distance = target => distanceFrom(target, p.x, p.y - 12, p.z);
      const targets = api.enemies(p).filter(t => distance(t) <= 140);
      targets.sort((a, b) => distance(a) - distance(b));
      if (!targets.length) { mark(api, p, 'Boost', 14); return; }
      const other = targets[0], dx = other.x - p.x, dy = other.y - p.y, dz = other.z - p.z;
      api.blink(p, dx, dy, dz); api.blink(other, -dx, -dy, -dz);
      mark(api, other, 'Boost'); mark(api, p, 'Boost');
    }),
  spell('Boost', 'return-ticket', 'Return Ticket', '↶', 24, .2,
    'Mark your position. After three seconds the mark pulls you back toward it, stopping at solid terrain.',
    (api, p) => {
      let recalled = false;
      api.zone(p, p.x, p.y, 18, 3.15, 3, (world, owner, x, y, z) => {
        if (recalled) return;
        recalled = true;
        world.blink(owner, x - owner.x, y - owner.y, z - owner.z); mark(world, owner, 'Boost');
      }, color.Boost, p.z);
    }),
  spell('Boost', 'pilgrim-step', 'Pilgrim Step', '▰', 10, .22,
    'Place a floating stepping stone ahead and below your feet. Use it as a bridge or a landing.',
    (api, p) => buildAhead(api, p, 44, 18, 48, 12))
];

const healing = [
  spell('Healing', 'pocket-poultice', 'Pocket Poultice', '✚', 8, .5,
    'Restore 14 health as soon as the cast finishes.',
    (api, p) => { api.heal(p, 14); mark(api, p, 'Healing'); }),
  spell('Healing', 'green-thread', 'Green Thread', '❧', 17, .42,
    'Wrap yourself in a thread that regenerates health for six seconds while you move.',
    (api, p) => { api.status(p, 'regen', 6); mark(api, p, 'Healing'); }),
  spell('Healing', 'lantern-well', 'Lantern Well', '⚘', 28, .75,
    'Plant a healing lantern. Stay within its circle to recover 5 health every second for six seconds.',
    (api, p) => api.zone(p, p.x, p.y - 12, 41, 6.1, 1, (world, owner, x, y, z) => {
      if (distanceFrom(owner, x, y, z) <= 41) world.heal(owner, 5);
    }, color.Healing, p.z)),
  spell('Healing', 'vampire-moth', 'Vampire Moth', 'ʚ', 19, .45,
    'Send out a seeking moth. A hit deals 9 damage and restores 12 health to its caster.',
    bolt('Healing', { speed: 160, homing: 2, damage: 9, r: 5, life: 3.2,
      onHit(api, p, target) { if (target) { api.heal(p, 12); mark(api, p, 'Healing'); } } })),
  spell('Healing', 'last-stitch', 'Last Stitch', '✜', 27, .95,
    'Recover half of your missing health, rounded up. Cast it when badly wounded.',
    (api, p) => { api.heal(p, Math.ceil((p.maxHp - p.hp) / 2)); mark(api, p, 'Healing', 42); }),
  spell('Healing', 'glass-graft', 'Glass Graft', '◈', 9, .3,
    'Melt up to 25 shield points into an equal amount of missing health. Spare shielding stays intact.',
    (api, p) => {
      const amount = Math.min(25, p.shield, p.maxHp - p.hp);
      p.shield -= amount; api.heal(p, amount); mark(api, p, 'Healing', 22);
    }),
  spell('Healing', 'overbloom', 'Overbloom', '✿', 22, .65,
    'Bloom for 18 health. Any healing beyond full health becomes a shield instead, up to 100 shielding.',
    (api, p) => {
      const missing = p.maxHp - p.hp;
      api.heal(p, 18); ward(p, Math.max(0, 18 - missing)); mark(api, p, 'Healing');
    }),
  spell('Healing', 'hedge-hospice', 'Hedge Hospice', '⌂', 36, 1,
    'Raise short destructible hedges to either side of yourself and recover 16 health in their shelter.',
    (api, p) => {
      for (const side of [-1, 1]) buildAhead(api, p, 34, -16, 12, 36, side * Math.PI / 2);
      api.heal(p, 16); mark(api, p, 'Healing');
    })
];

const shields = [
  spell('Shield', 'thimble-ward', 'Thimble Ward', '⬡', 8, .25,
    'Gain 14 points of shielding. Stored shields absorb damage and stack up to 100.',
    (api, p) => { ward(p, 14); mark(api, p, 'Shield'); }),
  spell('Shield', 'iron-choir', 'Iron Choir', '♜', 20, .5,
    'Harden your robes with protective armor, reducing incoming damage for five seconds.',
    (api, p) => { api.status(p, 'armor', 5); mark(api, p, 'Shield'); }),
  spell('Shield', 'looking-glass', 'Looking Glass', '◐', 24, .3,
    'Envelop yourself in a mirror that reflects incoming projectiles for two seconds.',
    (api, p) => { api.status(p, 'reflect', 2); mark(api, p, 'Shield'); }),
  spell('Shield', 'smoke-skin', 'Smoke Skin', '◌', 26, .08,
    'Turn into mist and become immune to damage for 1.2 seconds.',
    (api, p) => { api.status(p, 'phased', 1.2); mark(api, p, 'Shield'); }),
  spell('Shield', 'rampart', 'Rampart', '▦', 16, .45,
    'Raise a destructible wall six blocks high in front of you.',
    (api, p) => buildAhead(api, p, 40, -36, 24, 72)),
  spell('Shield', 'winter-ring', 'Winter Ring', '❄', 21, .35,
    'Surround yourself with frost. Every nearby enemy is slowed for three seconds as you gain 8 shielding.',
    (api, p) => {
      for (const target of api.enemies(p)) if (distanceFrom(target, p.x, p.y - 12, p.z) <= 74) api.status(target, 'slow', 3);
      ward(p, 8); mark(api, p, 'Shield', 74);
    }),
  spell('Shield', 'tithe-dome', 'Tithe Dome', '⌒', 30, .75,
    'Raise a ward circle. Every second you remain inside grants 6 shielding, for up to five seconds.',
    (api, p) => api.zone(p, p.x, p.y - 12, 35, 5.1, 1, (world, owner, x, y, z) => {
      if (distanceFrom(owner, x, y, z) <= 35) { ward(owner, 6); mark(world, owner, 'Shield', 22); }
    }, color.Shield, p.z)),
  spell('Shield', 'aegis-break', 'Aegis Break', '✷', 18, .3,
    'Shatter up to 35 of your shield points. Each point increases the damage and reach of the outward blast.',
    (api, p) => {
      const spent = Math.min(35, p.shield);
      p.shield -= spent; api.area(p, p.x, p.y - 10, 28 + spent, 6 + spent, color.Shield, p.z);
    })
];

export const SPELLS = [...damage, ...ranged, ...boost, ...healing, ...shields];
