/*
  # Add format version tracking to saved verses

  1. Changes
    - Add format_version column to saved_verses_new table
    - Set default value to null to identify unmigrated verses
    - Add book, chapter, and verse columns for reference data

  2. Security
    - Maintain existing RLS policies
*/

-- Add format_version column
ALTER TABLE saved_verses_new 
ADD COLUMN format_version integer DEFAULT NULL;

-- Add columns for verse reference data
ALTER TABLE saved_verses_new
ADD COLUMN book text,
ADD COLUMN chapter integer,
ADD COLUMN verse integer;