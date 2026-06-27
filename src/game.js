import { Enemy } from './entities/enemy.js';
import { Tower } from './entities/tower.js';
import { Projectile } from './entities/projectile.js';
import {
  TOWER_TYPES, DEFAULT_GRID_SIZE, CANVAS_SIZE,
  STARTING_GOLD, STARTING_LIVES, TOTAL_WAVES, waveDefs,
} from './config.js';
import { addTerminalLine } from './systems/terminal.js';
import { ParticleSystem } from './systems/particle-system.js';
import { triggerScreenShake, waveAnnouncement } from './systems/effects.js';
import { playSoundWithPitch } from './systems/audio.js';
import { updateDataPanel, updateStory, updateTowerShopAffordability, updateTowerMenu, setStatusText, setSelectedTower } from './ui/panels.js';
import { showGameOver } from './ui/game-over.js';
import { serpentinePath } from './paths/serpentine.js';
import { spiralPath } from './paths/spiral.js';
import { splitPath } from './paths/split.js';
import { crossPath } from './paths/cross.js';
import { labyrinthPath } from './paths/labyrinth.js';

const paths = {
  serpentine: serpentinePath,
  spiral: spiralPath,
  split: splitPath,
  cross: crossPath,
  labyrinth: labyrinthPath,
};

export class Game {
  constructor(canvas, audioElements, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audioElements;
    this.callbacks = callbacks;

    this.gridSize = DEFAULT_GRID_SIZE;
    this.tileCount = Math.floor(CANVAS_SIZE / this.gridSize);

    this.speed = 1.0;
    this.burstIntensity = 1.0;
    this.musicVolume = 0.8;
    this.sfxVolume = 0.5;
    this.audioEnabled = true;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.pathTiles = new Set();

    this.currentPath = null;
    this.currentPathName = null;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.spawnIndex = 0;
    this.currentWave = 0;
    this.waveActive = false;
    this.enemiesRemainingInWave = 0;
    this.allWaveEnemiesSpawned = false;

    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.kills = 0;
    this.comboCount = 0;
    this.lastKillTime = 0;

    this.gameRunning = false;
    this.gamePaused = false;
    this.gameOver = false;
    this.loopId = null;
    this.prevTime = 0;

    this.particles = new ParticleSystem();

    this.selectedTowerType = null;
    this.hoverTile = null;
    this.selectedPlacedTower = null;

    this.setupInput();
  }

  setupInput() {
    this.canvas.addEventListener('click', (e) => {
      if (!this.gameRunning || this.gamePaused || this.gameOver) return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const tx = Math.floor(mx / this.gridSize);
      const ty = Math.floor(my / this.gridSize);

      if (this.selectedTowerType) {
        this.tryPlaceTower(tx, ty);
      } else {
        this.trySelectTower(tx, ty);
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.hoverTile = {
        x: Math.floor(mx / this.gridSize),
        y: Math.floor(my / this.gridSize),
      };
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverTile = null;
    });
  }

  tryPlaceTower(tx, ty) {
    if (!this.selectedTowerType) return;
    const def = TOWER_TYPES[this.selectedTowerType];
    if (this.gold < def.cost) return;
    if (this.pathTiles.has(`${tx},${ty}`)) return;
    if (this.towers.some(t => t.tileX === tx && t.tileY === ty)) return;

    const tower = new Tower(this.selectedTowerType, tx, ty);
    this.towers.push(tower);
    this.gold -= def.cost;

    addTerminalLine(`${def.name} deployed at (${tx},${ty})`, 'tower_build');
    this.callbacks.onBuild?.(tower);

    this.selectedTowerType = null;
    setSelectedTower(null);
    updateTowerMenu(null, this.gold);
  }

  trySelectTower(tx, ty) {
    const tower = this.towers.find(t => t.tileX === tx && t.tileY === ty);
    if (tower) {
      this.selectedPlacedTower = tower;
      updateTowerMenu(tower, this.gold);
    } else {
      this.selectedPlacedTower = null;
      updateTowerMenu(null, this.gold);
    }
  }

  sellTower() {
    const tower = this.selectedPlacedTower;
    if (!tower) return;
    const def = TOWER_TYPES[tower.typeId];
    let totalInvested = def.cost;
    for (let lv = 2; lv <= tower.level; lv++) totalInvested += Math.floor(def.cost * def.upgradeCostMultiplier * (lv - 1));
    const refund = Math.floor(totalInvested * 0.7);
    this.gold += refund;
    this.towers = this.towers.filter(t => t !== tower);
    addTerminalLine(`${tower.name} dismantled. Refund: ${refund}g`, 'tower_sell');
    this.selectedPlacedTower = null;
    updateTowerMenu(null, this.gold);
  }

  upgradeTower() {
    const tower = this.selectedPlacedTower;
    if (!tower || tower.level >= 3) return;
    const def = TOWER_TYPES[tower.typeId];
    const cost = Math.floor(def.cost * def.upgradeCostMultiplier * tower.level);
    if (this.gold < cost) return;
    this.gold -= cost;
    tower.upgrade();
    addTerminalLine(`${tower.name} upgraded to Lv.${tower.level}`, 'tower_upgrade');
    this.callbacks.onUpgrade?.(tower);
    updateTowerMenu(tower, this.gold);
  }

  startWave() {
    if (this.waveActive || this.gameOver) return;
    if (this.currentWave >= TOTAL_WAVES) return;

    this.currentWave++;
    const waveDef = waveDefs[this.currentWave - 1];

    const pathNames = ['serpentine', 'spiral', 'split', 'cross', 'labyrinth'];
    const newPathName = pathNames[Math.floor((this.currentWave - 1) / 10) % 5];

    if (newPathName !== this.currentPathName) {
      this.currentPathName = newPathName;
      this.currentPath = paths[this.currentPathName];
      this.rebuildPathTiles();

      const toRemove = [];
      for (const tower of this.towers) {
        if (this.pathTiles.has(`${tower.tileX},${tower.tileY}`)) {
          toRemove.push(tower);
        }
      }
      for (const tower of toRemove) {
        const def = TOWER_TYPES[tower.typeId];
        let invested = def.cost;
        for (let lv = 2; lv <= tower.level; lv++) invested += Math.floor(def.cost * def.upgradeCostMultiplier * (lv - 1));
        const refund = Math.floor(invested * 0.7);
        this.gold += refund;
        this.towers = this.towers.filter(t => t !== tower);
        if (this.selectedPlacedTower === tower) this.selectedPlacedTower = null;
        addTerminalLine(`${tower.name} at (${tower.tileX},${tower.tileY}) reclaimed — path rerouted. Refund: ${refund}g`, 'tower_sell');
      }
      if (toRemove.length) {
        updateTowerShopAffordability(this.gold);
        updateTowerMenu(this.selectedPlacedTower, this.gold);
      }
    }

    this.spawnIndex = 0;
    this.spawnQueue = [...waveDef.enemies];
    this.spawnTimer = 0;
    this.waveActive = true;
    this.allWaveEnemiesSpawned = false;
    this.enemiesRemainingInWave = this.spawnQueue.length;

    const bossText = waveDef.isBoss ? ' :: BOSS_WAVE' : '';
    addTerminalLine(`Wave ${this.currentWave} inbound — ${this.spawnQueue.length} hostiles${bossText}`, waveDef.isBoss ? 'boss_wave' : 'wave_start');
    waveAnnouncement(this.currentWave);
    if (waveDef.isBoss) {
      this.callbacks.onBossWave?.();
    }

    updateStory(this.currentWave - 1);
    setStatusText(`WAVE ${this.currentWave}`);
    updateDataPanel(this);
  }

  rebuildPathTiles() {
    this.pathTiles.clear();
    const pathList = Array.isArray(this.currentPath[0]) ? this.currentPath : [this.currentPath];
    for (const path of pathList) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const steps = Math.max(Math.abs(dx), Math.abs(dy));
        for (let s = 0; s <= steps; s++) {
          const t = steps === 0 ? 0 : s / steps;
          const tx = Math.round(a.x + dx * t);
          const ty = Math.round(a.y + dy * t);
          this.pathTiles.add(`${tx},${ty}`);
        }
      }
    }
  }

  spawnEnemy() {
    if (this.spawnQueue.length === 0) return;
    const typeId = this.spawnQueue.shift();
    const waveDef = waveDefs[this.currentWave - 1];

    let path = this.currentPath;
    if (Array.isArray(this.currentPath[0])) {
      const idx = this.spawnIndex % this.currentPath.length;
      this.spawnIndex++;
      path = this.currentPath[idx];
    }

    const enemy = new Enemy(typeId, path, waveDef.scale);
    this.enemies.push(enemy);
  }

  update(delta) {
    if (!this.gameRunning || this.gamePaused || this.gameOver) return;

    const dt = Math.min(delta, 0.1);

    if (this.waveActive) {
      this.spawnTimer += dt * this.speed;
      while (this.spawnTimer >= this.spawnInterval && this.spawnQueue.length > 0) {
        this.spawnTimer -= this.spawnInterval;
        this.spawnEnemy();
      }
      if (this.spawnQueue.length === 0) {
        this.allWaveEnemiesSpawned = true;
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(dt, this.speed);
    }

    this.enemiesRemainingInWave = this.enemies.filter(e => e.alive).length;
    if (this.allWaveEnemiesSpawned && this.spawnQueue.length === 0) {
      this.enemiesRemainingInWave = this.enemies.filter(e => e.alive).length;
    }

    for (const enemy of [...this.enemies]) {
      if (enemy.reachedExit) {
        this.lives -= enemy.damageToLives;
        enemy.alive = false;
        addTerminalLine(`Hostile breached perimeter! Lives: ${this.lives}`, 'enemy_leak');
        triggerScreenShake(this.canvas, 0.5, 0.5);
        this.callbacks.onEnemyLeak?.(enemy);
        if (this.lives <= 0) {
          this.lives = 0;
          this.endGame(false);
          return;
        }
      }
    }

    for (const tower of this.towers) {
      const fireData = tower.update(dt, this.enemies);
      if (fireData) {
        const proj = new Projectile(fireData, this.enemies);
        this.projectiles.push(proj);
      }
    }

    for (const proj of this.projectiles) {
      proj.update(dt);
    }

    for (const proj of [...this.projectiles]) {
      if (proj.arrived) {
        for (const result of proj.results) {
          if (result.type === 'hit') {
            this.particles.impact(result.x, result.y, result.color);
            if (result.isCrit) {
              this.particles.popup(result.x, result.y, `${Math.floor(result.damage)}!`, '#facc15');
            }
          }
        }
        this.projectiles = this.projectiles.filter(p => p !== proj);
      }
    }

    for (const enemy of [...this.enemies]) {
      if (!enemy.alive && !enemy._processed) {
        enemy._processed = true;
        this.kills++;
        this.gold += enemy.goldValue;

        this.particles.burst(enemy.pixelX, enemy.pixelY, [enemy.color, '#ffffff', '#dddddd'], this.burstIntensity);
        this.particles.popup(enemy.pixelX, enemy.pixelY, `+${enemy.goldValue}g`, enemy.color);
        this.callbacks.onKill?.(enemy);

        addTerminalLine(
          `${enemy.name} neutralized [+${enemy.goldValue}g]`,
          'enemy_kill',
        );
      }
    }

    this.enemies = this.enemies.filter(e => e.alive || !e._processed);

    if (this.waveActive && this.allWaveEnemiesSpawned &&
        this.spawnQueue.length === 0 &&
        this.enemies.length === 0) {
      this.waveCleared();
    }

    this.particles.update(dt);

    updateDataPanel(this);
    updateTowerShopAffordability(this.gold);
    if (this.selectedPlacedTower) updateTowerMenu(this.selectedPlacedTower, this.gold);
  }

  get spawnInterval() {
    const def = waveDefs[this.currentWave - 1];
    return def ? Math.max(def.spawnInterval / this.speed, 0.15) : 1;
  }

  waveCleared() {
    this.waveActive = false;
    addTerminalLine(`Wave ${this.currentWave} cleared!`, 'wave_clear');
    this.callbacks.onWaveClear?.();
    setStatusText('INTERMISSION');

    if (this.currentWave >= TOTAL_WAVES) {
      setTimeout(() => this.endGame(true), 2000);
      return;
    }

    if (this.currentWave >= TOTAL_WAVES) {
      this.endGame(true);
    }
  }

  endGame(isVictory) {
    this.gameRunning = false;
    this.gameOver = true;
    clearInterval(this.loopId);

    if (isVictory) {
      addTerminalLine('ALL 50 WAVES SURVIVED. WONDERLAND IS SECURE.', 'victory');
    } else {
      addTerminalLine('PERIMETER BREACHED. REALM LOST.', 'fatal_error');
    }

    setStatusText(isVictory ? 'VICTORIOUS' : 'FALLEN');
    this.callbacks.onGameEnd?.(isVictory, this.currentWave, this.kills);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = 'rgba(192, 132, 252, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.gridSize, 0);
      ctx.lineTo(i * this.gridSize, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * this.gridSize);
      ctx.lineTo(CANVAS_SIZE, i * this.gridSize);
      ctx.stroke();
    }

    for (const tile of this.pathTiles) {
      const [tx, ty] = tile.split(',').map(Number);
      // Dark solid base for contrast against the background image
      ctx.fillStyle = 'rgba(10, 10, 26, 0.65)';
      ctx.fillRect(tx * this.gridSize, ty * this.gridSize, this.gridSize, this.gridSize);

      // Neon-purple glow overlay
      ctx.fillStyle = 'rgba(192, 132, 252, 0.22)';
      ctx.fillRect(tx * this.gridSize, ty * this.gridSize, this.gridSize, this.gridSize);

      // Neon grid borders for clear path definition
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx * this.gridSize, ty * this.gridSize, this.gridSize, this.gridSize);
    }

    if (this.selectedTowerType && this.hoverTile &&
        !this.pathTiles.has(`${this.hoverTile.x},${this.hoverTile.y}`)) {
      ctx.fillStyle = this.gold >= TOWER_TYPES[this.selectedTowerType].cost
        ? 'rgba(251, 191, 36, 0.25)'
        : 'rgba(248, 113, 113, 0.25)';
      ctx.fillRect(
        this.hoverTile.x * this.gridSize,
        this.hoverTile.y * this.gridSize,
        this.gridSize, this.gridSize,
      );
      ctx.strokeStyle = this.gold >= TOWER_TYPES[this.selectedTowerType].cost ? '#fbbf24' : '#f87171';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.hoverTile.x * this.gridSize,
        this.hoverTile.y * this.gridSize,
        this.gridSize, this.gridSize,
      );
      ctx.lineWidth = 1;
    }

    for (const tower of this.towers) {
      const isSelected = this.selectedPlacedTower === tower;
      const tx = tower.tileX * this.gridSize;
      const ty = tower.tileY * this.gridSize;

      ctx.fillStyle = tower.color + 'cc';
      ctx.fillRect(tx + 2, ty + 2, this.gridSize - 4, this.gridSize - 4);

      if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.strokeRect(tx, ty, this.gridSize, this.gridSize);
        ctx.lineWidth = 1;
      }

      ctx.font = `${this.gridSize * 0.6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.icon, tx + this.gridSize / 2, ty + this.gridSize / 2 - (this.gridSize > 20 ? 3 : 1));

      if (tower.level > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${Math.max(8, this.gridSize * 0.35)}px "Press Start 2P"`;
        ctx.fillText('*'.repeat(tower.level - 1), tx + this.gridSize / 2, ty - 2);
      }
    }

    if (this.hoverTile && !this.selectedTowerType) {
      const tower = this.towers.find(t => t.tileX === this.hoverTile.x && t.tileY === this.hoverTile.y);
      if (tower) {
        const rangePx = tower.range * this.gridSize;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tower.pixelX, tower.pixelY, rangePx, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
        ctx.fill();
        ctx.lineWidth = 1;
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const { x, y } = enemy.getCanvasPos();
      const size = enemy.size;
      const flash = enemy.hitFlashTimer > 0;

      ctx.fillStyle = flash ? '#ffffff' : enemy.color;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);

      ctx.fillStyle = '#000000';
      ctx.font = `${size * 0.7}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(enemy.emoji, x, y);

      const hpRatio = enemy.hp / enemy.maxHp;
      const barW = size;
      const barH = 3;
      const barX = x - size / 2;
      const barY = y - size / 2 - 5;
      ctx.fillStyle = '#ef444433';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = hpRatio > 0.5 ? '#4ade80' : hpRatio > 0.25 ? '#fbbf24' : '#f87171';
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
    }

    for (const proj of this.projectiles) {
      if (proj.arrived) continue;
      ctx.fillStyle = proj.color;
      ctx.fillRect(proj.x - 3, proj.y - 3, 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(proj.x - 1.5, proj.y - 1.5, 3, 3);
    }

    this.particles.draw(ctx);
  }

  loop(timestamp) {
    if (this.gameOver) return;
    const delta = this.prevTime ? (timestamp - this.prevTime) / 1000 : 0;
    this.prevTime = timestamp;

    this.update(delta);
    this.draw();

    this.loopId = requestAnimationFrame((t) => this.loop(t));
  }

  pulseWaveCheck(timestamp) {
    if (!this.gameRunning || this.gamePaused || this.gameOver) {
      this.pulseId = requestAnimationFrame((t) => this.pulseWaveCheck(t));
      return;
    }

    if (!this.waveActive && this.currentWave < TOTAL_WAVES && this.gameRunning) {
      this.startWave();
    }

    this.pulseId = requestAnimationFrame((t) => this.pulseWaveCheck(t));
  }

  start() {
    this.currentWave = 0;
    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.kills = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles.clear();

    this.currentPathName = 'serpentine';
    this.currentPath = paths.serpentine;
    this.rebuildPathTiles();

    this.gameRunning = true;
    this.gamePaused = false;
    this.gameOver = false;
    this.prevTime = 0;
    this.spawnIndex = 0;

    addTerminalLine('Realm defenses online. Awaiting hostiles.', 'system_init');
    setStatusText('ACTIVE');
    updateDataPanel(this);
    updateTowerShopAffordability(this.gold);
    updateTowerMenu(null, this.gold);

    this.loopId = requestAnimationFrame((t) => this.loop(t));
    this.pulseId = requestAnimationFrame((t) => this.pulseWaveCheck(t));
  }

  pause() {
    this.gamePaused = !this.gamePaused;
    if (this.gamePaused) {
      addTerminalLine('Chrono-suspension engaged.', 'pause');
      setStatusText('STASIS');
    } else {
      addTerminalLine('Chrono-suspension released.', 'resume');
      setStatusText('ACTIVE');
    }
  }

  reset() {
    cancelAnimationFrame(this.loopId);
    cancelAnimationFrame(this.pulseId);
    this.particles.clear();
    this.currentWave = 0;
    this.gold = STARTING_GOLD;
    this.lives = STARTING_LIVES;
    this.kills = 0;
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.spawnQueue = [];
    this.spawnIndex = 0;
    this.waveActive = false;
    this.gameOver = false;
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;
    this.gameRunning = false;

    this.currentPathName = 'serpentine';
    this.currentPath = paths.serpentine;
    this.rebuildPathTiles();
    updateDataPanel(this);
    updateTowerShopAffordability(this.gold);
    updateTowerMenu(null, this.gold);
    setSelectedTower(null);
    setStatusText('AWAITING');
    addTerminalLine('Defenses reset. Standing by.', 'system_init');
  }

  selectTowerType(typeId) {
    if (this.selectedTowerType === typeId) {
      this.selectedTowerType = null;
      setSelectedTower(null);
      updateTowerMenu(null, this.gold);
    } else {
      this.selectedTowerType = typeId;
      this.selectedPlacedTower = null;
      setSelectedTower(typeId);
      const def = TOWER_TYPES[typeId];
      const info = document.getElementById('tower-info');
      if (info) {
        info.innerHTML = `<span style="color:${def.color}">${def.name}</span><br>${def.description}<br>Cost: ${def.cost}g | DMG: ${def.damage}`;
      }
    }
  }

  dispose() {
    cancelAnimationFrame(this.loopId);
    cancelAnimationFrame(this.pulseId);
  }
}
