/*
  # Fix verse saving functionality

  1. Changes
    - Add unique constraint for user_id + reference combination
    - Update indexes for efficient querying
    - Update RLS policies to handle duplicates properly

  2. Security
    - Maintain user data isolation
    - Allow users to manage their own verses
*/

-- First, remove any duplicate verses
WITH duplicates AS (
  SELECT DISTINCT ON (user_id, reference) id
  FROM saved_verses_new
  ORDER BY user_id, reference, created_at DESC
)
DELETE FROM saved_verses_new
WHERE id NOT IN (SELECT id FROM duplicates);

-- Add unique constraint
ALTER TABLE saved_verses_new
ADD CONSTRAINT saved_verses_new_user_reference_unique UNIQUE (user_id, reference);

-- Update indexes
DROP INDEX IF EXISTS idx_saved_verses_new_user_reference;
CREATE UNIQUE INDEX idx_saved_verses_new_user_reference ON saved_verses_new(user_id, reference);

-- Update RLS policies
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "allow_select_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_insert_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_update_own_verses" ON saved_verses_new;
DROP POLICY IF EXISTS "allow_delete_own_verses" ON saved_verses_new;

-- Create new policies with proper checks
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