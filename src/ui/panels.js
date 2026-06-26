import { TOWER_TYPES, STARTING_GOLD, STARTING_LIVES, TOTAL_WAVES, storyFragments } from '../config.js';
import { addTerminalLine } from '../systems/terminal.js';

const elements = {
  waveValue: document.getElementById('wave-value'),
  livesValue: document.getElementById('lives-value'),
  goldValue: document.getElementById('gold-value'),
  killsValue: document.getElementById('kills-value'),
  statusValue: document.getElementById('status-value'),
  waveProgressBar: document.getElementById('wave-progress-bar'),
  storyContent: document.getElementById('story-content'),
  towerShopGrid: document.getElementById('tower-shop-grid'),
  towerInfo: document.getElementById('tower-info'),
  sellBtn: document.getElementById('sell-btn'),
  upgradeBtn: document.getElementById('upgrade-btn'),
  speedSlider: document.getElementById('speed-slider'),
  speedValue: document.getElementById('speed-value'),
  burstSlider: document.getElementById('burst-slider'),
  burstValue: document.getElementById('burst-value'),
  musicVolumeSlider: document.getElementById('music-volume-slider'),
  musicVolumeValue: document.getElementById('music-volume-value'),
  sfxVolumeSlider: document.getElementById('sfx-volume-slider'),
  sfxVolumeValue: document.getElementById('sfx-volume-value'),
  audioToggle: document.getElementById('audio-toggle'),
  statusIndicator: document.getElementById('status-indicator'),
  pixelatedBorder: document.querySelector('.pixelated-border'),
};

let onTowerSelect = null;
let onTowerSell = null;
let onTowerUpgrade = null;

export function setupPanels(callbacks) {
  onTowerSelect = callbacks.onTowerSelect;
  onTowerSell = callbacks.onTowerSell;
  onTowerUpgrade = callbacks.onTowerUpgrade;
  buildTowerShop();
}

function buildTowerShop() {
  const grid = elements.towerShopGrid;
  grid.innerHTML = '';
  Object.values(TOWER_TYPES).forEach((t) => {
    const item = document.createElement('div');
    item.className = 'tower-shop-item';
    item.innerHTML = t.icon;
    item.title = `${t.name}: ${t.description}. Cost: ${t.cost}g`;
    item.addEventListener('click', () => onTowerSelect?.(t.id));
    item.dataset.towerId = t.id;
    grid.appendChild(item);
  });

  elements.sellBtn.addEventListener('click', () => onTowerSell?.());
  elements.upgradeBtn.addEventListener('click', () => onTowerUpgrade?.());
}

export function updateTowerShopAffordability(gold) {
  document.querySelectorAll('.tower-shop-item').forEach((item) => {
    const t = TOWER_TYPES[item.dataset.towerId];
    if (t) {
      if (gold < t.cost) item.classList.add('unaffordable');
      else item.classList.remove('unaffordable');
    }
  });
}

export function updateTowerMenu(tower, gold) {
  if (!tower) {
    document.querySelectorAll('.tower-shop-item').forEach((el) => el.classList.remove('selected'));
    elements.towerInfo.innerHTML = '<span class="tower-info-text">SELECT A TOWER</span>';
    elements.sellBtn.style.display = 'none';
    elements.upgradeBtn.style.display = 'none';
    return;
  }

  const tType = TOWER_TYPES[tower.typeId];
  const upgradeCost = tower.level < 3 ? Math.floor(tType.cost * tType.upgradeCostMultiplier * tower.level) : 0;
  const sellValue = Math.floor(getTotalInvestment(tower) * 0.7);

  elements.towerInfo.innerHTML = `
    <span style="color:${tType.color}">${tType.name} Lv.${tower.level}</span><br>
    DMG: ${Math.floor(tower.damage)} | Range: ${tType.range}<br>
    ${upgradeCost ? `Upgrade: ${upgradeCost}g` : 'MAX LEVEL'}
  `;
  elements.sellBtn.style.display = 'inline-block';
  elements.sellBtn.textContent = `SELL (${sellValue}g)`;

  elements.upgradeBtn.style.display = 'inline-block';
  if (upgradeCost) {
    elements.upgradeBtn.textContent = `UPGRADE (${upgradeCost}g)`;
  } else {
    elements.upgradeBtn.textContent = 'MAX LEVEL';
  }
  elements.upgradeBtn.disabled = !(upgradeCost && gold >= upgradeCost);
}

function getTotalInvestment(tower) {
  const tType = TOWER_TYPES[tower.typeId];
  let total = tType.cost;
  for (let lv = 2; lv <= tower.level; lv++) total += Math.floor(tType.cost * tType.upgradeCostMultiplier * (lv - 1));
  return total;
}

export function updateDataPanel(gameState) {
  elements.waveValue.textContent = `${gameState.currentWave}/${TOTAL_WAVES}`;
  elements.livesValue.textContent = gameState.lives;
  elements.livesValue.style.color = gameState.lives <= 5 ? '#f87171' : '#ffffff';
  elements.goldValue.textContent = gameState.gold;
  elements.killsValue.textContent = gameState.kills;
  elements.statusValue.textContent = gameState.statusText;
  elements.waveProgressBar.style.width = `${(gameState.currentWave / TOTAL_WAVES) * 100}%`;
}

export function updateStory(score) {
  let html = '';
  for (let i = 0; i <= score; i++) {
    if (storyFragments[i]) html += storyFragments[i] + ' ';
  }
  elements.storyContent.innerHTML = html || '<p>The realm awaits its defender...</p>';
  elements.storyContent.scrollTop = elements.storyContent.scrollHeight;
}

export function setupSettings(gameState, audio, audioCallbacks) {
  elements.speedSlider.value = gameState.speed;
  elements.speedValue.textContent = gameState.speed.toFixed(1);
  elements.burstSlider.value = gameState.burstIntensity;
  elements.burstValue.textContent = gameState.burstIntensity.toFixed(2);
  elements.musicVolumeSlider.value = gameState.musicVolume;
  elements.musicVolumeValue.textContent = gameState.musicVolume.toFixed(1);
  elements.sfxVolumeSlider.value = gameState.sfxVolume;
  elements.sfxVolumeValue.textContent = gameState.sfxVolume.toFixed(1);

  elements.speedSlider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    elements.speedValue.textContent = v.toFixed(1);
    gameState.speed = v;
    addTerminalLine(`Temporal_Flow set to ${v}x`, 'settings');
  });
  elements.burstSlider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    elements.burstValue.textContent = v.toFixed(2);
    gameState.burstIntensity = v;
    addTerminalLine(`Particle intensity set to ${v}x`, 'settings');
  });
  elements.musicVolumeSlider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    elements.musicVolumeValue.textContent = v.toFixed(1);
    gameState.musicVolume = v;
    audio.backgroundMusic.volume = v;
    addTerminalLine(`Music volume: ${(v * 100).toFixed(0)}%`, 'settings');
  });
  elements.sfxVolumeSlider.addEventListener('input', (e) => {
    const v = parseFloat(e.target.value);
    elements.sfxVolumeValue.textContent = v.toFixed(1);
    gameState.sfxVolume = v;
    addTerminalLine(`SFX volume: ${(v * 100).toFixed(0)}%`, 'settings');
  });
}

export function setStatusText(text, indicatorColor = '#4ade80') {
  elements.statusValue.textContent = text;
  elements.statusIndicator.style.color = indicatorColor;
}

export function setSelectedTower(towerId) {
  document.querySelectorAll('.tower-shop-item').forEach((el) => {
    el.classList.toggle('selected', el.dataset.towerId === towerId);
  });
}

export function getPanelElements() { return elements; }
