-- Migration number: 0002 	 2025-08-06T15:00:00.000Z
-- Add file upload support to comments table
ALTER TABLE comments ADD COLUMN file_url TEXT;
ALTER TABLE comments ADD COLUMN file_name TEXT;
ALTER TABLE comments ADD COLUMN file_size INTEGER;
ALTER TABLE comments ADD COLUMN file_type TEXT;
ALTER TABLE comments ADD COLUMN created_at TEXT;
