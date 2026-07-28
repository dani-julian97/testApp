import { startOnboarding } from "./core/flowController.js";
import { initAmbientAudio } from "./core/audio.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function boot() {
  const root = document.getElementById("app");
  if (!root) return;

  try {
    initAmbientAudio();
    startOnboarding(root);
    registerServiceWorker();
  } catch (error) {
    console.error("Ikigai failed to start:", error);
    root.innerHTML =
      '<div style="padding:2rem;font-family:system-ui,sans-serif;color:#fff;background:#000;min-height:100dvh;">' +
      "<h1 style=\"margin-bottom:0.75rem;\">Unable to load Ikigai</h1>" +
      "<p style=\"color:#9a9a9a;line-height:1.5;\">Please refresh the page.</p></div>";
  }
}

boot();
