/*
  # Update saved verses RLS policy

  1. Changes
    - Update the RLS policy for the saved_verses_new table to allow format version updates
    - Ensures users can only update their own verses
    - Explicitly allows updating format_version during migrations

  2. Security
    - Maintains user data isolation
    - Only allows users to update their own verses
    - Preserves existing security constraints
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Users can update their own saved verses" ON saved_verses_new;

-- Create updated policy that explicitly allows format_version updates
CREATE POLICY "Users can update their own saved verses"
ON saved_verses_new
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can read their own saved verses" ON saved_verses_new;

-- Recreate select policy
CREATE POLICY "Users can read their own saved verses"
ON saved_verses_new
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can create saved verses" ON saved_verses_new;

-- Recreate insert policy
CREATE POLICY "Users can create saved verses"
ON saved_verses_new
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own saved verses" ON saved_verses_new;

-- Recreate delete policy
CREATE POLICY "Users can delete their own saved verses"
ON saved_verses_new
FOR DELETE
TO authenticated
USING (user_id = auth.uid());