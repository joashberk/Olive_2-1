/*
  # Add translation column to user_saved_verses

  1. Changes
    - Add translation column if it doesn't exist
    - Set default value to 'web'
    - Add constraint to ensure valid translations
*/

DO $$ 
BEGIN
  -- Add translation column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_saved_verses' AND column_name = 'translation'
  ) THEN
    ALTER TABLE user_saved_verses ADD COLUMN translation text NOT NULL DEFAULT 'web';
    
    -- Add constraint to ensure valid translations
    ALTER TABLE user_saved_verses 
    ADD CONSTRAINT valid_translation 
    CHECK (translation IN ('asv', 'web'));
  END IF;
END $$; 