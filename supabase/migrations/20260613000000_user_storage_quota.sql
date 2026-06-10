ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS storage_bytes_used bigint NOT NULL DEFAULT 0;

ALTER TABLE public.journal_photos
  ADD COLUMN IF NOT EXISTS byte_size bigint;
