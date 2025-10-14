-- Create pages table for custom admin-created pages
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  show_in_nav BOOLEAN DEFAULT true,
  nav_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the About page as the first custom page
INSERT INTO pages (slug, title, content, show_in_nav, nav_order) VALUES (
  'about',
  'About',
  'I''m Dvir, this will have my about me.

It could contain info about my background, my interests, my goals, etc.',
  true,
  1
);

-- RLS Policies
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Everyone can view published pages
CREATE POLICY "Anyone can view pages"
ON pages FOR SELECT
USING (true);

-- Only admins can insert pages
CREATE POLICY "Admins can insert pages"
ON pages FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Only admins can update pages
CREATE POLICY "Admins can update pages"
ON pages FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Only admins can delete pages
CREATE POLICY "Admins can delete pages"
ON pages FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Add comment
COMMENT ON TABLE pages IS 'Stores custom admin-created pages that appear in navigation';
