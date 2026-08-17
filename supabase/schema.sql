-- Mia app schema: run once in the Supabase SQL editor (Project -> SQL Editor -> New query).
-- Every row is owned by the one shared auth user (user_id = auth.uid()); since the whole
-- family logs into the same account, everyone automatically sees the same data.

create table if not exists baby_profiles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  birth_date text not null,
  due_date text,
  gender text,
  feeding_type text not null,
  avatar_color text not null,
  created_at text not null,
  photo_uri text,
  weight_grams integer,
  premature boolean,
  siblings text,
  medical_notes text,
  description text
);

create table if not exists parent_profiles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  role text not null,
  created_at text not null,
  description text
);

create table if not exists pregnancy_profiles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  nickname text not null,
  due_date text not null,
  avatar_color text not null,
  created_at text not null,
  description text
);

create table if not exists chat_sessions (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  baby_id text not null,
  created_at text not null,
  updated_at text not null,
  preview text not null
);
create index if not exists chat_sessions_baby_id_idx on chat_sessions(baby_id);

create table if not exists chat_messages (
  session_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  role text not null,
  content text not null,
  timestamp text not null,
  primary key (session_id, id)
);

create table if not exists memories (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  content text not null,
  category text not null,
  created_at text not null,
  primary key (baby_id, id)
);

create table if not exists weight_logs (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  weight_grams integer not null,
  measured_at text not null,
  note text,
  primary key (baby_id, id)
);

create table if not exists feeding_logs (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  type text not null,
  started_at text not null,
  duration_minutes integer not null,
  side text,
  amount_ml integer,
  note text,
  primary key (baby_id, id)
);

create table if not exists sleep_logs (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  type text not null,
  started_at text not null,
  ended_at text not null,
  duration_minutes integer not null,
  note text,
  primary key (baby_id, id)
);

create table if not exists milestone_progress (
  baby_id text not null,
  milestone_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  status text not null,
  achieved_at text,
  primary key (baby_id, milestone_id)
);

-- Server-side daily chat quota tracking (backend uses the service role key,
-- which bypasses RLS - clients never read/write this table directly).
create table if not exists chat_usage (
  user_id uuid not null references auth.users(id),
  day date not null,
  count integer not null default 0,
  primary key (user_id, day)
);

alter table chat_usage enable row level security;
-- No policies are created for chat_usage on purpose: only the service role
-- (used exclusively by the backend) may read/write it.

-- Row Level Security: every table only exposes rows owned by the calling user.
-- Since only one shared login is used, this simply means "logged-in family sees its data".
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'baby_profiles', 'parent_profiles', 'pregnancy_profiles',
    'chat_sessions', 'chat_messages', 'memories',
    'weight_logs', 'feeding_logs', 'sleep_logs', 'milestone_progress'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_all" on %I', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;
