const CACHE_NAME = "ikigai-app-v12";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/screens.css",
  "./js/main.js",
  "./js/config/env.js",
  "./js/config/env.public.js",
  "./js/config/env.local.example.js",
  "./js/lib/supabase/client.js",
  "./js/lib/supabase/types.js",
  "./js/core/flowController.js",
  "./js/core/router.js",
  "./js/core/store.js",
  "./js/core/authStore.js",
  "./js/core/storage.js",
  "./js/core/haptics.js",
  "./js/core/audio.js",
  "./js/data/habits.js",
  "./js/data/habitImages.js",
  "./js/data/progress.js",
  "./js/data/flow.js",
  "./js/data/trophies.js",
  "./js/data/aspects.js",
  "./js/services/auth/authService.js",
  "./js/services/auth/errors.js",
  "./js/services/profile/profileService.js",
  "./js/services/onboarding/onboardingService.js",
  "./js/services/habits/habitsService.js",
  "./js/services/progress/progressService.js",
  "./js/services/sync/syncService.js",
  "./js/services/sync/pendingQueue.js",
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
  "./js/screens/AuthScreen.js",
  "./js/screens/AccountScreen.js",
  "./js/screens/ResetPasswordScreen.js",
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
  "./assets/images/welcome.png",
  "./assets/images/habits/cold-shower.png",
  "./assets/images/habits/deep-work.png",
  "./assets/images/habits/good-diet.png",
  "./assets/images/habits/meditation.png",
  "./assets/images/habits/no-doomscroll.png",
  "./assets/images/habits/reading.png",
  "./assets/images/habits/running.png",
  "./assets/images/habits/streching.png",
  "./assets/images/habits/write-journal.png"
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

  const url = new URL(request.url);

  // Always network for Supabase / CDN SDK (auth + API)
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("jsdelivr.net") ||
    url.hostname.includes("esm.sh")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  const isDocument =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

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
