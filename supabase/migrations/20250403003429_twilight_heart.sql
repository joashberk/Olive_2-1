/*
  # Optimize verse saving functionality with duplicate handling

  1. Changes
    - Remove duplicate verses before adding constraints
    - Add unique constraint for user_id + reference combination
    - Add index for faster lookups
    - Add updated_at column and trigger

  2. Security
    - Maintain existing RLS policies
*/

-- First, create a temporary table to store the latest version of each verse
CREATE TEMP TABLE temp_verses AS
SELECT DISTINCT ON (user_id, reference)
  id,
  user_id,
  reference,
  text,
  created_at
FROM saved_verses_new
ORDER BY user_id, reference, created_at DESC;

-- Delete all verses
DELETE FROM saved_verses_new;

-- Reinsert only the latest version of each verse
INSERT INTO saved_verses_new (id, user_id, reference, text, created_at)
SELECT id, user_id, reference, text, created_at
FROM temp_verses;

-- Drop temporary table
DROP TABLE temp_verses;

-- Now add the unique constraint
ALTER TABLE saved_verses_new
ADD CONSTRAINT saved_verses_new_user_id_reference_key UNIQUE (user_id, reference);

-- Add composite index for faster lookups
CREATE INDEX idx_saved_verses_new_user_reference ON saved_verses_new(user_id, reference);

-- Add updated_at column and trigger
ALTER TABLE saved_verses_new 
ADD COLUMN updated_at timestamptz DEFAULT now();

CREATE TRIGGER update_saved_verses_new_updated_at
  BEFORE UPDATE ON saved_verses_new
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();