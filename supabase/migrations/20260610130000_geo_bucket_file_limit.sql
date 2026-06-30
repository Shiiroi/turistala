-- Increases file upload limits on the 'geo' bucket to accommodate large provincial datasets.
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'geo';
