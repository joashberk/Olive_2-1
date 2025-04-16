/*
  # Update feedback type constraint and storage configuration

  1. Changes
    - Update feedback type constraint to match new categories
    - Configure storage for screenshots
    - Set up MIME type restrictions
*/

-- Update feedback table type constraint
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_type_check;

ALTER TABLE feedback 
ADD CONSTRAINT feedback_type_check CHECK (
  type IN (
    'bug_ui',
    'bug_functionality',
    'feature_study',
    'feature_navigation',
    'feedback_general',
    'feedback_content'
  )
);

-- Create storage bucket for screenshots if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('feedback', 'feedback', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Create allowed MIME types for the bucket
CREATE TABLE IF NOT EXISTS storage.mime_types (
  mime text PRIMARY KEY,
  ext text
);

INSERT INTO storage.mime_types (mime, ext)
VALUES 
  ('image/png', 'png'),
  ('image/jpeg', 'jpg'),
  ('image/jpeg', 'jpeg'),
  ('image/webp', 'webp')
ON CONFLICT (mime) DO NOTHING;

-- Note: Upload policy is created in a previous migration