/*
  # Add notebooks for note organization

  1. New Tables
    - `notebooks`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Add `notebook_id` to notes table
    - Add foreign key constraint
    - Update RLS policies

  3. Security
    - Enable RLS on notebooks table
    - Add policies for authenticated users to:
      - Create their own notebooks
      - Read their own notebooks
      - Update their own notebooks
      - Delete their own notebooks
*/

-- Create notebooks table
CREATE TABLE notebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add notebook_id to notes
ALTER TABLE notes
ADD COLUMN notebook_id uuid REFERENCES notebooks(id);

-- Create updated_at trigger for notebooks
CREATE TRIGGER update_notebooks_updated_at
  BEFORE UPDATE ON notebooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on notebooks
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

-- Create policies for notebooks
CREATE POLICY "Users can create their own notebooks"
  ON notebooks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notebooks"
  ON notebooks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notebooks"
  ON notebooks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notebooks"
  ON notebooks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_notebooks_user_id ON notebooks(user_id);
CREATE INDEX idx_notes_notebook_id ON notes(notebook_id);