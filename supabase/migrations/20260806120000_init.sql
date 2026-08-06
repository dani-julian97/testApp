-- Ikigai initial schema: profiles, plans, quiz, habits, completions, preferences
-- RLS enabled on all user-owned tables. No service-role usage in clients.

create extension if not exists "pgcrypto";

-- ── updated_at helper ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ── profiles ───────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  timezone text default 'UTC',
  locale text default 'en',
  onboarding_completed boolean not null default false,
  current_onboarding_step integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, locale, timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'locale', 'en'),
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── user_plans ─────────────────────────────────────────────────────
create table if not exists public.user_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  duration_days integer not null check (duration_days > 0),
  start_date date not null,
  current_day integer not null default 1,
  status text not null default 'active'
    check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_plans_user_id_idx on public.user_plans (user_id);
create unique index if not exists user_plans_one_active_per_user
  on public.user_plans (user_id)
  where status = 'active';

create trigger user_plans_set_updated_at
before update on public.user_plans
for each row execute function public.set_updated_at();

alter table public.user_plans enable row level security;

create policy "user_plans_select_own"
  on public.user_plans for select using (auth.uid() = user_id);
create policy "user_plans_insert_own"
  on public.user_plans for insert with check (auth.uid() = user_id);
create policy "user_plans_update_own"
  on public.user_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_plans_delete_own"
  on public.user_plans for delete using (auth.uid() = user_id);

-- ── quiz_answers ───────────────────────────────────────────────────
create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  answer jsonb not null default 'null'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, question_id)
);

create trigger quiz_answers_set_updated_at
before update on public.quiz_answers
for each row execute function public.set_updated_at();

alter table public.quiz_answers enable row level security;

create policy "quiz_answers_select_own"
  on public.quiz_answers for select using (auth.uid() = user_id);
create policy "quiz_answers_insert_own"
  on public.quiz_answers for insert with check (auth.uid() = user_id);
create policy "quiz_answers_update_own"
  on public.quiz_answers for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_answers_delete_own"
  on public.quiz_answers for delete using (auth.uid() = user_id);

-- ── habits (catalog, read-only for clients) ────────────────────────
create table if not exists public.habits (
  id text primary key,
  title text not null,
  description text,
  category text,
  image_key text,
  icon_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger habits_set_updated_at
before update on public.habits
for each row execute function public.set_updated_at();

alter table public.habits enable row level security;

create policy "habits_select_all"
  on public.habits for select
  using (true);

-- No insert/update/delete policies for regular users (catalog managed in SQL / dashboard)

-- ── user_habits ────────────────────────────────────────────────────
create table if not exists public.user_habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null,
  is_selected boolean not null default true,
  target_frequency integer default 1,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, habit_id)
);

create trigger user_habits_set_updated_at
before update on public.user_habits
for each row execute function public.set_updated_at();

alter table public.user_habits enable row level security;

create policy "user_habits_select_own"
  on public.user_habits for select using (auth.uid() = user_id);
create policy "user_habits_insert_own"
  on public.user_habits for insert with check (auth.uid() = user_id);
create policy "user_habits_update_own"
  on public.user_habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_habits_delete_own"
  on public.user_habits for delete using (auth.uid() = user_id);

-- ── task_completions (daily habit completions) ─────────────────────
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  habit_id text not null,
  task_id text not null,
  completion_date date not null,
  completed boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, task_id, completion_date)
);

create index if not exists task_completions_user_date_idx
  on public.task_completions (user_id, completion_date);

create trigger task_completions_set_updated_at
before update on public.task_completions
for each row execute function public.set_updated_at();

alter table public.task_completions enable row level security;

create policy "task_completions_select_own"
  on public.task_completions for select using (auth.uid() = user_id);
create policy "task_completions_insert_own"
  on public.task_completions for insert with check (auth.uid() = user_id);
create policy "task_completions_update_own"
  on public.task_completions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_completions_delete_own"
  on public.task_completions for delete using (auth.uid() = user_id);

-- ── user_preferences ───────────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sound_enabled boolean not null default true,
  haptics_enabled boolean not null default true,
  notifications_enabled boolean not null default false,
  theme text not null default 'dark',
  preferred_reminder_time time,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

create policy "user_preferences_select_own"
  on public.user_preferences for select using (auth.uid() = user_id);
create policy "user_preferences_insert_own"
  on public.user_preferences for insert with check (auth.uid() = user_id);
create policy "user_preferences_update_own"
  on public.user_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_preferences_delete_own"
  on public.user_preferences for delete using (auth.uid() = user_id);

-- ── user_app_state (journals, tasks, custom habits, xp, etc.) ──────
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  custom_habits jsonb not null default '[]'::jsonb,
  journal_entries jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  xp integer not null default 0,
  unlocked_trophies jsonb not null default '[]'::jsonb,
  contract_signed boolean not null default false,
  selected_date date,
  main_tab text default 'home',
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger user_app_state_set_updated_at
before update on public.user_app_state
for each row execute function public.set_updated_at();

alter table public.user_app_state enable row level security;

create policy "user_app_state_select_own"
  on public.user_app_state for select using (auth.uid() = user_id);
create policy "user_app_state_insert_own"
  on public.user_app_state for insert with check (auth.uid() = user_id);
create policy "user_app_state_update_own"
  on public.user_app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_app_state_delete_own"
  on public.user_app_state for delete using (auth.uid() = user_id);
