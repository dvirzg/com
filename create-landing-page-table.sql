-- Create landing_page table
CREATE TABLE IF NOT EXISTS landing_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default content
INSERT INTO landing_page (title, subtitle, content) VALUES (
  'Hi, I''m Dvir',
  'Welcome to my personal website.',
  '## About Me

...

## Let''s Connect

Email me at [dvirzagury@gmail.com](mailto:dvirzagury@gmail.com) or [dzagury@uwaterloo.ca](mailto:dzagury@uwaterloo.ca).

Or connect with me on [LinkedIn](https://www.dvirzg.com/linkedin).'
);

-- RLS Policies
ALTER TABLE landing_page ENABLE ROW LEVEL SECURITY;

-- Everyone can view the landing page
CREATE POLICY "Anyone can view landing page"
ON landing_page FOR SELECT
USING (true);

-- Only admins can update the landing page
CREATE POLICY "Admins can update landing page"
ON landing_page FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Add comment
COMMENT ON TABLE landing_page IS 'Stores the editable content for the landing page';
