/*
  # Create saved verses table

  1. New Tables
    - `user_saved_verses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `reference` (text)
      - `text` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_saved_verses` table
    - Add policies for authenticated users to:
      - Read their own saved verses
      - Create new saved verses
      - Delete their own saved verses
*/

CREATE TABLE IF NOT EXISTS user_saved_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  reference text NOT NULL,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_saved_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own saved verses"
  ON user_saved_verses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved verses"
  ON user_saved_verses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved verses"
  ON user_saved_verses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);