/*
  # Fix saved verses RLS policies

  1. Changes
    - Drop all existing policies
    - Enable RLS if not already enabled
    - Create new policies with proper permissions for all operations
    - Add public role access for better compatibility

  2. Security
    - Maintain user data isolation
    - Allow users to manage their own verses
    - Support both authenticated and public role access
*/

-- First ensure RLS is enabled
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can update their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can read their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can create saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can delete their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Allow users to delete their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Allow users to read their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Allow users to save verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Allow users to update their own saved verses" ON saved_verses_new;

-- Create new policies with both authenticated and public role access
CREATE POLICY "Allow users to read their own saved verses"
ON saved_verses_new
FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY "Allow users to save verses"
ON saved_verses_new
FOR INSERT
TO public
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own saved verses"
ON saved_verses_new
FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to delete their own saved verses"
ON saved_verses_new
FOR DELETE
TO public
USING (user_id = auth.uid());