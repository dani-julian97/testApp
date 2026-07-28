import { initRouter, registerScreen, navigate } from "./core/router.js";
import { createWelcomeScreen } from "./screens/WelcomeScreen.js";
import { createLoginScreen, createSignupScreen } from "./screens/AuthScreen.js";
import { createQuizScreen } from "./screens/QuizScreen.js";
import { createReadyScreen } from "./screens/ReadyScreen.js";

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("./service-worker.js")
    .catch(() => {
      /* offline registration failures are non-blocking */
    });
}

async function boot() {
  const root = document.getElementById("app");
  if (!root) return;

  try {
    initRouter(root);

    registerScreen("welcome", createWelcomeScreen());
    registerScreen("login", createLoginScreen());
    registerScreen("signup", createSignupScreen());
    registerScreen("quiz", createQuizScreen());
    registerScreen("ready", createReadyScreen());

    await navigate("welcome");
    registerServiceWorker();
  } catch (error) {
    console.error("Ikigai failed to start:", error);
    root.innerHTML =
      '<div style="padding:2rem;font-family:system-ui,sans-serif;color:#15241f;">' +
      "<h1 style=\"margin-bottom:0.75rem;\">Unable to load Ikigai</h1>" +
      "<p style=\"color:#6b7f75;line-height:1.5;\">Please refresh the page. " +
      "If the issue persists, clear site data and try again.</p></div>";
  }
}

boot();
