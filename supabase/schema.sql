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

-- Tagebuch: festgehaltene Momente (Meilensteine aus dem Katalog oder eigene Momente)
create table if not exists moment_entries (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  milestone_id text,
  title text not null,
  emoji text,
  happened_on text not null,
  note text,
  photos text[] not null default '{}',
  created_at text not null,
  primary key (baby_id, id)
);

-- Altbestand (frühere "Noch nicht / Übt / Geschafft"-Abfrage). Wird von der App
-- nicht mehr gelesen; die Migration unten übernimmt "Geschafft"-Einträge als Momente.
create table if not exists milestone_progress (
  baby_id text not null,
  milestone_id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  status text not null,
  achieved_at text,
  primary key (baby_id, milestone_id)
);

-- Row Level Security: every table only exposes rows owned by the calling user.
-- Since only one shared login is used, this simply means "logged-in family sees its data".
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'baby_profiles', 'parent_profiles', 'pregnancy_profiles',
    'weight_logs', 'feeding_logs', 'sleep_logs', 'milestone_progress', 'moment_entries'
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

-- Einmalige Migration: bereits als "Geschafft" markierte Meilensteine werden zu
-- Tagebuch-Momenten (Titel wird in der App aus dem Katalog ergänzt, falls leer).
insert into moment_entries (baby_id, id, user_id, milestone_id, title, happened_on, created_at)
select
  mp.baby_id,
  'ms_' || mp.milestone_id,
  mp.user_id,
  mp.milestone_id,
  '',
  left(coalesce(mp.achieved_at, now()::text), 10),
  coalesce(mp.achieved_at, now()::text)
from milestone_progress mp
where mp.status = 'achieved'
on conflict (baby_id, id) do nothing;

-- Fotos zu Momenten: privater Storage-Bucket, jede Familie sieht nur ihren
-- eigenen Ordner (<user_id>/...).
insert into storage.buckets (id, name, public)
values ('moment-photos', 'moment-photos', false)
on conflict (id) do nothing;

drop policy if exists "moment_photos_owner" on storage.objects;
create policy "moment_photos_owner" on storage.objects for all
  using (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text);
