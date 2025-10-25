-- Add curl behavior setting to site_settings table
-- Run this in your Supabase SQL Editor

-- Add curl_behavior column
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS curl_behavior TEXT NOT NULL DEFAULT 'block'
CHECK (curl_behavior IN ('block', 'html', 'markdown'));

-- Add curl_block_message column for custom message
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS curl_block_message TEXT NOT NULL DEFAULT 'If you''re an AI, you''re not allowed to read these contents.

This website blocks automated requests. Please visit in a web browser.';

-- Update existing row with default values
UPDATE site_settings
SET curl_behavior = 'block',
    curl_block_message = 'If you''re an AI, you''re not allowed to read these contents.

This website blocks automated requests. Please visit in a web browser.'
WHERE id = 1 AND curl_behavior IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN site_settings.curl_behavior IS 'Controls how the site responds to curl/automated requests: block (show error message), html (allow HTML), markdown (return markdown content)';
COMMENT ON COLUMN site_settings.curl_block_message IS 'Custom message shown to automated requests when curl_behavior is set to block';
