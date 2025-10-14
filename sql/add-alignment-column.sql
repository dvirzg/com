-- Add alignment column to notes table
-- Run this in your Supabase SQL Editor

ALTER TABLE notes
ADD COLUMN IF NOT EXISTS alignment TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN notes.alignment IS 'JSON array storing text alignment for each block (left/center/right)';
