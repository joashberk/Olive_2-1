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
      'X-Client-Info': 'olive-bible-app'
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

export async function checkExistingVerse({
  user_id,
  book_name,
  chapter_number,
  selectedVerses
}: {
  user_id: string;
  book_name: string;
  chapter_number: number;
  selectedVerses: Set<number>;
}): Promise<string | null> {
  try {
    const selectedArray = Array.from(selectedVerses).sort((a, b) => a - b);
    if (!selectedArray.length) {
      console.error('No verses selected');
      return null;
    }

    // Query using raw SQL comparison for JSONB
    const { data, error } = await supabase
      .from('user_saved_verses')
      .select('id')
      .eq('user_id', user_id)
      .eq('book_name', book_name)
      .eq('chapter_number', chapter_number)
      .filter('verse_selections', 'cs', `[{"start": ${selectedArray[0]}, "end": ${selectedArray[0]}}]`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log('No existing verse found');
        return null;
      }
      console.error('Error checking for existing verse:', error);
      throw error;
    }

    console.log('Found existing verse with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error checking for existing verse:', error);
    throw error;
  }
}

export async function insertSavedVerse({
  user_id,
  book_name,
  chapter_number,
  selectedVerses,
  chapterData
}: {
  user_id: string;
  book_name: string;
  chapter_number: number;
  selectedVerses: Set<number>;
  chapterData: { verses: BibleVerse[] };
}): Promise<{ data: UserSavedVerse; savedVerses: number[] }> {
  try {
    const selectedArray = Array.from(selectedVerses).sort((a, b) => a - b);
    if (!selectedArray.length) {
      console.error('No verses selected');
      throw new Error('No verses selected');
    }

    // First check if the verse already exists
    const existingVerseId = await checkExistingVerse({
      user_id,
      book_name,
      chapter_number,
      selectedVerses
    });

    if (existingVerseId) {
      console.log('Verse already exists, deleting it:', existingVerseId);
      const { error: deleteError } = await supabase
        .from('user_saved_verses')
        .delete()
        .eq('id', existingVerseId);

      if (deleteError) {
        console.error('Error deleting existing verse:', deleteError);
        throw deleteError;
      }

      console.log('Successfully deleted existing verse');
      return { data: null, savedVerses: [] };
    }

    // Create verse selections array with proper spacing
    const verse_selections = [{ start: selectedArray[0], end: selectedArray[0] }];
    console.log('Inserting verse selections:', verse_selections);

    const versesToSave = chapterData?.verses.filter(v => selectedVerses.has(v.verse)) || [];
    const verse_text = versesToSave.map(v => v.text).join('\n');
    const display_reference = formatVerseReference(book_name, chapter_number, verse_selections);

    const { data, error } = await supabase
      .from('user_saved_verses')
      .insert({
        user_id,
        book_name,
        chapter_number,
        verse_selections,
        verse_text,
        display_reference,
        is_composite: selectedArray.length > 1,
        themes: []
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    console.log('Successfully saved new verse:', data);
    return { data, savedVerses: selectedArray };
  } catch (error) {
    console.error('Error in verse save process:', error);
    throw error;
  }
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