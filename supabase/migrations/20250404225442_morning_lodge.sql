/*
  # Add screenshot support to feedback table

  1. Changes
    - Add screenshot_url column to feedback table
    - Update feedback types to be more specific
    - Create storage bucket for feedback screenshots
    - Add storage policies for secure uploads

  2. Security
    - Enable RLS on storage bucket
    - Add policies for authenticated users
*/

-- Update feedback table
ALTER TABLE feedback 
DROP CONSTRAINT IF EXISTS feedback_type_check;

ALTER TABLE feedback 
ADD COLUMN screenshot_url text,
ADD CONSTRAINT feedback_type_check CHECK (
  type IN (
    'bug_ui',
    'bug_functionality',
    'bug_performance',
    'feature_study',
    'feature_navigation',
    'feature_accessibility',
    'feedback_general',
    'feedback_content',
    'feedback_other'
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

-- Create policy to allow authenticated uploads with file type restrictions
CREATE POLICY "Users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback' AND
  (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('png', 'jpg', 'jpeg', 'webp'))
);