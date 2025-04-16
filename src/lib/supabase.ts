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
    console.log('Starting verse save with:', {
      user_id,
      book_name,
      chapter_number,
      selectedVerses: Array.from(selectedVerses),
    });

    const selectedArray = Array.from(selectedVerses).sort((a, b) => a - b);
    if (!selectedArray.length) {
      console.error('No verses selected');
      throw new Error('No verses selected');
    }

    // Convert to verse selections format
    const verse_selections = [];
    let start = selectedArray[0];
    let end = start;

    // Process all verses including the last one
    for (let i = 1; i <= selectedArray.length; i++) {
      if (i === selectedArray.length || selectedArray[i] !== end + 1) {
        verse_selections.push({ start, end });
        if (i < selectedArray.length) {
          start = end = selectedArray[i];
        }
      } else {
        end = selectedArray[i];
      }
    }

    console.log('Processed verse selections:', verse_selections);

    const versesToSave = chapterData?.verses.filter(v => selectedVerses.has(v.verse)) || [];
    const verse_text = versesToSave.map(v => v.text).join('\n');
    const display_reference = formatVerseReference(book_name, chapter_number, verse_selections);

    console.log('Saving verse with data:', {
      verse_selections,
      verse_text,
      display_reference,
      is_composite: selectedArray.length > 1,
      verseCount: selectedArray.length
    });

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
    
    console.log('Successfully saved verse:', data);
    return { data, savedVerses: selectedArray };
  } catch (error) {
    console.error('Error saving verses:', error);
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