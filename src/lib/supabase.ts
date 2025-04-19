import { createClient } from '@supabase/supabase-js';
import type { UserSavedVerse, VerseSelection, BibleVerse } from './types';
import { formatVerseReference } from '@/lib/utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: localStorage,
    storageKey: 'olive_auth_token'
  },
  global: {
    headers: {
      'X-Client-Info': 'olive-bible-app',
      'Prefer': 'resolution=ignore-duplicates'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  },
  db: {
    schema: 'public'
  }
});

// Add debug logging for all requests
supabase.handleResponse = (response, error) => {
  if (error) {
    console.error('Supabase request error:', {
      url: response?.url,
      status: response?.status,
      error
    });
  }
  return { data: response?.data, error };
};

export async function checkExistingVerse({
  user_id,
  book_name,
  chapter_number,
  selectedVerses,
  translation
}: {
  user_id: string;
  book_name: string;
  chapter_number: number;
  selectedVerses: Set<number>;
  translation: 'asv' | 'web' | 'kjv';
}): Promise<string | null> {
  try {
    const selectedArray = Array.from(selectedVerses).sort((a, b) => a - b);
    if (!selectedArray.length) return null;

    const { data, error } = await supabase
      .from('user_saved_verses')
      .select('id, verse_selections')
      .eq('user_id', user_id)
      .eq('book_name', book_name)
      .eq('chapter_number', chapter_number)
      .eq('translation', translation)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }

    if (!data) return null;

    // Check if the verse selections match
    const existingSelections = data.verse_selections as VerseSelection[];
    const newSelections = [{ start: selectedArray[0], end: selectedArray[selectedArray.length - 1] }];

    if (JSON.stringify(existingSelections) === JSON.stringify(newSelections)) {
      return data.id;
    }

    return null;
  } catch (error) {
    console.error('Error checking existing verse:', error);
    return null;
  }
}

export async function insertSavedVerse(
  user_id: string,
  book_name: string,
  chapter_number: number,
  selectedVerses: number[],
  chapterData: any,
  translation: 'asv' | 'web' | 'kjv'
): Promise<boolean | null> {
  try {
    // Sort verses numerically
    const sortedVerses = selectedVerses.sort((a, b) => a - b);
    
    // Create verse selections array with start and end properties
    const verseSelections = identifyVerseRanges(sortedVerses);

    // Get verse text by joining the selected verses
    const verseText = selectedVerses
      .map(verseNum => chapterData.verses[verseNum - 1]?.text || '')
      .filter(text => text)
      .join(' ');

    // Create display reference using our formatting function
    const displayReference = formatVerseReference(book_name, chapter_number, verseSelections);

    console.log('Inserting verse with:', {
      user_id,
      book_name,
      chapter_number,
      verse_selections: verseSelections,
      verse_text: verseText,
      display_reference: displayReference,
      translation
    });

    const { error } = await supabase.from('user_saved_verses').insert({
      user_id,
      book_name,
      chapter_number,
      verse_selections: verseSelections,
      verse_text: verseText,
      display_reference: displayReference,
      translation,
      is_composite: false,
      themes: []
    });

    if (error) {
      console.error('Error inserting saved verse:', error);
      return null;
    }

    return true;
  } catch (error) {
    console.error('Error in insertSavedVerse:', error);
    return null;
  }
}

// Helper function to identify verse ranges
function identifyVerseRanges(verses: number[]): VerseSelection[] {
  if (!verses.length) return [];
  
  const ranges: VerseSelection[] = [];
  let start = verses[0];
  let prev = verses[0];
  
  for (let i = 1; i <= verses.length; i++) {
    if (i === verses.length || verses[i] !== prev + 1) {
      ranges.push({
        start,
        end: prev
      });
      if (i < verses.length) {
        start = verses[i];
      }
    }
    if (i < verses.length) {
      prev = verses[i];
    }
  }
  
  return ranges;
}

export async function unsaveVerse(verseId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_saved_verses')
      .delete()
      .eq('id', verseId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unsaving verse:', error);
    throw error;
  }
}

export async function getSavedVerses(userId: string): Promise<UserSavedVerse[]> {
  try {
    const { data, error } = await supabase
      .from('user_saved_verses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting saved verses:', error);
    return [];
  }
}

export async function updateVerseThemes(verseId: string, themes: string[]): Promise<UserSavedVerse | null> {
  try {
    const { data, error } = await supabase
      .from('user_saved_verses')
      .update({ themes })
      .eq('id', verseId)
      .select()
      .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;

  } catch (error) {
    console.error('Error updating verse themes:', error);
    return null;
  }
}

export async function testTranslationColumn(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_saved_verses')
      .select('translation')
      .limit(1);

    if (error) {
      console.error('Error testing translation column:', error);
      return false;
    }

    console.log('Translation column test result:', data);
    return true;
  } catch (error) {
    console.error('Error in testTranslationColumn:', error);
    return false;
  }
}