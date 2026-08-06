/**
 * Copy to env.local.js for local overrides (gitignored).
 * For GitHub Pages / production, edit env.public.js (committed).
 *
 * SUPABASE_URL = Project URL only, e.g. https://xxxx.supabase.co
 * (Do NOT add /rest/v1/)
 * Never put the service_role key in these files.
 */
window.__IKIGAI_ENV__ = {
  SUPABASE_URL: "https://YOUR_PROJECT_REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  IS_DEV: true
};
