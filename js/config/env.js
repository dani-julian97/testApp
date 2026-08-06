/**
 * Runtime environment for the Ikigai PWA.
 * Values come from js/config/env.local.js (gitignored) via window.__IKIGAI_ENV__.
 * Never put the service-role key here.
 * Always read live — env.local.js may load after the first module evaluation.
 */
function readEnv() {
  const raw =
    (typeof window !== "undefined" && window.__IKIGAI_ENV__) || {};
  return {
    SUPABASE_URL: String(raw.SUPABASE_URL || "").trim(),
    SUPABASE_ANON_KEY: String(raw.SUPABASE_ANON_KEY || "").trim(),
    IS_DEV: Boolean(raw.IS_DEV)
  };
}

export function getEnv() {
  return readEnv();
}

/** Live getters so late-loaded env.local.js is visible. */
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
  return Boolean(e.SUPABASE_URL && e.SUPABASE_ANON_KEY);
}

export function getAuthRedirectUrl(path = "") {
  const base = `${window.location.origin}${window.location.pathname.replace(/\/?$/, "/")}`;
  return `${base}${path.replace(/^\//, "")}`;
}
