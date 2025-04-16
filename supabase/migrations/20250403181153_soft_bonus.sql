/*
  # Add UPDATE policy for saved verses

  1. Changes
    - Add UPDATE policy to saved_verses_new table to allow users to update their own verses
    
  2. Security
    - Users can only update verses where they are the owner (user_id matches auth.uid())
*/

CREATE POLICY "Users can update their own saved verses"
  ON saved_verses_new
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());