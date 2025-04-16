/*
  # Rebuild saved_verses_new table

  1. New Structure
    - `id` (uuid, primary key)
    - `user_id` (uuid, references auth.users)
    - `reference` (text) - Full reference (e.g., "John 3:16-18")
    - `book` (text) - Book name
    - `chapter` (integer) - Chapter number
    - `verse_start` (integer) - Starting verse number
    - `verse_end` (integer, nullable) - Ending verse number for ranges
    - `text` (text) - Combined verse text
    - `theme_id` (uuid, references themes)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
    - `order` (integer) - For custom sorting
    - `format_version` (integer) - Schema version

  2. Indexes
    - Primary key on id
    - Index on user_id for fast user lookups
    - Index on theme_id for theme filtering
    - Composite index on (book, chapter) for chapter views
    - Composite index on (user_id, reference) for duplicate checking

  3. Security
    - Enable RLS
    - Policies for authenticated users to:
      - Create their own verses
      - Read their own verses
      - Update their own verses
      - Delete their own verses
*/

-- Drop existing table and related objects
DROP TABLE IF EXISTS saved_verses_new CASCADE;

-- Create new saved_verses_new table
CREATE TABLE saved_verses_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  reference text NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse_start integer NOT NULL,
  verse_end integer,
  text text NOT NULL,
  theme_id uuid REFERENCES themes ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  "order" integer DEFAULT 0,
  format_version integer DEFAULT 1,
  CONSTRAINT verse_range_check CHECK (
    verse_end IS NULL OR verse_end >= verse_start
  )
);

-- Create indexes
CREATE INDEX idx_saved_verses_new_user_id ON saved_verses_new(user_id);
CREATE INDEX idx_saved_verses_new_theme_id ON saved_verses_new(theme_id);
CREATE INDEX idx_saved_verses_new_book_chapter ON saved_verses_new(book, chapter);
CREATE UNIQUE INDEX idx_saved_verses_new_user_reference ON saved_verses_new(user_id, reference);

-- Add updated_at trigger
CREATE TRIGGER update_saved_verses_new_updated_at
  BEFORE UPDATE ON saved_verses_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own verses"
  ON saved_verses_new
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own verses"
  ON saved_verses_new
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own verses"
  ON saved_verses_new
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verses"
  ON saved_verses_new
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);