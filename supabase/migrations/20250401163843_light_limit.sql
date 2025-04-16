/*
  # Clean up and restructure lexicon tables

  1. Changes
    - Remove old migrations that had conflicting changes
    - Recreate tables with proper structure
    - Add UUID primary keys
    - Add efficient indexes
    - Insert initial lexicon data

  2. Tables
    - hebrew_lexicon
      - id (uuid, primary key)
      - strongs_id (text, indexed)
      - original_word (text)
      - transliteration (text)
      - morph (text)
      - gloss (text)
      - definition (text)
    
    - greek_lexicon
      - (same structure as hebrew_lexicon)
*/

-- Drop existing tables to start fresh
DROP TABLE IF EXISTS hebrew_lexicon;
DROP TABLE IF EXISTS greek_lexicon;

-- Create hebrew_lexicon table
CREATE TABLE hebrew_lexicon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strongs_id text NOT NULL,
  original_word text,
  transliteration text,
  morph text,
  gloss text,
  definition text
);

-- Create greek_lexicon table
CREATE TABLE greek_lexicon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  strongs_id text NOT NULL,
  original_word text,
  transliteration text,
  morph text,
  gloss text,
  definition text
);

-- Create indexes for efficient lookups
CREATE INDEX idx_hebrew_lexicon_strongs_id ON hebrew_lexicon(strongs_id);
CREATE INDEX idx_greek_lexicon_strongs_id ON greek_lexicon(strongs_id);

-- Insert Hebrew lexicon data
INSERT INTO hebrew_lexicon (strongs_id, original_word, transliteration, morph, gloss, definition)
VALUES
  ('H7225', 'רֵאשִׁית', 'reshith', 'N-f', 'beginning, chief', 'The first, in place, time, order or rank; specifically the beginning; the chief.'),
  ('H0430', 'אֱלֹהִים', 'elohim', 'N-mp', 'God, gods', 'God, gods, judges, angels; plural of intensity for the supreme God.'),
  ('H1254', 'בָּרָא', 'bara', 'V-Qal', 'create, shape', 'To create, shape, form; used exclusively of divine creation.'),
  ('H8064', 'שָׁמַיִם', 'shamayim', 'N-mp', 'heaven, sky', 'The sky, heaven, visible heavens, where stars, etc. are found.'),
  ('H0776', 'אֶרֶץ', 'erets', 'N-f', 'earth, land', 'Earth, land, territory, country, continent; the whole earth or a specific country.');

-- Insert Greek lexicon data
INSERT INTO greek_lexicon (strongs_id, original_word, transliteration, morph, gloss, definition)
VALUES
  ('G3056', 'λόγος', 'logos', 'N-M', 'word, saying', 'A word, speech, divine utterance, analogy');