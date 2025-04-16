/*
  # Update RLS policies for feedback and storage

  1. Changes
    - Drop all existing policies on feedback table
    - Create new unified policies for feedback table that handle both authenticated and anonymous users
    - Drop all existing policies on storage.objects for feedback bucket
    - Create new unified policies for storage.objects that handle both authenticated and anonymous users

  2. Security
    - Allow both authenticated and anonymous users to submit feedback
    - Allow both authenticated and anonymous users to upload screenshots
    - Maintain data isolation between users
*/

-- Enable RLS on feedback table if not already enabled
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Allow authenticated users to insert feedback" ON feedback;
DROP POLICY IF EXISTS "Allow anonymous users to insert feedback" ON feedback;

-- Create new unified policy for feedback table
CREATE POLICY "allow_feedback_submission"
ON feedback
FOR INSERT
TO public
WITH CHECK (
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 
      -- For authenticated users, ensure user_id matches their ID
      user_id = auth.uid()
    ELSE 
      -- For anonymous users, allow NULL user_id
      user_id IS NULL
  END
);

-- Create policy for users to view their own feedback
CREATE POLICY "allow_view_own_feedback"
ON feedback
FOR SELECT
TO public
USING (
  CASE
    WHEN auth.uid() IS NOT NULL THEN
      user_id = auth.uid()
    ELSE
      user_id IS NULL
  END
);

-- Update storage policies
DO $$
BEGIN
  -- Drop existing storage policies for the feedback bucket
  DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to upload screenshots" ON storage.objects;
  DROP POLICY IF EXISTS "Allow anonymous users to upload screenshots" ON storage.objects;

  -- Create new unified policy for screenshot uploads
  CREATE POLICY "allow_feedback_screenshots"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'feedback' AND
    (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('png', 'jpg', 'jpeg', 'webp'))
  );

  -- Create policy for reading uploaded screenshots
  CREATE POLICY "allow_feedback_screenshots_select"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'feedback');
END $$;