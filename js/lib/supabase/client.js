import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm";
import { ENV, isSupabaseConfigured } from "../../config/env.js";

const AUTH_STORAGE_KEY = "ikigai_supabase_auth";

/**
 * Web PWA session storage.
 * Uses localStorage (Supabase SPA default). Tokens are never logged.
 * Native SecureStore is unavailable in the browser; IndexedDB is an option
 * but localStorage matches the official web guidance for @supabase/supabase-js.
 */
const authStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore quota */
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
};

/** @type {import("@supabase/supabase-js").SupabaseClient | null} */
let client = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;

  client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
      storageKey: AUTH_STORAGE_KEY,
      flowType: "pkce"
    }
  });

  return client;
}

export function isCloudEnabled() {
  return Boolean(getSupabase());
}

export { AUTH_STORAGE_KEY };
