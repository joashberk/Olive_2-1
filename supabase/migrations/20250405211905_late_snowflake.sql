/*
  # Update saved verses table and policies

  1. Changes
    - Drop existing constraint if it exists
    - Add unique constraint for user_id + reference
    - Add indexes for efficient querying
    - Update RLS policies

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing constraint if it exists
ALTER TABLE saved_verses_new
DROP CONSTRAINT IF EXISTS saved_verses_new_user_reference_unique;

-- Add unique constraint with a new name
ALTER TABLE saved_verses_new
ADD CONSTRAINT saved_verses_new_user_ref_unique UNIQUE (user_id, reference);

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_saved_verses_new_user_reference;
DROP INDEX IF EXISTS idx_saved_verses_new_book_chapter;
DROP INDEX IF EXISTS idx_saved_verses_new_theme_id;

-- Add indexes for efficient querying
CREATE INDEX idx_saved_verses_new_user_reference ON saved_verses_new(user_id, reference);
CREATE INDEX idx_saved_verses_new_book_chapter ON saved_verses_new(book, chapter);
CREATE INDEX idx_saved_verses_new_theme_id ON saved_verses_new(theme_id);

-- Enable RLS
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can update their own verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can delete their own verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can view their own verses" ON saved_verses_new;

-- Create policies for authenticated users
CREATE POLICY "Users can insert their own verses"
ON saved_verses_new
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can view their own verses"
ON saved_verses_new
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);