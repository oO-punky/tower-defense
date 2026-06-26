import { ENEMY_TYPES, DEFAULT_GRID_SIZE } from '../config.js';

export class Enemy {
  constructor(typeId, path, scale) {
    const def = ENEMY_TYPES[typeId];
    this.typeId = typeId;
    this.name = def.name;
    this.emoji = def.emoji;
    this.maxHp = Math.round(def.hp * scale);
    this.hp = this.maxHp;
    this.baseSpeed = def.speed;
    this.speed = def.speed * (1 + (scale - 1) * 0.5);
    this.damageToLives = def.damage;
    this.goldValue = def.gold + Math.floor(def.gold * (scale - 1) * 0.5);
    this.color = def.color;
    this.size = def.size;

    this.path = path;
    this.waypointIndex = 0;
    this.x = path[0].x * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    this.y = path[0].y * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    this.pixelX = this.x;
    this.pixelY = this.y;
    this.alive = true;
    this.reachedExit = false;

    this.slowAmount = 0;
    this.slowTimer = 0;

    this.hitFlashTimer = 0;
  }

  update(delta, speedMultiplier) {
    if (!this.alive || this.reachedExit) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) this.slowAmount = 0;
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= delta;

    const effectiveSpeed = (this.speed * speedMultiplier) * (1 - this.slowAmount);
    const targetWaypoint = this.path[this.waypointIndex];
    if (!targetWaypoint) {
      this.reachedExit = true;
      return;
    }

    const targetX = targetWaypoint.x * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    const targetY = targetWaypoint.y * DEFAULT_GRID_SIZE + DEFAULT_GRID_SIZE / 2;
    const dx = targetX - this.pixelX;
    const dy = targetY - this.pixelY;
    const dist = Math.hypot(dx, dy);

    if (dist < effectiveSpeed * 60 * delta * 1.2) {
      this.waypointIndex++;
    } else {
      const nx = dx / dist;
      const ny = dy / dist;
      this.pixelX += nx * effectiveSpeed * 60 * delta;
      this.pixelY += ny * effectiveSpeed * 60 * delta;
    }
  }

  takeDamage(amount) {
    if (!this.alive) return false;
    this.hp -= amount;
    this.hitFlashTimer = 0.08;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      return true;
    }
    return false;
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.max(this.slowAmount, amount);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  getCanvasPos() {
    return { x: this.pixelX, y: this.pixelY };
  }

  getTilePos() {
    return {
      x: Math.floor(this.pixelX / DEFAULT_GRID_SIZE),
      y: Math.floor(this.pixelY / DEFAULT_GRID_SIZE),
    };
  }
}
