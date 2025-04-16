/*
  # Add Bible API logs table

  1. New Tables
    - `bible_api_logs`
      - `id` (uuid, primary key)
      - `book` (text)
      - `chapter` (integer)
      - `timestamp` (timestamptz)
      - `success` (boolean)
      - `error` (text, nullable)
      - `response_time` (integer) - in milliseconds

  2. Security
    - No RLS needed as this is an internal logging table
*/

CREATE TABLE bible_api_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter integer NOT NULL,
  timestamp timestamptz DEFAULT now(),
  success boolean NOT NULL,
  error text,
  response_time integer NOT NULL
);

-- Create index for efficient querying
CREATE INDEX idx_bible_api_logs_timestamp ON bible_api_logs(timestamp);