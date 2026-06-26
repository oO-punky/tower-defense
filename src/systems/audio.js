let audioContext;
const sfxNodes = {};
const audioBuffers = {};

export function getAudioContext() { return audioContext; }

export function initAudioContext() {
  if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
}

export async function preloadAudioBuffer(audioElement) {
  if (!audioContext || !audioElement || !audioElement.src || audioBuffers[audioElement.src]) return;
  try {
    const response = await fetch(audioElement.src);
    const arrayBuffer = await response.arrayBuffer();
    audioBuffers[audioElement.src] = await audioContext.decodeAudioData(arrayBuffer);
  } catch {
    // fallback to HTMLAudio
  }
}

export function preloadAllAudio(audioElements) {
  if (!audioContext || audioContext.state !== 'running') return;
  Object.values(audioElements).forEach(preloadAudioBuffer);
}

export function playSoundWithPitch(audioElement, sfxVolume, { volume = 1.0, pitchMin = 0.9, pitchMax = 1.1 } = {}) {
  if (!audioElement) return;

  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const isWebAudioReady = audioContext && audioContext.state === 'running' && audioBuffers[audioElement.src];
  const effectiveVolume = volume * sfxVolume;

  if (!isWebAudioReady) {
    if (audioElement.play) {
      audioElement.currentTime = 0;
      audioElement.volume = effectiveVolume;
      audioElement.play().catch(() => {});
    }
    return;
  }

  if (sfxNodes[audioElement.id]) {
    try { sfxNodes[audioElement.id].stop(); sfxNodes[audioElement.id].disconnect(); } catch {}
    delete sfxNodes[audioElement.id];
  }

  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  source.buffer = audioBuffers[audioElement.src];
  gainNode.gain.value = effectiveVolume;
  source.playbackRate.value = Math.random() * (pitchMax - pitchMin) + pitchMin;
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);

  try {
    source.start(0);
    sfxNodes[audioElement.id] = source;
    source.onended = () => {
      if (sfxNodes[audioElement.id] === source) delete sfxNodes[audioElement.id];
      try { source.disconnect(); gainNode.disconnect(); } catch {}
    };
  } catch {
    if (audioElement.play) {
      audioElement.currentTime = 0;
      audioElement.volume = effectiveVolume;
      audioElement.play().catch(() => {});
    }
  }
}

export function stopAllSfx() {
  Object.values(sfxNodes).forEach((node) => {
    try { node.stop(); node.disconnect(); } catch {}
  });
  for (const key in sfxNodes) delete sfxNodes[key];
}
