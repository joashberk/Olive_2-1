/*
  # Configure Linear Integration

  1. Changes
    - Drop existing GitHub webhook trigger
    - Create Linear webhook trigger
    - Update feedback table configuration
*/

-- Drop existing GitHub webhook trigger
DROP TRIGGER IF EXISTS "GitHub Integration" ON feedback;

-- Create Linear webhook trigger
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