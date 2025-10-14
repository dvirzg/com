-- Add publishing timestamp fields to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set published_at for existing published notes to their created_at date
UPDATE notes
SET published_at = created_at
WHERE published = true AND published_at IS NULL;

-- Set updated_at for existing notes to their created_at date
UPDATE notes
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Create a trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
