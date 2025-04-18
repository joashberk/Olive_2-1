export interface BibleVerse {
  verse: number;
  text: string;
  reference: string;
  display_reference?: string;
  words?: {
    text: string;
    strongsNumber?: string;
  }[];
}

export interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
}

export interface BibleBook {
  name: string;
  chapters: {
    verses: {
      verse: number;
      text: string;
      words?: {
        text: string;
        strongsNumber?: string;
      }[];
    }[];
  }[];
}

export interface VerseSelection {
  start: number;
  end: number;
}

export interface UserSavedVerse {
  id: string;
  user_id: string;
  book_name: string;
  chapter_number: number;
  verse_selections: VerseSelection[];
  verse_text: string;
  display_reference: string;
  translation: 'asv' | 'web';
  is_composite: boolean;
  themes: string[];
  created_at: string;
  updated_at: string;
  click_count: number;
  last_accessed: string | null;
}

export interface Theme {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export type FeedbackType = 'bug' | 'feature' | 'other';

export interface FeedbackCategory {
  id: FeedbackType;
  label: string;
  description: string;
}

export interface GreekLexiconEntry {
  id: string;
  strongs_id: string;
  original_word: string | null;
  transliteration: string | null;
  morph: string | null;
  gloss: string | null;
  definition: string | null;
}

export interface HebrewLexiconEntry {
  id: string;
  strongs_id: string;
  original_word: string | null;
  transliteration: string | null;
  morph: string | null;
  gloss: string | null;
  definition: string | null;
}

export interface SavedVerse {
  id: string;
  user_id: string;
  book_name: string;
  chapter_number: number;
  verse_selections: VerseSelection[];
  verse_numbers: number[];
  verse_text: string;
  display_reference: string;
  themes: string[];
  is_composite: boolean;
  created_at: string;
  updated_at?: string;
  click_count?: number;
  last_accessed?: string | null;
  translation: 'asv' | 'web';
}