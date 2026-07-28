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
  initRouter(root);

  registerScreen("welcome", createWelcomeScreen());
  registerScreen("login", createLoginScreen());
  registerScreen("signup", createSignupScreen());
  registerScreen("quiz", createQuizScreen());
  registerScreen("ready", createReadyScreen());

  await navigate("welcome");
  registerServiceWorker();
}

boot();
