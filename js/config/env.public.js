/**
 * Public client config (safe to commit).
 * Supabase anon key is designed for browsers; protect data with RLS.
 * Never put the service_role key here.
 *
 * Local overrides: js/config/env.local.js (gitignored) wins when present.
 */
window.__IKIGAI_ENV__ = {
  // Project URL only — no /rest/v1/ suffix
  SUPABASE_URL: "https://npfhvgfrhxfudulfynnw.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZmh2Z2ZyaHhmdWR1bGZ5bm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNDY1NjQsImV4cCI6MjEwMTYyMjU2NH0.08yG237-PzGlCYQCFzJvswGFsZTzDkRAHGX_GeKrums",
  IS_DEV: false
};
