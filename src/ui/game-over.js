export function showGameOver(wavesSurvived, kills, isVictory) {
  const overlay = document.getElementById('game-over-overlay');
  const title = document.getElementById('game-over-title');
  const finalWaves = document.getElementById('final-waves');
  const finalKills = document.getElementById('final-kills');

  title.textContent = isVictory ? 'REALM SECURED' : 'REALM FALLEN';
  title.style.color = isVictory ? '#4ade80' : '#c084fc';
  finalWaves.textContent = wavesSurvived;
  finalKills.textContent = kills;

  Object.assign(overlay.style, { opacity: '1', pointerEvents: 'auto' });
}

export function hideGameOver() {
  const overlay = document.getElementById('game-over-overlay');
  Object.assign(overlay.style, { opacity: '0', pointerEvents: 'none' });
}

export function setupGameOverButtons(onRestart) {
  document.getElementById('restart-btn').addEventListener('click', () => {
    hideGameOver();
    onRestart();
  });
}
