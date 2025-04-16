/*
  # Add feedback policies

  1. Changes
    - Add RLS policies for feedback table to allow:
      - Authenticated users to insert feedback
      - Anonymous users to insert feedback
    - Add storage policies for feedback bucket to allow:
      - Authenticated users to upload screenshots
      - Anonymous users to upload screenshots

  2. Security
    - Enable RLS on feedback table
    - Add policies for feedback table
    - Add policies for feedback storage bucket
*/

-- Enable RLS on feedback table if not already enabled
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anonymous users to insert feedback" ON feedback;

-- Add policies for feedback table
CREATE POLICY "Allow authenticated users to insert feedback"
ON feedback
FOR INSERT
TO authenticated
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
    ELSE true
  END
);

CREATE POLICY "Allow anonymous users to insert feedback"
ON feedback
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Add storage policies for feedback bucket
BEGIN;
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Allow authenticated users to upload screenshots" ON storage.objects;
  DROP POLICY IF EXISTS "Allow anonymous users to upload screenshots" ON storage.objects;

  -- Add policies for feedback bucket
  CREATE POLICY "Allow authenticated users to upload screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'feedback' AND
    (auth.uid() IS NOT NULL)
  );

  CREATE POLICY "Allow anonymous users to upload screenshots"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'feedback'
  );
COMMIT;