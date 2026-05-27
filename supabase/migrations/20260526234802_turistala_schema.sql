-- ============================================================
-- Turistala Schema v2
-- Supabase / PostgreSQL + PostGIS
--
-- Changes from v1:
--   - type CHECK: lowercase only — enforce casing in seed script
--   - municities.region_id: nullable again (derived from province)
--     this is why your CSV import was failing
--   - bidirectional sync triggers replaced with one-way only
--     (goals → heatmap) to prevent infinite loop risk
--   - places and tags RLS added (were missing)
--   - seeder insert policies use WITH CHECK (true) correctly
-- ============================================================

DROP TABLE IF EXISTS public.user_place_goals  CASCADE;
DROP TABLE IF EXISTS public.journal_photos     CASCADE;
DROP TABLE IF EXISTS public.journal_entries    CASCADE;
DROP TABLE IF EXISTS public.visited_places     CASCADE;
DROP TABLE IF EXISTS public.users              CASCADE;
DROP TABLE IF EXISTS public.place_tags         CASCADE;
DROP TABLE IF EXISTS public.tags               CASCADE;
DROP TABLE IF EXISTS public.places             CASCADE;
DROP TABLE IF EXISTS public.municities         CASCADE;
DROP TABLE IF EXISTS public.provinces          CASCADE;
DROP TABLE IF EXISTS public.regions            CASCADE;

DROP FUNCTION IF EXISTS set_visited_at()        CASCADE;
DROP FUNCTION IF EXISTS sync_goal_to_heatmap()  CASCADE;
DROP FUNCTION IF EXISTS sync_heatmap_to_goals() CASCADE;


-- ============================================================
-- Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;


-- ============================================================
-- Geography reference tables
-- IDs are plain integers (no GENERATED ALWAYS) so your
-- seeder can supply its own IDs from the PSGC dataset
-- ============================================================

CREATE TABLE public.regions (
  id    integer      NOT NULL,
  code  varchar(10)  NOT NULL UNIQUE,
  name  varchar(100) NOT NULL,
  CONSTRAINT regions_pk PRIMARY KEY (id)
);

CREATE TABLE public.provinces (
  id        integer                   NOT NULL,
  code      varchar(10)               NOT NULL UNIQUE,
  name      varchar(100)              NOT NULL,
  region_id integer                   NOT NULL,
  geo_json  geometry(Geometry, 4326),
  CONSTRAINT provinces_pk           PRIMARY KEY (id),
  CONSTRAINT provinces_region_id_fk FOREIGN KEY (region_id)
    REFERENCES public.regions(id)
);

-- FIX 1: region_id is nullable again.
-- For regular municipalities/cities: province_id is set,
-- region_id is NULL (derived via province → region join).
-- For HUCs / independent component cities (Manila, Davao, etc):
-- province_id is NULL, region_id is set directly.
-- Your CSV only needs ONE of the two populated per row.
-- The CHECK constraint enforces at least one is present.
CREATE TABLE public.municities (
  id          integer                   NOT NULL,
  name        varchar(100)              NOT NULL,
  geo_json    geometry(Geometry, 4326),
  province_id integer,
  -- FIX 1: nullable — do not require this for province-linked rows
  region_id   integer,
  -- FIX 2: lowercase only — normalize in your seed script before insert
  -- do: row['type'] = row['type'].strip().lower()
  type        varchar(20)               NOT NULL
    CHECK (type IN ('city', 'municipality')),
  CONSTRAINT municities_pk             PRIMARY KEY (id),
  CONSTRAINT municities_province_id_fk FOREIGN KEY (province_id)
    REFERENCES public.provinces(id),
  CONSTRAINT municities_region_id_fk   FOREIGN KEY (region_id)
    REFERENCES public.regions(id),
  -- must have at least one of province or region
  CONSTRAINT municities_needs_location CHECK (
    province_id IS NOT NULL OR region_id IS NOT NULL
  )
);

CREATE TABLE public.places (
  id          uuid             NOT NULL DEFAULT gen_random_uuid(),
  municity_id integer          NOT NULL,
  osm_id      varchar(50)      UNIQUE,
  name        varchar(200)     NOT NULL,
  category    varchar(100),
  lat         double precision,
  lng         double precision,
  description text,
  CONSTRAINT places_pk             PRIMARY KEY (id),
  CONSTRAINT places_municity_id_fk FOREIGN KEY (municity_id)
    REFERENCES public.municities(id)
);

CREATE TABLE public.tags (
  id   integer     NOT NULL GENERATED ALWAYS AS IDENTITY,
  name varchar(50) NOT NULL UNIQUE,
  CONSTRAINT tags_pk PRIMARY KEY (id)
);

CREATE TABLE public.place_tags (
  place_id uuid    NOT NULL,
  tag_id   integer NOT NULL,
  CONSTRAINT place_tags_pk          PRIMARY KEY (place_id, tag_id),
  CONSTRAINT place_tags_place_id_fk FOREIGN KEY (place_id)
    REFERENCES public.places(id) ON DELETE CASCADE,
  CONSTRAINT place_tags_tag_id_fk   FOREIGN KEY (tag_id)
    REFERENCES public.tags(id)   ON DELETE CASCADE
);


-- ============================================================
-- Users
-- ============================================================

CREATE TABLE public.users (
  id         uuid NOT NULL,
  username   varchar(50),
  avatar_url text,
  map_color  text NOT NULL DEFAULT '#ec4899',
  CONSTRAINT users_pk    PRIMARY KEY (id),
  CONSTRAINT users_id_fk FOREIGN KEY (id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);


-- ============================================================
-- Visited places — heatmap source of truth
-- ============================================================

CREATE TABLE public.visited_places (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  place_id   uuid NOT NULL,
  visited_at date NOT NULL DEFAULT current_date,
  CONSTRAINT visited_places_pk          PRIMARY KEY (id),
  CONSTRAINT visited_places_user_id_fk  FOREIGN KEY (user_id)
    REFERENCES public.users(id)  ON DELETE CASCADE,
  CONSTRAINT visited_places_place_id_fk FOREIGN KEY (place_id)
    REFERENCES public.places(id) ON DELETE CASCADE,
  CONSTRAINT visited_places_unique UNIQUE (user_id, place_id)
);


-- ============================================================
-- Journal entries + photos
-- ============================================================

CREATE TABLE public.journal_entries (
  id         uuid         NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid         NOT NULL,
  place_id   uuid         NOT NULL,
  title      varchar(200),
  content    text,
  visit_date date,
  created_at timestamp    NOT NULL DEFAULT now(),
  updated_at timestamp    NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pk          PRIMARY KEY (id),
  CONSTRAINT journal_entries_user_id_fk  FOREIGN KEY (user_id)
    REFERENCES public.users(id)  ON DELETE CASCADE,
  CONSTRAINT journal_entries_place_id_fk FOREIGN KEY (place_id)
    REFERENCES public.places(id) ON DELETE CASCADE
);

CREATE TABLE public.journal_photos (
  id            uuid    NOT NULL DEFAULT gen_random_uuid(),
  journal_id    uuid    NOT NULL,
  storage_url   text    NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  CONSTRAINT journal_photos_pk            PRIMARY KEY (id),
  CONSTRAINT journal_photos_journal_id_fk FOREIGN KEY (journal_id)
    REFERENCES public.journal_entries(id) ON DELETE CASCADE
);


-- ============================================================
-- User place goals — bucket list / wishlist
-- ============================================================

CREATE TABLE public.user_place_goals (
  id         uuid      NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid      NOT NULL,
  place_id   uuid      NOT NULL,
  added_at   timestamp NOT NULL DEFAULT now(),
  is_visited boolean   NOT NULL DEFAULT false,
  visited_at timestamp,
  CONSTRAINT user_place_goals_pk          PRIMARY KEY (id),
  CONSTRAINT user_place_goals_user_id_fk  FOREIGN KEY (user_id)
    REFERENCES public.users(id)  ON DELETE CASCADE,
  CONSTRAINT user_place_goals_place_id_fk FOREIGN KEY (place_id)
    REFERENCES public.places(id) ON DELETE CASCADE,
  CONSTRAINT user_place_goals_unique UNIQUE (user_id, place_id),
  CONSTRAINT user_place_goals_visited_check CHECK (
    (is_visited = false AND visited_at IS NULL) OR
    (is_visited = true  AND visited_at IS NOT NULL)
  )
);


-- ============================================================
-- Triggers
-- ============================================================

-- auto-set visited_at when is_visited flips to true
-- and user did not supply their own date
CREATE OR REPLACE FUNCTION set_visited_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_visited = true
    AND OLD.is_visited = false
    AND NEW.visited_at IS NULL
  THEN
    NEW.visited_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_visited_at
BEFORE UPDATE ON public.user_place_goals
FOR EACH ROW EXECUTE FUNCTION set_visited_at();


-- auto-update updated_at via moddatetime extension
CREATE TRIGGER trg_journal_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);


-- FIX 3: one-way sync only (goals → heatmap)
-- when a goal is marked visited, auto-insert into visited_places
-- the reverse trigger (heatmap → goals) is removed to prevent
-- infinite loop: visited_places insert → goals update →
-- visited_places insert again → loop
-- if user logs a place directly to heatmap via the app,
-- handle the goals sync in application code instead
CREATE OR REPLACE FUNCTION sync_goal_to_heatmap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_visited = true
    AND (TG_OP = 'INSERT' OR OLD.is_visited = false)
  THEN
    INSERT INTO public.visited_places (user_id, place_id, visited_at)
    VALUES (
      NEW.user_id,
      NEW.place_id,
      COALESCE(NEW.visited_at::date, current_date)
    )
    ON CONFLICT (user_id, place_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_goal_to_heatmap
AFTER INSERT OR UPDATE ON public.user_place_goals
FOR EACH ROW EXECUTE FUNCTION sync_goal_to_heatmap();


-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_provinces_region    ON public.provinces(region_id);
CREATE INDEX idx_municities_province ON public.municities(province_id);
CREATE INDEX idx_municities_region   ON public.municities(region_id);
CREATE INDEX idx_places_municity     ON public.places(municity_id);

CREATE INDEX idx_provinces_geo       ON public.provinces  USING GIST(geo_json);
CREATE INDEX idx_municities_geo      ON public.municities USING GIST(geo_json);

CREATE INDEX idx_visited_user        ON public.visited_places(user_id);
CREATE INDEX idx_visited_place       ON public.visited_places(place_id);
CREATE INDEX idx_journal_user        ON public.journal_entries(user_id);
CREATE INDEX idx_journal_place       ON public.journal_entries(place_id);
CREATE INDEX idx_goals_user          ON public.user_place_goals(user_id);
CREATE INDEX idx_goals_place         ON public.user_place_goals(place_id);
CREATE INDEX idx_photos_journal      ON public.journal_photos(journal_id);


-- ============================================================
-- Row Level Security
-- ============================================================

-- user data tables
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_places     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_photos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_place_goals   ENABLE ROW LEVEL SECURITY;

-- reference tables — RLS on so seeder policies apply
ALTER TABLE public.regions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_tags ENABLE ROW LEVEL SECURITY;


-- reference tables: public read, seeder write
-- (remove insert policies after seeding if you want read-only)
CREATE POLICY "regions_public_read"
  ON public.regions FOR SELECT USING (true);
CREATE POLICY "regions_seeder_insert"
  ON public.regions FOR INSERT WITH CHECK (true);

CREATE POLICY "provinces_public_read"
  ON public.provinces FOR SELECT USING (true);
CREATE POLICY "provinces_seeder_insert"
  ON public.provinces FOR INSERT WITH CHECK (true);

CREATE POLICY "municities_public_read"
  ON public.municities FOR SELECT USING (true);
CREATE POLICY "municities_seeder_insert"
  ON public.municities FOR INSERT WITH CHECK (true);

CREATE POLICY "places_public_read"
  ON public.places FOR SELECT USING (true);
CREATE POLICY "places_authenticated_insert"
  ON public.places FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tags_public_read"
  ON public.tags FOR SELECT USING (true);

CREATE POLICY "place_tags_public_read"
  ON public.place_tags FOR SELECT USING (true);


-- users
CREATE POLICY "users_select_own"
  ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE USING (auth.uid() = id);


-- visited_places
CREATE POLICY "visited_select_own"
  ON public.visited_places FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "visited_insert_own"
  ON public.visited_places FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "visited_update_own"
  ON public.visited_places FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "visited_delete_own"
  ON public.visited_places FOR DELETE USING (auth.uid() = user_id);


-- journal_entries
CREATE POLICY "journal_select_own"
  ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "journal_insert_own"
  ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_update_own"
  ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "journal_delete_own"
  ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);


-- journal_photos (access via parent journal ownership)
CREATE POLICY "photos_select_own"
  ON public.journal_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_id AND je.user_id = auth.uid()
    )
  );
CREATE POLICY "photos_insert_own"
  ON public.journal_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_id AND je.user_id = auth.uid()
    )
  );
CREATE POLICY "photos_delete_own"
  ON public.journal_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.journal_entries je
      WHERE je.id = journal_id AND je.user_id = auth.uid()
    )
  );


-- user_place_goals
CREATE POLICY "goals_select_own"
  ON public.user_place_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own"
  ON public.user_place_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own"
  ON public.user_place_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own"
  ON public.user_place_goals FOR DELETE USING (auth.uid() = user_id);