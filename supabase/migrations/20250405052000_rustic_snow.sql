-- Drop the Linear webhook trigger
DROP TRIGGER IF EXISTS "Linear Integration" ON feedback;

-- Create new GitHub webhook trigger
CREATE TRIGGER "GitHub Integration"
AFTER INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://lyqvtevzoqstkpvhqaoq.supabase.co/functions/v1/github-webhook',
  'POST',
  '{"Content-type":"application/json"}',
  '{"record": "new"}',
  '1000'
);