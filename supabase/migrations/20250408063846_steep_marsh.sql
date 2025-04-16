/*
  # Update user_saved_verses table schema

  1. Changes
    - Drop existing table
    - Recreate with updated schema
    - Add proper constraints and indexes
    - Set up RLS policies
*/

-- Drop existing table
DROP TABLE IF EXISTS user_saved_verses CASCADE;

-- Create table with new schema
CREATE TABLE user_saved_verses (
  -- Core fields
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Reference data
  book_name text NOT NULL,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  verse_selections jsonb NOT NULL,
  verse_text text NOT NULL,
  display_reference text NOT NULL,
  
  -- Metadata
  is_composite boolean DEFAULT false,
  themes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  click_count integer DEFAULT 0,
  last_accessed timestamptz,
  
  -- Constraints
  CONSTRAINT valid_verse_selections CHECK (jsonb_array_length(verse_selections) > 0),
  CONSTRAINT valid_themes CHECK (array_length(themes, 1) IS NULL OR array_length(themes, 1) <= 50)
);

-- Create indexes
CREATE INDEX idx_user_saved_verses_user_id ON user_saved_verses(user_id);
CREATE INDEX idx_user_saved_verses_book_chapter ON user_saved_verses(book_name, chapter_number);
CREATE INDEX idx_user_saved_verses_themes ON user_saved_verses USING gin(themes);
CREATE INDEX idx_user_saved_verses_last_accessed ON user_saved_verses(last_accessed);

-- Enable RLS
ALTER TABLE user_saved_verses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved verses"
  ON user_saved_verses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved verses"
  ON user_saved_verses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved verses"
  ON user_saved_verses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved verses"
  ON user_saved_verses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update last_accessed and click_count
CREATE OR REPLACE FUNCTION update_verse_access()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed = now();
  NEW.click_count = COALESCE(OLD.click_count, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for verse access tracking
CREATE TRIGGER verse_accessed
  BEFORE UPDATE ON user_saved_verses
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_verse_access();

-- Create function to validate verse selections
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

-- Create trigger for verse selection validation
CREATE TRIGGER validate_verse_selections_trigger
  BEFORE INSERT OR UPDATE ON user_saved_verses
  FOR EACH ROW
  EXECUTE FUNCTION validate_verse_selections();