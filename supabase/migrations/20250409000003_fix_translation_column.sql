/*
  # Fix translation column in user_saved_verses

  1. Changes
    - Drop and recreate translation column with correct constraints
    - Ensure default value is set
    - Add check constraint for valid translations
*/

-- First, backup existing translation values
CREATE TEMP TABLE verse_translations AS
SELECT id, COALESCE(translation, 'web') as translation
FROM user_saved_verses;

-- Drop existing column and constraints if they exist
ALTER TABLE user_saved_verses 
DROP COLUMN IF EXISTS translation CASCADE;

-- Add translation column with correct constraints
ALTER TABLE user_saved_verses 
ADD COLUMN translation text NOT NULL DEFAULT 'web';

-- Drop existing constraint
ALTER TABLE user_saved_verses 
DROP CONSTRAINT IF EXISTS valid_translation;

-- Add updated constraint with 'kjv' included
ALTER TABLE user_saved_verses 
ADD CONSTRAINT valid_translation 
CHECK (translation IN ('asv', 'web', 'kjv'));

-- Restore translation values
UPDATE user_saved_verses
SET translation = vt.translation
FROM verse_translations vt
WHERE user_saved_verses.id = vt.id;

-- Drop temporary table
DROP TABLE verse_translations; 