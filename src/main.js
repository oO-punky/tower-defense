import '/src/style.css';
import gsap from 'gsap';

import { Game } from './game.js';
import { initLoading } from './ui/loading.js';
import { setupStartScreen, showStartScreen } from './ui/start-screen.js';
import { setupGameOverButtons, hideGameOver, showGameOver } from './ui/game-over.js';
import { setupPanels, setupSettings, updateDataPanel, updateTowerMenu, setSelectedTower, setStatusText } from './ui/panels.js';
import { CANVAS_SIZE } from './config.js';
import { initAudioContext, preloadAllAudio, playSoundWithPitch, stopAllSfx } from './systems/audio.js';
import { addTerminalLine } from './systems/terminal.js';
import { triggerScreenShake } from './systems/effects.js';

const canvas = document.getElementById('game-canvas');
const audioElements = {
  backgroundMusic: document.getElementById('background-music'),
  buildSound: document.getElementById('build-sound'),
  gameOverSound: document.getElementById('game-over-sound'),
  waveClearSound: document.getElementById('wave-clear-sound'),
  waveHornSound: document.getElementById('wave-horn-sound'),
  explosionSound: document.getElementById('explosion-sound'),
  upgradeSound: document.getElementById('upgrade-sound'),
};

let game;

function playSound(id, opts = {}) {
  const el = audioElements[id + 'Sound'] || audioElements[id];
  if (!el || !game) return;
  playSoundWithPitch(el, game.sfxVolume, opts);
}

function startGame() {
  initAudioContext();
  if (!game) {
    game = new Game(canvas, audioElements, {
      onBuild(tower) {
        playSound('build', { pitchMin: 0.9, pitchMax: 1.1 });
        game.particles.burst(tower.pixelX, tower.pixelY, [tower.color, '#ffffff'], game.burstIntensity);
      },
      onUpgrade(tower) {
        playSound('upgrade', { volume: 0.8, pitchMin: 1.0, pitchMax: 1.3 });
      },
      onKill(enemy) {
        playSound('explosion', { volume: 0.15, pitchMin: 0.9, pitchMax: 1.1 });
      },
      onBossWave() {
        playSound('waveHorn', { volume: 0.6, pitchMin: 0.8, pitchMax: 1.0 });
      },
      onWaveClear() {
        playSound('waveClear', { volume: 0.5, pitchMin: 1.0, pitchMax: 1.2 });
      },
      onEnemyLeak() {
        playSound('explosion', { volume: 0.3, pitchMin: 0.7, pitchMax: 0.9 });
      },
      onGameEnd(isVictory, wavesSurvived, kills) {
        audioElements.backgroundMusic.pause();
        audioElements.backgroundMusic.currentTime = 0;
        stopAllSfx();
        if (!isVictory) {
          playSound('gameOver', { volume: 1.0, pitchMin: 0.85, pitchMax: 0.95 });
          playSound('explosion', { volume: 0.7, pitchMin: 0.55, pitchMax: 0.65 });
          game.particles.explosion(CANVAS_SIZE / 2, CANVAS_SIZE / 2, game.burstIntensity);
          triggerScreenShake(canvas, 1.5, 1.2);
        } else {
          playSound('waveClear', { volume: 1.0, pitchMin: 1.1, pitchMax: 1.4 });
          triggerScreenShake(canvas, 0.5, 0.6);
        }
        setTimeout(() => showGameOver(wavesSurvived, kills, isVictory), 1800);
      },
    });

    setupSettings(game, audioElements, {});
  }

  updateTowerMenu(null, game.gold);
  setSelectedTower(null);
  setStatusText('ACTIVE');

  if (game.audioEnabled) {
    audioElements.backgroundMusic.volume = game.musicVolume;
    audioElements.backgroundMusic.play().catch(() => {});
  }

  game.start();
}

function resetAndShowStart() {
  if (game) {
    game.reset();
  }
  hideGameOver();
  audioElements.backgroundMusic.pause();
  audioElements.backgroundMusic.currentTime = 0;
  document.getElementById('audio-toggle').textContent = game.audioEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
  showStartScreen();
}

// Panel callbacks
setupPanels({
  onTowerSelect(typeId) {
    if (!game || !game.gameRunning || game.gamePaused) return;
    game.selectTowerType(typeId);
  },
  onTowerSell() {
    if (!game || !game.gameRunning || game.gamePaused) return;
    game.sellTower();
  },
  onTowerUpgrade() {
    if (!game || !game.gameRunning || game.gamePaused) return;
    game.upgradeTower();
  },
});

// Start screen
setupStartScreen(startGame);

// Game over
setupGameOverButtons(resetAndShowStart);

// Pause
document.getElementById('pause-btn').addEventListener('click', () => {
  if (!game || !game.gameRunning) return;
  game.pause();
});

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
  resetAndShowStart();
  showStartScreen();
});

// Next Wave
document.getElementById('wave-btn').addEventListener('click', () => {
  if (!game || !game.gameRunning || game.gamePaused || game.waveActive) return;
  game.startWave();
});

// Audio toggle
document.getElementById('audio-toggle').addEventListener('click', () => {
  if (!game) return;
  game.audioEnabled = !game.audioEnabled;
  document.getElementById('audio-toggle').textContent = game.audioEnabled ? '\uD83D\uDD0A' : '\uD83D\uDD07';
  if (game.audioEnabled) {
    if (game.gameRunning && !game.gamePaused) {
      audioElements.backgroundMusic.volume = game.musicVolume;
      audioElements.backgroundMusic.play().catch(() => {});
    }
    addTerminalLine('Audio stream online.', 'audio_on');
  } else {
    audioElements.backgroundMusic.pause();
    stopAllSfx();
    addTerminalLine('Audio stream muted.', 'audio_off');
  }
});

// Clock
function updateClock() {
  const now = new Date();
  const timeString = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
  document.getElementById('timestamp').textContent = `SYS_TIME: ${timeString}`;
  setTimeout(updateClock, 1000);
}
updateClock();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (!game || !game.gameRunning || game.gamePaused) return;
  if (e.key === 'u') {
    e.preventDefault();
    game.upgradeTower();
  }
});
document.addEventListener('visibilitychange', () => {
  if (!game) return;
  if (document.hidden) {
    if (audioElements.backgroundMusic) {
      audioElements.backgroundMusic.pause();
    }
  } else {
    if (game.gameRunning && !game.gamePaused && game.audioEnabled) {
      audioElements.backgroundMusic.volume = game.musicVolume;
      audioElements.backgroundMusic.play().catch(() => {});
    }
  }
});

// Init loading
initLoading(() => {
  initAudioContext();
  showStartScreen();
});
