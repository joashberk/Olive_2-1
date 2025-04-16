/*
  # Create feedback table for user feedback

  1. New Tables
    - `feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable)
      - `user_email` (text, nullable)
      - `user_name` (text, nullable)
      - `type` (text) - 'bug', 'feature', or 'other'
      - `message` (text)
      - `created_at` (timestamp)
      - `status` (text) - 'new', 'in_progress', 'resolved', 'closed'

  2. Security
    - Enable RLS on feedback table
    - Add policies for:
      - Users can create feedback
      - Users can view their own feedback
*/

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  user_email text,
  user_name text,
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'other')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now(),
  status text DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed'))
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE 
      WHEN auth.uid() IS NOT NULL THEN user_id = auth.uid()
      ELSE true
    END
  );

CREATE POLICY "Users can view their own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for faster lookups
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);