-- Row Level Security Policies for Notes Table
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on the notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read published notes
CREATE POLICY "Anyone can view published notes"
ON notes
FOR SELECT
USING (published = true);

-- Policy: Only admins can insert notes
CREATE POLICY "Only admins can insert notes"
ON notes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can update notes
CREATE POLICY "Only admins can update notes"
ON notes
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Policy: Only admins can delete notes
CREATE POLICY "Only admins can delete notes"
ON notes
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);

-- Optional: If you want admins to be able to view unpublished notes
CREATE POLICY "Admins can view all notes"
ON notes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (auth.jwt()->>'user_metadata')::jsonb->>'is_admin' = 'true'
);
