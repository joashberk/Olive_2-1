/*
  # Add themes for saved verses

  1. New Tables
    - `themes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `theme_id` to saved_verses_new table
    - Add foreign key constraint
    - Update RLS policies

  3. Security
    - Enable RLS on themes table
    - Add policies for authenticated users to:
      - Create their own themes
      - Read their own themes
      - Update their own themes
      - Delete their own themes
*/

-- Create themes table
CREATE TABLE themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add theme_id to saved_verses_new
ALTER TABLE saved_verses_new
ADD COLUMN theme_id uuid REFERENCES themes(id);

-- Create updated_at trigger for themes
CREATE TRIGGER update_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on themes
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Create policies for themes
CREATE POLICY "Users can create their own themes"
  ON themes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own themes"
  ON themes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes"
  ON themes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes"
  ON themes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_themes_user_id ON themes(user_id);
CREATE INDEX idx_saved_verses_new_theme_id ON saved_verses_new(theme_id);