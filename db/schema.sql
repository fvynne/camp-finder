-- Camp Finder — core schema
-- Run this once in the Supabase SQL editor (Database -> SQL Editor -> New query).
-- It is safe to re-run: it uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- 1. Extensions -------------------------------------------------------------
create extension if not exists postgis;        -- geo radius search
create extension if not exists pgcrypto;       -- gen_random_uuid()

-- 2. Reference data: zip -> location ---------------------------------------
-- The app passes a zip code; we look up its lat/lng here so the API key
-- never has to live in the mobile client.
create table if not exists zip_codes (
  zip       text primary key,
  city      text,
  state     text,
  location  geography(Point, 4326) not null
);

-- 3. Camps ------------------------------------------------------------------
create table if not exists camps (
  id                   uuid primary key default gen_random_uuid(),
  place_id             text unique,                 -- Google Places id (for de-dupe on re-discovery)
  name                 text not null,
  description          text,
  address              text,
  city                 text,
  state                text default 'WA',
  zip                  text,
  location             geography(Point, 4326) not null,
  price_per_week_cents integer,                     -- null = unknown (still shown, scored neutrally)
  length_type          text check (length_type in ('half_day','all_day','overnight')),
  min_age              integer,
  max_age              integer,
  interests            text[] default '{}',         -- subset of the allowed interest slugs
  rating               numeric(2,1),                -- 0.0 - 5.0
  website              text,
  phone                text,
  photo_url            text,
  source               text default 'manual',       -- 'sample' | 'google_places' | 'manual'
  created_at           timestamptz default now()
);

-- Spatial index makes "within 75 miles" fast.
create index if not exists camps_location_gix on camps using gist (location);

-- 4. Sessions (a camp runs multiple dated programs) -------------------------
-- The parent's date filter must match a SESSION, not the camp in general.
create table if not exists camp_sessions (
  id              uuid primary key default gen_random_uuid(),
  camp_id         uuid not null references camps(id) on delete cascade,
  start_date      date not null,
  end_date        date not null,
  spots_available integer
);
create index if not exists camp_sessions_camp_idx on camp_sessions(camp_id);

-- 5. Row Level Security: allow public read of camps -------------------------
-- The mobile app uses the anon key and only needs to READ.
alter table camps         enable row level security;
alter table camp_sessions enable row level security;
alter table zip_codes     enable row level security;

drop policy if exists "public read camps"    on camps;
drop policy if exists "public read sessions" on camp_sessions;
drop policy if exists "public read zips"     on zip_codes;

create policy "public read camps"    on camps         for select using (true);
create policy "public read sessions" on camp_sessions for select using (true);
create policy "public read zips"     on zip_codes     for select using (true);

-- Writes (discovery/enrichment scripts) use the SERVICE ROLE key, which
-- bypasses RLS, so no insert/update policies are needed here.
