-- Mia app schema: im Supabase SQL Editor ausführen (Project -> SQL Editor -> New query).
-- Das Skript ist idempotent: es kann bei neuen und bestehenden Projekten (auch
-- mehrfach) laufen und übernimmt Daten aus früheren App-Versionen.
-- Jede Zeile gehört dem einen gemeinsamen Familien-Login (user_id = auth.uid()).

-- ─── Kinder & Schwangerschaften ──────────────────────────────────────────────

create table if not exists baby_profiles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  name text not null,
  birth_date text not null,
  due_date text,
  gender text,
  feeding_type text,
  avatar_color text not null,
  created_at text not null,
  photo_uri text,
  weight_grams integer,
  premature boolean,
  siblings text,
  medical_notes text,
  description text
);
-- Früher Pflichtfeld, wird nicht mehr abgefragt
alter table baby_profiles alter column feeding_type drop not null;

create table if not exists pregnancy_profiles (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  nickname text not null,
  due_date text not null,
  avatar_color text not null,
  created_at text not null,
  description text
);

-- ─── Tagebuch ────────────────────────────────────────────────────────────────
-- Festgehaltene Momente: Meilensteine aus dem Katalog oder eigene Momente.
-- baby_id ist die ID eines Kindes oder einer Schwangerschaft.

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

-- ─── Wachstum ────────────────────────────────────────────────────────────────

create table if not exists growth_entries (
  baby_id text not null,
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id),
  measured_on text not null,
  height_cm numeric,
  weight_grams integer,
  head_cm numeric,
  note text,
  created_at text not null,
  primary key (baby_id, id)
);

-- ─── Row Level Security ──────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  for t in select unnest(array['baby_profiles', 'pregnancy_profiles', 'moment_entries', 'growth_entries'])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "owner_all" on %I', t);
    execute format(
      'create policy "owner_all" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;

-- ─── Fotos ───────────────────────────────────────────────────────────────────
-- Privater Storage-Bucket, jede Familie sieht nur ihren eigenen Ordner (<user_id>/...).

insert into storage.buckets (id, name, public)
values ('moment-photos', 'moment-photos', false)
on conflict (id) do nothing;

drop policy if exists "moment_photos_owner" on storage.objects;
create policy "moment_photos_owner" on storage.objects for all
  using (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'moment-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Übernahme aus früheren App-Versionen ────────────────────────────────────
-- Läuft nur, wenn die alten Tabellen existieren. Doppelte Läufe sind harmlos.

do $$
begin
  -- Als "Geschafft" markierte Meilensteine werden zu Tagebuch-Momenten
  if to_regclass('public.milestone_progress') is not null then
    insert into moment_entries (baby_id, id, user_id, milestone_id, title, happened_on, created_at)
    select mp.baby_id, 'ms_' || mp.milestone_id, mp.user_id, mp.milestone_id, '',
           left(coalesce(mp.achieved_at, now()::text), 10), coalesce(mp.achieved_at, now()::text)
    from milestone_progress mp
    where mp.status = 'achieved'
    on conflict (baby_id, id) do nothing;
  end if;

  -- Gewichtseinträge werden zu Messungen
  if to_regclass('public.weight_logs') is not null then
    insert into growth_entries (baby_id, id, user_id, measured_on, weight_grams, note, created_at)
    select w.baby_id, 'w_' || w.id, w.user_id, left(w.measured_at, 10), w.weight_grams, w.note, w.measured_at
    from weight_logs w
    on conflict (baby_id, id) do nothing;
  end if;
end $$;

-- Geburtsgewicht aus dem Profil wird zur ersten Messung
insert into growth_entries (baby_id, id, user_id, measured_on, weight_grams, note, created_at)
select b.id, 'birth', b.user_id, left(b.birth_date, 10), b.weight_grams, 'Geburt', b.created_at
from baby_profiles b
where b.weight_grams is not null
on conflict (baby_id, id) do nothing;
