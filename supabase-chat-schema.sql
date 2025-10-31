-- Admin Chat Feature Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  encryption_iv TEXT, -- Initialization vector for file decryption
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_pinned ON chat_rooms(is_pinned);

-- 4. Enable Row Level Security
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies - Only admins can access
-- Note: You need to ensure user_metadata->is_admin is set to true for admin users

-- Policy for chat_rooms: Only admins can read
CREATE POLICY "Admins can view chat rooms" ON chat_rooms
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_rooms: Only admins can insert
CREATE POLICY "Admins can create chat rooms" ON chat_rooms
  FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_rooms: Only admins can update
CREATE POLICY "Admins can update chat rooms" ON chat_rooms
  FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_rooms: Only admins can delete
CREATE POLICY "Admins can delete chat rooms" ON chat_rooms
  FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_messages: Only admins can read
CREATE POLICY "Admins can view messages" ON chat_messages
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_messages: Only admins can insert
CREATE POLICY "Admins can send messages" ON chat_messages
  FOR INSERT
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- Policy for chat_messages: Only admins can delete
CREATE POLICY "Admins can delete messages" ON chat_messages
  FOR DELETE
  USING ((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- 6. Create the default pinned chat room
INSERT INTO chat_rooms (name, is_pinned)
VALUES ('General Chat', TRUE)
ON CONFLICT DO NOTHING;

-- 7. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_room_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_rooms
  SET updated_at = NOW()
  WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to update room's updated_at when a message is added
CREATE TRIGGER update_room_timestamp
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_room_updated_at();

-- 9. Create storage bucket for encrypted chat files (run this in Supabase Dashboard -> Storage)
-- Name: 'chat-files'
-- Make it private (not public)
-- You'll need to create this bucket manually in the Supabase dashboard

-- 10. Storage policies for chat-files bucket (run after creating the bucket)
-- These need to be added in the Storage settings for the 'chat-files' bucket

-- Example SQL for storage policies (adapt to your Supabase storage policies):
-- Only admins can upload
CREATE POLICY "Admins can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Only admins can view/download
CREATE POLICY "Admins can download chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- Only admins can delete
CREATE POLICY "Admins can delete chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-files'
  AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);
