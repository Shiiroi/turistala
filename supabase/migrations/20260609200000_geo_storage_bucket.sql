-- Provisions public storage bucket for CDN-style GeoJSON map layers.
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
DROP POLICY IF EXISTS "geo_public_read" ON storage.objects;
CREATE POLICY "geo_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'geo');
