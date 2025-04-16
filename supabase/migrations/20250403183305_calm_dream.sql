/*
  # Add verse reference format migration support

  1. Changes
    - Add format_version column to saved_verses_new table
    - Add book, chapter, and verse columns for parsed reference data
    - Update RLS policies to allow format version updates
    - Add indexes for efficient querying

  2. Security
    - Maintain existing RLS policies while allowing migration updates
*/

-- Add format tracking columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_verses_new' AND column_name = 'format_version'
  ) THEN
    ALTER TABLE saved_verses_new ADD COLUMN format_version integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_verses_new' AND column_name = 'book_name'
  ) THEN
    ALTER TABLE saved_verses_new ADD COLUMN book text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_verses_new' AND column_name = 'chapter'
  ) THEN
    ALTER TABLE saved_verses_new ADD COLUMN chapter integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'saved_verses_new' AND column_name = 'verse'
  ) THEN
    ALTER TABLE saved_verses_new ADD COLUMN verse integer;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_verses_new_book_chapter ON saved_verses_new(book, chapter);
CREATE INDEX IF NOT EXISTS idx_saved_verses_new_format_version ON saved_verses_new(format_version);

-- Ensure RLS policies are up to date
DROP POLICY IF EXISTS "Users can update their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can read their own saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can create saved verses" ON saved_verses_new;
DROP POLICY IF EXISTS "Users can delete their own saved verses" ON saved_verses_new;

-- Recreate policies with proper permissions
CREATE POLICY "Users can update their own saved verses"
ON saved_verses_new
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read their own saved verses"
ON saved_verses_new
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create saved verses"
ON saved_verses_new
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved verses"
ON saved_verses_new
FOR DELETE
TO authenticated
USING (user_id = auth.uid());