/*
  # Rebuild saved verses table with enhanced features

  1. New Table Structure
    - `saved_verses_new`
      - Core fields: id, user_id, created_at, updated_at
      - Verse data: book_name, chapter_number, verse_selections, verse_text
      - Display: display_reference, themes, is_composite
      - Analytics: click_count, last_accessed
      
  2. Features
    - JSONB for flexible verse selections
    - Array of themes
    - Access tracking
    - Composite verse support
    
  3. Security
    - RLS policies for user data isolation
    - Proper indexing for performance
    - Data validation constraints
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS saved_verses_new CASCADE;

-- Create new saved_verses_new table
CREATE TABLE saved_verses_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Verse reference data
  book_name TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  verse_selections JSONB NOT NULL, -- Store as [{start: 1, end: 1}, {start: 3, end: 5}]
  verse_text TEXT NOT NULL,
  
  -- Display and organization
  display_reference TEXT NOT NULL, -- Formatted reference (e.g., "Matthew 6:2-4")
  themes TEXT[] DEFAULT '{}', -- Array of theme tags
  is_composite BOOLEAN DEFAULT false,
  
  -- Metadata
  click_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  -- Indexing and constraints
  CONSTRAINT valid_verse_selections CHECK (jsonb_array_length(verse_selections) > 0),
  CONSTRAINT valid_themes CHECK (array_length(themes, 1) IS NULL OR array_length(themes, 1) <= 50)
);

-- Create indexes
CREATE INDEX idx_saved_verses_new_user_id ON saved_verses_new(user_id);
CREATE INDEX idx_saved_verses_new_themes ON saved_verses_new USING GIN(themes);
CREATE INDEX idx_saved_verses_new_book_chapter ON saved_verses_new(book_name, chapter_number);
CREATE INDEX idx_saved_verses_new_verse_selections ON saved_verses_new USING GIN(verse_selections);

-- Enable RLS
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own saved verses"
ON saved_verses_new FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved verses"
ON saved_verses_new FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved verses"
ON saved_verses_new FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved verses"
ON saved_verses_new FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Function to update last_accessed
CREATE OR REPLACE FUNCTION update_verse_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = NOW();
  NEW.click_count = NEW.click_count + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating access timestamp
CREATE TRIGGER verse_accessed
  BEFORE UPDATE ON saved_verses_new
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_verse_access();

-- Function to validate verse selections
CREATE OR REPLACE FUNCTION validate_verse_selections()
RETURNS TRIGGER AS $$
BEGIN
  -- Check that all verse selections have valid start and end values
  IF NOT (
    SELECT bool_and(
      (value->>'start')::int > 0 AND
      ((value->>'end') IS NULL OR (value->>'end')::int >= (value->>'start')::int)
    )
    FROM jsonb_array_elements(NEW.verse_selections)
  ) THEN
    RAISE EXCEPTION 'Invalid verse selection range';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for validating verse selections
CREATE TRIGGER validate_verse_selections_trigger
  BEFORE INSERT OR UPDATE ON saved_verses_new
  FOR EACH ROW
  EXECUTE FUNCTION validate_verse_selections();