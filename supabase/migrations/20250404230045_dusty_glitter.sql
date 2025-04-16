/*
  # Simplify feedback categories

  1. Changes
    - Update feedback type constraint to use simpler categories
    - Maintain existing screenshot functionality
*/

-- Update feedback table type constraint
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_type_check;

ALTER TABLE feedback 
ADD CONSTRAINT feedback_type_check CHECK (
  type IN ('bug', 'feature', 'other')
);