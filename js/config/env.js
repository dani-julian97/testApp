/**
 * Runtime environment for the Ikigai PWA.
 * Load order (see main.js):
 *   1. env.public.js  — committed, used on GitHub Pages
 *   2. env.local.js   — gitignored local overrides
 * Never put the service-role key here.
 */
function normalizeSupabaseUrl(url) {
  let u = String(url || "").trim();
  // Common mistake: pasting the REST endpoint instead of the project URL
  u = u.replace(/\/rest\/v1\/?$/i, "");
  u = u.replace(/\/+$/, "");
  return u;
}

function readEnv() {
  const raw =
    (typeof window !== "undefined" && window.__IKIGAI_ENV__) || {};
  return {
    SUPABASE_URL: normalizeSupabaseUrl(raw.SUPABASE_URL),
    SUPABASE_ANON_KEY: String(raw.SUPABASE_ANON_KEY || "").trim(),
    IS_DEV: Boolean(raw.IS_DEV)
  };
}

export function getEnv() {
  return readEnv();
}

/** Live getters so late-loaded env files are visible. */
export const ENV = {
  get SUPABASE_URL() {
    return readEnv().SUPABASE_URL;
  },
  get SUPABASE_ANON_KEY() {
    return readEnv().SUPABASE_ANON_KEY;
  },
  get IS_DEV() {
    return readEnv().IS_DEV;
  }
};

export function isSupabaseConfigured() {
  const e = readEnv();
  const placeholder =
    !e.SUPABASE_URL ||
    e.SUPABASE_URL.includes("YOUR_PROJECT") ||
    !e.SUPABASE_ANON_KEY ||
    e.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE");
  return !placeholder;
}

export function getAuthRedirectUrl(path = "") {
  const base = `${window.location.origin}${window.location.pathname.replace(/\/?$/, "/")}`;
  return `${base}${path.replace(/^\//, "")}`;
}
