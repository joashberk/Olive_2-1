/*
  # Add tags and enhance themes for saved verses

  1. New Tables
    - `verse_tags`
      - `id` (uuid, primary key)
      - `theme_id` (uuid, references themes)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `description` to themes table
    - Add `order` column to saved_verses_new for drag-and-drop support
    - Add verse_tags_verses junction table for many-to-many relationships

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for authenticated users
*/

-- Add description to themes
ALTER TABLE themes
ADD COLUMN description text;

-- Add order to saved_verses_new
ALTER TABLE saved_verses_new
ADD COLUMN "order" integer DEFAULT 0;

-- Create verse_tags table
CREATE TABLE verse_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id uuid REFERENCES themes(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(theme_id, name)
);

-- Create verse_tags_verses junction table
CREATE TABLE verse_tags_verses (
  verse_id uuid REFERENCES saved_verses_new(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES verse_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (verse_id, tag_id)
);

-- Enable RLS
ALTER TABLE verse_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE verse_tags_verses ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for verse_tags
CREATE TRIGGER update_verse_tags_updated_at
  BEFORE UPDATE ON verse_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies for verse_tags
CREATE POLICY "Users can manage tags in their themes"
  ON verse_tags
  USING (
    EXISTS (
      SELECT 1 FROM themes
      WHERE themes.id = verse_tags.theme_id
      AND themes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM themes
      WHERE themes.id = verse_tags.theme_id
      AND themes.user_id = auth.uid()
    )
  );

-- Create policies for verse_tags_verses
CREATE POLICY "Users can manage verse tag assignments"
  ON verse_tags_verses
  USING (
    EXISTS (
      SELECT 1 FROM saved_verses_new
      WHERE saved_verses_new.id = verse_tags_verses.verse_id
      AND saved_verses_new.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_verses_new
      WHERE saved_verses_new.id = verse_tags_verses.verse_id
      AND saved_verses_new.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_verse_tags_theme_id ON verse_tags(theme_id);
CREATE INDEX idx_verse_tags_verses_verse_id ON verse_tags_verses(verse_id);
CREATE INDEX idx_verse_tags_verses_tag_id ON verse_tags_verses(tag_id);