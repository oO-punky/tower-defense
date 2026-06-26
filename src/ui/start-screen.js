export function setupStartScreen(onStart) {
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');

  startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    onStart();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && startScreen.style.display !== 'none') {
      e.preventDefault();
      startScreen.style.display = 'none';
      onStart();
    }
  });
}

export function showStartScreen() {
  document.getElementById('start-screen').style.display = 'flex';
}
