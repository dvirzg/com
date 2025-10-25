-- Site Settings Table
-- Run this command in your Supabase SQL Editor to create the site_settings table

-- Create the site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  font_family TEXT NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),

  -- Ensure only one row exists
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings
INSERT INTO site_settings (id, font_family)
VALUES (1, 'system')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the site_settings table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read site settings
CREATE POLICY "Anyone can view site settings"
ON site_settings
FOR SELECT
USING (true);

-- Policy: Only admins can update site settings
CREATE POLICY "Only admins can update site settings"
ON site_settings
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
CREATE TRIGGER site_settings_updated_at
BEFORE UPDATE ON site_settings
FOR EACH ROW
EXECUTE FUNCTION update_site_settings_updated_at();
