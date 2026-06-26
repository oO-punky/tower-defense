import gsap from 'gsap';

export function createPixelRevealGrid() {
  const container = document.getElementById('pixel-reveal-container');
  container.innerHTML = '';
  const { innerWidth, innerHeight } = window;
  const blockSize = innerHeight * 0.1;
  const numRows = 10;
  const numCols = Math.ceil(innerWidth / blockSize);
  for (let i = 0; i < numRows; i++) {
    const row = document.createElement('div');
    row.className = 'pixel-reveal-row';
    for (let j = 0; j < numCols; j++) {
      const block = document.createElement('div');
      block.className = 'pixel-reveal-block';
      block.style.opacity = '1';
      row.appendChild(block);
    }
    container.appendChild(row);
  }
}

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function animatePixelReveal() {
  const container = document.getElementById('pixel-reveal-container');
  const rows = document.querySelectorAll('.pixel-reveal-row');
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.to(container, { autoAlpha: 0, duration: 0.5,
        onComplete: () => (container.style.display = 'none'),
      });
    },
  });
  const rowBlocks = [];
  rows.forEach((row) => {
    rowBlocks.push(Array.from(row.querySelectorAll('.pixel-reveal-block')));
  });
  rowBlocks.forEach((blocks, rowIndex) => {
    const shuffledBlocks = shuffle([...blocks]);
    shuffledBlocks.forEach((block, blockIndex) => {
      tl.to(block, { opacity: 0, duration: 0.1, delay: 0.02 * (rowIndex + blockIndex), ease: 'power1.out' }, 0);
    });
  });
  return tl;
}

export function initLoading(onComplete) {
  createPixelRevealGrid();
  const loadingBar = document.getElementById('loading-progress-bar');
  let progress = 0;
  function updateLoading() {
    progress += Math.random() * 4 + 1;
    loadingBar.style.width = Math.min(progress, 100) + '%';
    if (progress <= 100) {
      setTimeout(updateLoading, 60);
    } else {
      setTimeout(() => {
        gsap.to('#loading-overlay', {
          opacity: 0, duration: 1, ease: 'power2.out',
          onComplete: () => {
            document.getElementById('loading-overlay').style.display = 'none';
            animatePixelReveal().then(onComplete);
          },
        });
      }, 500);
    }
  }
  updateLoading();
}
