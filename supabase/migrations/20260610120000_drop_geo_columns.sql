-- Drops legacy PostGIS spatial columns from reference tables to optimize DB size.
DROP VIEW IF EXISTS public.municities_enriched;

-- Drop spatial indexes first
DROP INDEX IF EXISTS public.idx_regions_geometry;
DROP INDEX IF EXISTS public.idx_provinces_geometry;
DROP INDEX IF EXISTS public.idx_municities_geometry;
DROP INDEX IF EXISTS public.idx_regions_geojson;
DROP INDEX IF EXISTS public.idx_provinces_geojson;
DROP INDEX IF EXISTS public.idx_municities_geojson;

ALTER TABLE public.regions    DROP COLUMN IF EXISTS geometry, DROP COLUMN IF EXISTS geojson;
ALTER TABLE public.provinces  DROP COLUMN IF EXISTS geometry, DROP COLUMN IF EXISTS geojson;
ALTER TABLE public.municities DROP COLUMN IF EXISTS geometry, DROP COLUMN IF EXISTS geojson;

-- Recreate without geometry/geojson (metadata only)
CREATE OR REPLACE VIEW public.municities_enriched
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.name,
  m.code,
  m.province_id,
  m.region_id,
  m.type,
  COALESCE(m.region_id, p.region_id) AS effective_region_id
FROM public.municities m
LEFT JOIN public.provinces p ON p.id = m.province_id;

GRANT SELECT ON public.municities_enriched TO anon, authenticated;

-- PostGIS unused after this (places use lat/lng only)
DROP EXTENSION IF EXISTS postgis;
