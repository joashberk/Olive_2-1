/*
  # Update saved verses RLS policies

  1. Security Changes
    - Enable RLS on saved_verses_new table
    - Add policies for authenticated users to:
      - Insert their own verses
      - Update their own verses
      - Delete their own verses
      - Select their own verses
*/

-- Enable RLS
ALTER TABLE saved_verses_new ENABLE ROW LEVEL SECURITY;

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