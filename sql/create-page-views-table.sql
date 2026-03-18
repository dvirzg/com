-- Create page_views table for tracking page visits and session analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,

  -- Timing
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  time_on_page_ms INTEGER, -- milliseconds spent on page

  -- Navigation context
  referrer TEXT, -- external referrer (for entry pages)
  previous_page TEXT, -- internal previous page path

  -- Visitor information (captured server-side)
  ip_address TEXT,
  user_agent TEXT,
  accept_language TEXT,

  -- Geo data (from Vercel headers)
  country TEXT,
  country_region TEXT,
  city TEXT,

  -- Parsed user agent
  device_type TEXT,
  browser TEXT,
  os TEXT,

  -- Session metadata
  is_entry_page BOOLEAN DEFAULT false,
  is_exit_page BOOLEAN DEFAULT false
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_entered_at ON page_views(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_session_time ON page_views(session_id, entered_at);

-- RLS policies
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (for tracking)
CREATE POLICY "Allow anonymous inserts" ON page_views
  FOR INSERT
  WITH CHECK (true);

-- Anyone can update (for exit time updates)
CREATE POLICY "Allow anonymous updates" ON page_views
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Admins can view all" ON page_views
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can delete
CREATE POLICY "Admins can delete" ON page_views
  FOR DELETE
  USING (auth.role() = 'authenticated');
