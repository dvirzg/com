-- Create sublinks table with proper structure
-- Run this in your Supabase SQL Editor

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS sublinks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'url' CHECK (type IN ('url', 'file')),
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create an index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_sublinks_slug ON sublinks(slug);

-- Enable Row Level Security
ALTER TABLE sublinks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read sublinks (for redirect functionality)
CREATE POLICY "Anyone can view sublinks"
ON sublinks
FOR SELECT
USING (true);

-- Policy: Only admins can insert sublinks
CREATE POLICY "Only admins can insert sublinks"
ON sublinks
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can update sublinks
CREATE POLICY "Only admins can update sublinks"
ON sublinks
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can delete sublinks
CREATE POLICY "Only admins can delete sublinks"
ON sublinks
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_sublinks_updated_at ON sublinks;
CREATE TRIGGER update_sublinks_updated_at
  BEFORE UPDATE ON sublinks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
