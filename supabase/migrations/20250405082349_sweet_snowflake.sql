/*
  # Adjust saved verses table for batch saving

  1. Changes
    - Remove unique constraint on user_id and reference
    - Add new indexes for efficient querying
    - Update RLS policies to handle batch operations

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control for batch operations
*/

-- Drop the existing unique constraint
ALTER TABLE saved_verses_new
DROP CONSTRAINT IF EXISTS saved_verses_new_user_id_reference_key;

-- Create new indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_verses_new_user_reference ON saved_verses_new(user_id, reference);
CREATE INDEX IF NOT EXISTS idx_saved_verses_new_book_chapter ON saved_verses_new(book, chapter);

-- Update RLS policies to handle batch operations
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_select_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_insert_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_update_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_delete_own_verses" ON saved_verses_new;

-- Create new policies
CREATE POLICY "allow_select_own_verses"
ON saved_verses_new
FOR SELECT
TO public
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "allow_insert_own_verses"
ON saved_verses_new
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "allow_update_own_verses"
ON saved_verses_new
FOR UPDATE
TO public
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);

CREATE POLICY "allow_delete_own_verses"
ON saved_verses_new
FOR DELETE
TO public
USING (
  auth.uid() IS NOT NULL AND
  user_id = auth.uid()
);