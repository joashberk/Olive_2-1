/*
  # Fix Linear webhook trigger

  1. Changes
    - Drop existing trigger if it exists
    - Create new trigger with proper configuration
    - Add proper parameters for the webhook call

  2. Security
    - Maintain existing RLS policies
    - Ensure webhook only fires on INSERT
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS "Linear Integration" ON feedback;

-- Create new trigger with proper configuration
CREATE TRIGGER "Linear Integration"
AFTER INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://lyqvtevzoqstkpvhqaoq.supabase.co/functions/v1/linear-webhook',
  'POST',
  '{"Content-type":"application/json"}',
  '{"record": "new"}', -- This tells Supabase to include the new record
  '1000' -- 1 second timeout
);