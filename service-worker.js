const CACHE_NAME = "ikigai-app-v2";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/screens.css",
  "./js/main.js",
  "./js/core/router.js",
  "./js/core/store.js",
  "./js/core/haptics.js",
  "./js/core/audio.js",
  "./js/data/questions.js",
  "./js/ui/dom.js",
  "./js/ui/Button.js",
  "./js/ui/ProgressBar.js",
  "./js/ui/OptionCard.js",
  "./js/ui/ScreenLayout.js",
  "./js/screens/WelcomeScreen.js",
  "./js/screens/AuthScreen.js",
  "./js/screens/QuizScreen.js",
  "./js/screens/ReadyScreen.js",
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

  // Don't precache-trap large audio; network-first with cache fallback
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
          caches.match(request).then((r) => r || (isDocument ? caches.match("./index.html") : undefined))
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
