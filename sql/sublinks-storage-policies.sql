-- Storage policies for sublinks bucket
-- Run this in your Supabase SQL Editor after creating the 'sublinks' storage bucket

-- Note: Make sure the 'sublinks' storage bucket exists first
-- You can create it in the Supabase dashboard: Storage > Create new bucket

-- Policy: Allow public read access to files (for serving files via sublinks)
CREATE POLICY "Anyone can view sublink files"
ON storage.objects FOR SELECT
USING (bucket_id = 'sublinks');

-- Policy: Only admins can upload files to sublinks bucket
CREATE POLICY "Only admins can upload to sublinks"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sublinks'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can update files in sublinks bucket
CREATE POLICY "Only admins can update sublinks files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sublinks'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
)
WITH CHECK (
  bucket_id = 'sublinks'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can delete files from sublinks bucket
CREATE POLICY "Only admins can delete from sublinks"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sublinks'
  AND auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Make sure the bucket is set to public (for read access)
-- UPDATE storage.buckets SET public = true WHERE id = 'sublinks';
