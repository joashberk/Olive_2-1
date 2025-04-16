/*
  # Add page_name to feedback table

  1. Changes
    - Add page_name column to feedback table
    - Make it nullable since it's optional
*/

ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS page_name text;