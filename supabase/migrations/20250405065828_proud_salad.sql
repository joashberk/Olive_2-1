/*
  # Reconfigure Linear Integration Trigger

  1. Changes
    - Drop existing Linear Integration trigger if it exists
    - Recreate Linear webhook trigger with proper configuration
    - Update RLS policies for feedback table

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control for feedback submissions
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
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE user_id IS NULL
    END
  );

  CREATE POLICY "allow_view_own_feedback"
  ON feedback
  FOR SELECT
  TO public
  USING (
    CASE
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE user_id IS NULL
    END
  );
END $$;