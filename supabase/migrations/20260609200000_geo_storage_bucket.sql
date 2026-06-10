-- Public bucket for map GeoJSON layers (regions, provinces, …)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'geo',
  'geo',
  true,
  52428800,
  ARRAY['application/json', 'application/geo+json']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for map tiles / geojson assets
CREATE POLICY "geo_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'geo');
