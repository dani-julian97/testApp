import { initAmbientAudio } from "./core/audio.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

function lockSelection() {
  document.addEventListener("copy", (e) => e.preventDefault());
  document.addEventListener("cut", (e) => e.preventDefault());
  document.addEventListener("selectstart", (e) => {
    const tag = e.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    e.preventDefault();
  });
  document.addEventListener("contextmenu", (e) => {
    const tag = e.target?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    e.preventDefault();
  });
}

/** Load env scripts that set window.__IKIGAI_ENV__. Later files override. */
async function loadEnvScript(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return false;
    const text = await res.text();
    const script = document.createElement("script");
    script.text = text;
    document.head.appendChild(script);
    return true;
  } catch {
    return false;
  }
}

async function loadEnv() {
  // Committed public config (GitHub Pages / production)
  await loadEnvScript("./js/config/env.public.js");
  // Optional local overrides (gitignored)
  await loadEnvScript("./js/config/env.local.js");
}

async function boot() {
  const root = document.getElementById("app");
  if (!root) return;

  try {
    lockSelection();
    await loadEnv();
    initAmbientAudio();
    const { startApp } = await import("./core/flowController.js");
    await startApp(root);
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
