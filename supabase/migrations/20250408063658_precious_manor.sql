/*
  # Create user_saved_verses table

  1. New Tables
    - `user_saved_verses`
      - Core fields for verse storage and user association
      - Structured verse selections using JSONB
      - Theme support and metadata
      
  2. Features
    - Validation constraints for verse selections
    - Proper indexing for efficient queries
    - RLS policies for data security
*/

CREATE TABLE user_saved_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_name text NOT NULL,
  chapter_number integer NOT NULL CHECK (chapter_number > 0),
  verse_selections jsonb NOT NULL,
  verse_text text NOT NULL,
  display_reference text NOT NULL,
  is_composite boolean DEFAULT false,
  themes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  
  -- Ensure verse_selections is a non-empty array
  CONSTRAINT valid_verse_selections CHECK (jsonb_array_length(verse_selections) > 0),
  -- Limit number of themes
  CONSTRAINT valid_themes CHECK (array_length(themes, 1) IS NULL OR array_length(themes, 1) <= 50)
);

-- Create indexes for efficient querying
CREATE INDEX idx_user_saved_verses_user_id ON user_saved_verses(user_id);
CREATE INDEX idx_user_saved_verses_book_chapter ON user_saved_verses(book_name, chapter_number);
CREATE INDEX idx_user_saved_verses_themes ON user_saved_verses USING gin(themes);

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

-- Create trigger for verse selection validation
CREATE TRIGGER validate_verse_selections_trigger
  BEFORE INSERT OR UPDATE ON user_saved_verses
  FOR EACH ROW
  EXECUTE FUNCTION validate_verse_selections();