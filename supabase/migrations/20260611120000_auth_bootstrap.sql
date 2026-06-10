-- Auto-create public.users row when auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
BEGIN
  base_username := split_part(NEW.email, '@', 1);
  INSERT INTO public.users (id, username, map_color)
  VALUES (NEW.id, base_username, '#c0622f')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Journal photo storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-images',
  'journal-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "journal_images_public_read" ON storage.objects;
CREATE POLICY "journal_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'journal-images');

DROP POLICY IF EXISTS "journal_images_auth_upload" ON storage.objects;
CREATE POLICY "journal_images_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "journal_images_auth_update" ON storage.objects;
CREATE POLICY "journal_images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'journal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "journal_images_auth_delete" ON storage.objects;
CREATE POLICY "journal_images_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
