# Supabase setup for Ikigai (vanilla JS PWA)

Ikigai uses **Supabase Auth + Postgres** for accounts and cloud sync. Local `localStorage` remains the offline cache. Without Supabase keys, the app still works fully in **guest mode**.

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a project (Free plan is fine for development)
3. Wait until the database is ready

## 2. API keys (client-safe only)

Dashboard → **Project Settings → API**:

| Value | Use in app |
| --- | --- |
| Project URL | `SUPABASE_URL` |
| `anon` `public` key | `SUPABASE_ANON_KEY` |

**Never** put the `service_role` key in the frontend, `env.local.js`, or Git.

## 3. Configure the app

```bash
cp js/config/env.local.example.js js/config/env.local.js
```

Edit `js/config/env.local.js`:

```js
window.__IKIGAI_ENV__ = {
  SUPABASE_URL: "https://YOUR_PROJECT_REF.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
  IS_DEV: true
};
```

`js/config/env.local.js` is gitignored.

Mirror values in `.env.example` for documentation only.

## 4. Run SQL migrations

### Option A — SQL editor

1. Dashboard → **SQL → New query**
2. Paste contents of `supabase/migrations/20260806120000_init.sql`
3. Run

### Option B — Supabase CLI

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates:

- `profiles` (+ trigger on `auth.users`)
- `user_plans`
- `quiz_answers`
- `habits` (read-only catalog table)
- `user_habits`
- `task_completions`
- `user_preferences`
- `user_app_state`

**Row Level Security is enabled** on all user tables. Users can only access their own rows.

## 5. Auth settings

Dashboard → **Authentication → Providers → Email**: enable Email.

### Redirect URLs

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: your app origin (e.g. `http://localhost:5500/` or GitHub Pages URL)
- **Redirect URLs**: include
  - `http://localhost:5500/**`
  - `https://YOUR_USERNAME.github.io/YOUR_REPO/**`
  - recovery uses hash `#recovery`

### Email confirmation

- If **Confirm email** is ON: after signup the user must verify before a session exists. The app shows a verify screen and keeps local progress until login.
- If OFF: signup returns a session immediately and guest data is migrated/pushed.

## 6. Password reset

The app calls `resetPasswordForEmail` with redirect:

```text
{origin}{pathname}#recovery
```

After the user opens the email link, the app detects the recovery hash and shows **Choose a new password**.

## 7. Edge Function: delete-account

Privileged user deletion stays server-side.

```bash
supabase functions deploy delete-account
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_URL=... SUPABASE_ANON_KEY=...
```

Source: `supabase/functions/delete-account/index.ts`

The client only sends the user JWT; the function uses the **service role** to call `auth.admin.deleteUser`. Related rows cascade-delete.

## 8. How sync works

```text
User action
→ update local state (instant UI)
→ persist localStorage
→ if authenticated: optimistic / debounced Supabase upsert
→ on failure: queue job, retry on `online`
```

Guest → account:

1. User creates account or logs in
2. Local state is merged with remote (completions union; plan preserved)
3. Merged state is pushed to Supabase

Logout **does not** wipe local guest/progress data unless account deletion or explicit reset.

## 9. Dev vs production

Use separate Supabase projects when you promote to production. Point `env.local.js` (or your host’s env injection) at the correct URL + anon key. Never share service-role keys with the static host.

## 10. Quick test checklist

- [ ] Guest onboarding + habit completion without keys
- [ ] Copy `env.local.js`, run migration, reload
- [ ] Sign up / verify / log in
- [ ] Guest progress still present after registration
- [ ] Second device: same habits + completions after login
- [ ] 21-day vs 40/90 plan circle counts
- [ ] Password reset email + new password screen
- [ ] Log out keeps local data; Account → Delete uses Edge Function
- [ ] Two accounts cannot read each other’s rows (RLS)

## Project layout

```text
js/config/env.js
js/lib/supabase/client.js
js/core/authStore.js
js/services/auth|profile|onboarding|habits|progress|sync/
supabase/migrations/
supabase/functions/delete-account/
docs/SUPABASE_SETUP.md
```
