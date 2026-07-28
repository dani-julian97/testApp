/**
 * Ambient audio — starts as soon as the app loads.
 */
const VOLUME = 0.22;
let audio = null;
let isPlaying = false;

function ensureAudio() {
  if (audio) return audio;

  audio = document.getElementById("ambient-audio");
  if (!audio) {
    audio = new Audio("./assets/audio/waves.mp3");
    audio.id = "ambient-audio";
    audio.loop = true;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "");
    audio.setAttribute("webkit-playsinline", "");
    document.body.appendChild(audio);
  }

  audio.loop = true;
  audio.volume = VOLUME;
  return audio;
}

async function tryPlay() {
  const el = ensureAudio();
  if (isPlaying && !el.paused) return true;

  try {
    el.muted = false;
    el.volume = VOLUME;
    await el.play();
    isPlaying = true;
    return true;
  } catch {
    // Muted autoplay is allowed on most mobile browsers; unmute right after.
    try {
      el.muted = true;
      await el.play();
      el.muted = false;
      el.volume = VOLUME;
      isPlaying = true;
      return true;
    } catch {
      return false;
    }
  }
}

function scheduleRetries() {
  const retry = () => {
    if (!isPlaying) tryPlay();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") retry();
  });

  window.addEventListener("pageshow", retry);
  window.addEventListener("focus", retry);
}

export function initAmbientAudio() {
  ensureAudio();
  scheduleRetries();
  tryPlay();
}

export async function startAmbientAudio() {
  await tryPlay();
}

export function stopAmbientAudio() {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  isPlaying = false;
}
