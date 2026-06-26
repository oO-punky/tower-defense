export const TOWER_TYPES = {
  ARROW: {
    id: 'arrow',
    name: 'MUSHROOM',
    icon: '\uD83C\uDF44',
    cost: 25,
    damage: 8,
    range: 3,
    fireRate: 0.7,
    color: '#a78bfa',
    description: 'Single target',
    upgradeMultiplier: 1.6,
    upgradeCostMultiplier: 1.8,
  },
  CANNON: {
    id: 'cannon',
    name: 'TEACUP',
    icon: '\uD83C\uDF75',
    cost: 40,
    damage: 15,
    range: 2.5,
    fireRate: 1.2,
    splash: 1,
    splashDamage: 0.5,
    color: '#fbbf24',
    description: 'Area splash',
    upgradeMultiplier: 1.5,
    upgradeCostMultiplier: 1.7,
  },
  ICE: {
    id: 'ice',
    name: 'CROWN',
    icon: '\uD83D\uDC51',
    cost: 35,
    damage: 4,
    range: 3,
    fireRate: 0.6,
    slow: 0.4,
    slowDuration: 1.5,
    color: '#67e8f9',
    description: 'Slows enemies',
    upgradeMultiplier: 1.3,
    upgradeCostMultiplier: 1.6,
  },
  CHAIN: {
    id: 'chain',
    name: 'POCKET WATCH',
    icon: '\u23F0',
    cost: 50,
    damage: 6,
    range: 2.8,
    fireRate: 0.9,
    chain: 3,
    chainDamage: 0.6,
    color: '#facc15',
    description: 'Chains to nearby',
    upgradeMultiplier: 1.5,
    upgradeCostMultiplier: 1.7,
  },
  CHESHIRE: {
    id: 'cheshire',
    name: 'CHESHIRE',
    icon: '\uD83D\uDC31',
    cost: 60,
    damage: 12,
    range: 4,
    fireRate: 1.0,
    crit: 0.3,
    critDamage: 2.5,
    color: '#10b981',
    description: 'Critical strikes',
    upgradeMultiplier: 1.7,
    upgradeCostMultiplier: 1.9,
  },
};

export const ENEMY_TYPES = {
  SPADE: {
    id: 'spade',
    name: 'SPADE SCOUT',
    emoji: '\u2660',
    hp: 20,
    speed: 1.2,
    damage: 1,
    gold: 5,
    color: '#8b5cf6',
    size: 14,
  },
  CLUB: {
    id: 'club',
    name: 'CLUB SOLDIER',
    emoji: '\u2663',
    hp: 45,
    speed: 0.8,
    damage: 2,
    gold: 10,
    color: '#3b82f6',
    size: 16,
  },
  DIAMOND: {
    id: 'diamond',
    name: 'DIAMOND BRUTE',
    emoji: '\u2666',
    hp: 100,
    speed: 0.55,
    damage: 3,
    gold: 20,
    color: '#f59e0b',
    size: 18,
  },
  HEART: {
    id: 'heart',
    name: 'HEART BOSS',
    emoji: '\u2665',
    hp: 350,
    speed: 0.45,
    damage: 5,
    gold: 100,
    color: '#ef4444',
    size: 22,
  },
};

export const DEFAULT_GRID_SIZE = 24;
export const CANVAS_SIZE = 600;
export const STARTING_GOLD = 100;
export const STARTING_LIVES = 20;
export const TOTAL_WAVES = 50;
export const MAX_TOWER_LEVEL = 3;
export const ENEMY_HP_SCALE = 0.08;
export const ENEMY_SPEED_SCALE = 0.02;

export const waveDefs = [];
const bossWaves = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

for (let w = 1; w <= TOTAL_WAVES; w++) {
  const isBoss = bossWaves.includes(w);
  const scale = 1 + (w - 1) * ENEMY_HP_SCALE;
  const enemies = [];

  if (w <= 5) {
    const count = 4 + w * 2;
    for (let i = 0; i < count; i++) enemies.push('SPADE');
  } else if (w <= 10) {
    const spades = 6 + w;
    const clubs = Math.floor(w * 0.8);
    for (let i = 0; i < spades; i++) enemies.push('SPADE');
    for (let i = 0; i < clubs; i++) enemies.push('CLUB');
  } else if (w <= 20) {
    const spades = 8 + Math.floor(w * 0.5);
    const clubs = 4 + Math.floor(w * 0.6);
    const diamonds = Math.floor(w * 0.3);
    for (let i = 0; i < spades; i++) enemies.push('SPADE');
    for (let i = 0; i < clubs; i++) enemies.push('CLUB');
    for (let i = 0; i < diamonds; i++) enemies.push('DIAMOND');
  } else if (w <= 30) {
    const spades = 10 + Math.floor(w * 0.4);
    const clubs = 6 + Math.floor(w * 0.5);
    const diamonds = 2 + Math.floor(w * 0.3);
    for (let i = 0; i < spades; i++) enemies.push('SPADE');
    for (let i = 0; i < clubs; i++) enemies.push('CLUB');
    for (let i = 0; i < diamonds; i++) enemies.push('DIAMOND');
  } else if (w <= 40) {
    const clubs = 8 + Math.floor(w * 0.4);
    const diamonds = 4 + Math.floor(w * 0.3);
    for (let i = 0; i < clubs; i++) enemies.push('CLUB');
    for (let i = 0; i < diamonds; i++) enemies.push('DIAMOND');
  } else {
    const clubs = 10 + Math.floor(w * 0.3);
    const diamonds = 6 + Math.floor(w * 0.3);
    for (let i = 0; i < clubs; i++) enemies.push('CLUB');
    for (let i = 0; i < diamonds; i++) enemies.push('DIAMOND');
  }

  if (isBoss) {
    const bossCount = w >= 42 ? 3 : w >= 30 ? 2 : 1;
    for (let i = 0; i < bossCount; i++) enemies.push('HEART');
  }

  const spawnInterval = Math.max(0.3, 3 - w * 0.055);

  waveDefs.push({ wave: w, scale, enemies, spawnInterval, isBoss });
}

export const storyFragments = [
  'Alice stood at the edge of Wonderland, gazing upon a realm in turmoil.',
  'The Queen of Hearts had unleashed her card army upon the land.',
  'The White Rabbit hurried past, checking his pocket watch in panic.',
  'Into the Tulgey Wood the card soldiers marched, their banners high.',
  'Alice knew she must build defenses — the realm depended on it.',
  'The first mushroom tower sprouted, its spores ready for battle.',
  'The Cheshire Cat grinned from a branch. "Things are getting curiouser."',
  'Card soldiers fell, but more poured through the looking glass.',
  'The Mad Hatter offered his finest teacup — a cannon of great power.',
  'A crown of ice appeared, freezing soldiers in their tracks.',
  'The Caterpillar asked, "Who are you to command such towers?"',
  'Alice replied, "One who will not let Wonderland fall."',
  'The pocket watch ticked — chain lightning arced between soldiers.',
  'Through the maze of hedges, the enemy advanced relentlessly.',
  'The March Hare warned of a great wave approaching from the east.',
  'Tweedledee and Tweedledum argued over which tower was strongest.',
  'The Queen\'s roses were painted red with the fury of battle.',
  'Alice upgraded her defenses, gold coins glinting in the twilight.',
  'A diamond brute smashed through the perimeter — reinforcements needed.',
  'The Dormouse squeaked a warning of the spiral path ahead.',
  'Wonderland\'s creatures rallied behind Alice\'s defensive line.',
  'The Knave of Hearts led the charge, but was met with cannon fire.',
  'Through the looking glass, more enemies arrived with every wave.',
  'Alice\'s pocket watch tower hummed with temporal energy.',
  'The Cheshire Cat appeared everywhere at once, striking from all angles.',
  'Halfway through the siege, hope flickered like a candle in the wind.',
  'The path split — enemies now came from multiple directions.',
  'Alice repositioned her towers, adapting to the changing battlefield.',
  'The White Queen offered cryptic advice: "Believe six impossible things."',
  'A great horn sounded — the boss approached with thunderous steps.',
  'Crown towers slowed the advance, buying precious seconds.',
  'Gold rained from fallen enemies, funding stronger fortifications.',
  'The labyrinth path confused even the card soldiers momentarily.',
  'Alice saw the Queen of Hearts in the distance, watching the battle.',
  'The Jabberwocky\'s shadow passed overhead — but it did not descend.',
  'Each fallen tower was rebuilt stronger, each lesson learned in blood.',
  'The crossroad path brought enemies from three directions at once.',
  'Wonderland\'s fate balanced on the edge of a teacup.',
  'The final ten waves approached — the worst was yet to come.',
  'Alice\'s towers glowed with maximum power, a radiant defense.',
  'The card army had never faced such resistance — they faltered.',
  'Through the labyrinthine paths, enemies stumbled into traps.',
  'The Queen screamed "Off with her head!" but Alice stood firm.',
  'Three heart bosses emerged simultaneously — the ultimate test.',
  'The pocket watch slowed time itself, giving Alice a crucial edge.',
  'Vorpal sword met card soldier as the battle reached its climax.',
  'The Cheshire Cat\'s grin was the last thing many soldiers saw.',
  'Only two waves remained — victory was within reach.',
  'One final wave. The Queen herself watched from her throne.',
  'The card army shattered. Wonderland was saved. "Curiouser and curiouser," smiled the Cat.',
];
