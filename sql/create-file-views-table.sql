-- Create file_views table for tracking file/link visits
CREATE TABLE IF NOT EXISTS file_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Visitor information (no permissions required)
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,
  accept_language TEXT,

  -- Geo data (provided by Vercel)
  country TEXT,
  country_region TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Parsed user agent info (for easier querying)
  device_type TEXT, -- 'desktop', 'mobile', 'tablet', 'bot'
  browser TEXT,
  os TEXT,

  -- Request metadata
  file_path TEXT,
  response_status INTEGER DEFAULT 200
);

-- Create index for efficient querying by slug
CREATE INDEX IF NOT EXISTS idx_file_views_slug ON file_views(slug);

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_file_views_viewed_at ON file_views(viewed_at DESC);

-- Create composite index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_file_views_slug_time ON file_views(slug, viewed_at DESC);

-- RLS policies
ALTER TABLE file_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking)
CREATE POLICY "Allow anonymous inserts" ON file_views
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins can read
CREATE POLICY "Admins can view all" ON file_views
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated admins can delete (for cleanup)
CREATE POLICY "Admins can delete" ON file_views
  FOR DELETE
  USING (auth.role() = 'authenticated');
