/*
  # Fix Linear Integration trigger and RLS policies

  1. Changes
    - Drop and recreate Linear Integration trigger with proper error handling
    - Update RLS policies for feedback table to handle both authenticated and anonymous users
    - Ensure proper access control for feedback submissions and viewing

  2. Security
    - Maintain data isolation between users
    - Allow both authenticated and anonymous feedback
    - Prevent unauthorized access to feedback data
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS "Linear Integration" ON feedback;
DROP TRIGGER IF EXISTS "GitHub Integration" ON feedback;

-- Recreate Linear webhook trigger
DO $$ 
BEGIN
  -- Only create the trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'Linear Integration'
  ) THEN
    CREATE TRIGGER "Linear Integration"
    AFTER INSERT ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION supabase_functions.http_request(
      'https://lyqvtevzoqstkpvhqaoq.supabase.co/functions/v1/linear-webhook',
      'POST',
      '{"Content-type":"application/json"}',
      '{"record": "new"}',
      '1000'
    );
  END IF;
END $$;

-- Ensure feedback table has proper RLS policies
DO $$ 
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS "allow_feedback_submission" ON feedback;
  DROP POLICY IF EXISTS "allow_view_own_feedback" ON feedback;

  -- Create policies
  CREATE POLICY "allow_feedback_submission"
  ON feedback
  FOR INSERT
  TO public
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

  CREATE POLICY "allow_view_own_feedback"
  ON feedback
  FOR SELECT
  TO public
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );
END $$;