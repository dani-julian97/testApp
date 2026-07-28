/**
 * Ambient audio controller for the welcome screen.
 */
const VOLUME = 0.22;
let audio = null;
let unlockBound = null;

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio("./assets/audio/waves.mp3");
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = VOLUME;
  return audio;
}

async function tryPlay() {
  const el = ensureAudio();
  try {
    await el.play();
    return true;
  } catch {
    return false;
  }
}

function onUnlock() {
  tryPlay().then((ok) => {
    if (ok) detachUnlock();
  });
}

function attachUnlock() {
  if (unlockBound) return;
  unlockBound = true;
  document.addEventListener("pointerdown", onUnlock, { passive: true });
  document.addEventListener("keydown", onUnlock);
}

function detachUnlock() {
  if (!unlockBound) return;
  unlockBound = false;
  document.removeEventListener("pointerdown", onUnlock);
  document.removeEventListener("keydown", onUnlock);
}

export async function startAmbientAudio() {
  const played = await tryPlay();
  if (!played) attachUnlock();
}

export function stopAmbientAudio() {
  detachUnlock();
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}
