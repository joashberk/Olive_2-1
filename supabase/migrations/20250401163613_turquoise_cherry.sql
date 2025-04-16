/*
  # Update lexicon tables structure

  1. Changes
    - Add UUID primary key to hebrew_lexicon and greek_lexicon tables
    - Make strongs_id a non-unique column to allow variants
    - Add indexes for efficient lookups
    - Insert initial lexicon data
*/

-- Hebrew Lexicon
ALTER TABLE hebrew_lexicon 
DROP CONSTRAINT IF EXISTS hebrew_lexicon_pkey;

ALTER TABLE hebrew_lexicon
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- Greek Lexicon
ALTER TABLE greek_lexicon 
DROP CONSTRAINT IF EXISTS greek_lexicon_pkey;

ALTER TABLE greek_lexicon
ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() PRIMARY KEY;

-- Create indexes on strongs_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_hebrew_lexicon_strongs_id ON hebrew_lexicon(strongs_id);
CREATE INDEX IF NOT EXISTS idx_greek_lexicon_strongs_id ON greek_lexicon(strongs_id);

-- Insert Hebrew lexicon data
INSERT INTO hebrew_lexicon (strongs_id, original_word, transliteration, morph, gloss, definition)
VALUES
  ('H7225', 'רֵאשִׁית', 'reshith', 'N-f', 'beginning, chief', 'The first, in place, time, order or rank; specifically the beginning; the chief.'),
  ('H0430', 'אֱלֹהִים', 'elohim', 'N-mp', 'God, gods', 'God, gods, judges, angels; plural of intensity for the supreme God.'),
  ('H1254', 'בָּרָא', 'bara', 'V-Qal', 'create, shape', 'To create, shape, form; used exclusively of divine creation.'),
  ('H8064', 'שָׁמַיִם', 'shamayim', 'N-mp', 'heaven, sky', 'The sky, heaven, visible heavens, where stars, etc. are found.'),
  ('H0776', 'אֶרֶץ', 'erets', 'N-f', 'earth, land', 'Earth, land, territory, country, continent; the whole earth or a specific country.');

-- Insert Greek lexicon data (placeholder for now)
INSERT INTO greek_lexicon (strongs_id, original_word, transliteration, morph, gloss, definition)
VALUES
  ('G3056', 'λόγος', 'logos', 'N-M', 'word, saying', 'A word, speech, divine utterance, analogy');