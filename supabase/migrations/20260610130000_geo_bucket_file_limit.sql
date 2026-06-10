-- Raise geo bucket file size limit (province-26.json is ~7.6 MB; default can be 5 MB)
UPDATE storage.buckets
SET file_size_limit = 52428800
WHERE id = 'geo';
