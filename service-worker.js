const CACHE_NAME = "ikigai-app-v6";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/screens.css",
  "./js/main.js",
  "./js/core/flowController.js",
  "./js/core/router.js",
  "./js/core/store.js",
  "./js/core/storage.js",
  "./js/core/haptics.js",
  "./js/core/audio.js",
  "./js/data/habits.js",
  "./js/data/flow.js",
  "./js/data/trophies.js",
  "./js/app/MainApp.js",
  "./js/ui/dom.js",
  "./js/ui/icons.js",
  "./js/ui/Button.js",
  "./js/ui/ProgressBar.js",
  "./js/ui/Slider.js",
  "./js/ui/HabitGrid.js",
  "./js/ui/HabitCard.js",
  "./js/ui/LifeDots.js",
  "./js/ui/RadarChart.js",
  "./js/ui/HoldButton.js",
  "./js/ui/Shell.js",
  "./js/screens/WelcomeScreen.js",
  "./js/screens/AgeScreen.js",
  "./js/screens/HabitDetailScreen.js",
  "./js/screens/BaselineScreen.js",
  "./js/screens/LifeScreen.js",
  "./js/screens/CalculatingScreen.js",
  "./js/screens/StatsScreen.js",
  "./js/screens/AdjustHabitsScreen.js",
  "./js/screens/AddHabitScreen.js",
  "./js/screens/ContractScreen.js",
  "./js/screens/CelebrationScreen.js",
  "./js/screens/NotificationsScreen.js",
  "./js/screens/PlanReadyScreen.js",
  "./js/screens/PlanLengthScreen.js",
  "./assets/images/icon-192.png",
  "./assets/images/welcome.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const isDocument =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

  const url = new URL(request.url);
  const isAudio = url.pathname.endsWith(".mp3");

  if (isDocument || isAudio) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok && !isAudio) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((r) => r || (isDocument ? caches.match("./index.html") : undefined))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetched;
    })
  );
});
