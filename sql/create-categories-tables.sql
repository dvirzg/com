-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for note-category relationships (many-to-many)
CREATE TABLE IF NOT EXISTS note_categories (
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (note_id, category_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
-- Anyone can view categories
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert categories
CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (admins) can delete categories
CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS Policies for note_categories
-- Anyone can view note-category relationships
CREATE POLICY "Note categories are viewable by everyone"
  ON note_categories FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert note-category relationships
CREATE POLICY "Authenticated users can insert note categories"
  ON note_categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (admins) can delete note-category relationships
CREATE POLICY "Authenticated users can delete note categories"
  ON note_categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_note_categories_note_id ON note_categories(note_id);
CREATE INDEX IF NOT EXISTS idx_note_categories_category_id ON note_categories(category_id);
