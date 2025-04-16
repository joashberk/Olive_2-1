export interface LexiconEntry {
  strongs_id: string;
  original_word: string;
  transliteration: string;
  part_of_speech: string;
  definition: string;
  notes?: string;
}

// Initial sample data - this will be expanded later
export const greekLexicon: Record<string, LexiconEntry> = {
  "G3056": {
    strongs_id: "G3056",
    original_word: "λόγος",
    transliteration: "logos",
    part_of_speech: "G:N-M",
    definition: "word, saying, statement, speech, doctrine, matter, reason, account, proportion. Also used as 'the Word' (Logos) in John 1:1.",
    notes: "Used in contexts of divine speech, teaching, logical reasoning, and doctrine. Appears in John 1:1, 1 Corinthians 1:18, Hebrews 4:12, and many others."
  }
};

export function getLexiconEntry(strongsId: string): LexiconEntry | null {
  return greekLexicon[strongsId] || null;
}