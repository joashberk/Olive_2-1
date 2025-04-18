import { supabase } from './supabase';
import { SavedVerse } from './types';
import { repairVerseReference, parseVerseReference, createVerseReference, isValidReference } from './utils';

export async function migrateSavedVerses(): Promise<void> {
  try {
    console.log('Starting saved verses migration...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user logged in, skipping migration');
      return;
    }

    console.log('Authenticated user:', user.id);

    // Get all saved verses that need migration
    const { data: verses, error } = await supabase
      .from('user_saved_verses')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching verses for migration:', error);
      return;
    }

    if (!verses?.length) {
      console.log('No verses need migration');
      return;
    }

    console.log(`Found ${verses.length} verses that need migration`);

    // Process verses in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      
      // Process each verse in the batch
      const updates = batch.map(verse => {
        try {
          // Skip verses that don't need migration
          if (verse.verse_selections && verse.book_name && verse.chapter_number) {
            return null;
          }

          // Extract book and chapter from display_reference if available
          const displayRef = verse.display_reference;
          if (!displayRef) {
            console.warn('Skipping verse with no display reference:', verse.id);
            return null;
          }

          // Parse the display reference
          const parts = displayRef.split(' ');
          if (parts.length < 2) {
            console.warn('Invalid display reference format:', displayRef);
            return null;
          }

          const bookName = parts[0];
          const chapterVerse = parts[1].split(':');
          if (chapterVerse.length !== 2) {
            console.warn('Invalid chapter:verse format:', parts[1]);
            return null;
          }

          const chapterNum = parseInt(chapterVerse[0], 10);
          const verseNum = parseInt(chapterVerse[1], 10);

          if (isNaN(chapterNum) || isNaN(verseNum)) {
            console.warn('Invalid chapter or verse number:', { chapterNum, verseNum });
            return null;
          }

          // Create verse selections array
          const verseSelections = [{
            start: verseNum,
            end: verseNum
          }];

          // Update with all required fields
          const update: Partial<SavedVerse> = {
            id: verse.id,
            user_id: user.id,
            verse_text: verse.verse_text,
            display_reference: displayRef,
            book_name: bookName,
            chapter_number: chapterNum,
            verse_selections: verseSelections,
            themes: verse.themes || [],
            is_composite: false
          };

          return update;
        } catch (error) {
          console.error('Error processing verse:', verse, error);
          return null;
        }
      }).filter(Boolean);

      if (updates.length === 0) {
        console.log('No updates needed for this batch');
        continue;
      }

      console.log('Processing updates:', updates);

      // Update each verse individually
      for (const update of updates) {
        try {
          if (!update) continue;

          const { error: updateError } = await supabase
            .from('user_saved_verses')
            .update(update)
            .eq('id', update.id);

          if (updateError) {
            console.error('Error updating verse:', updateError);
            continue;
          }

          console.log(`Successfully updated verse: ${update.id}`);
        } catch (error) {
          console.error('Error processing update:', error);
        }
      }
    }

    console.log('Saved verses migration completed');
  } catch (error) {
    console.error('Error during saved verses migration:', error);
  }
}

export async function migrateThemeData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  console.log('[migrateThemeData] Starting theme data migration...', {
    userId: user.id,
    timestamp: new Date().toISOString()
  });

  // First, get all themes
  const { data: themes, error: themesError } = await supabase
    .from('themes')
    .select('*')
    .eq('user_id', user.id);

  if (themesError) {
    console.error('[migrateThemeData] Error fetching themes:', themesError);
    return;
  }

  console.log('[migrateThemeData] Found themes:', {
    count: themes?.length,
    themes: themes?.map(t => ({ id: t.id, name: t.name }))
  });

  // Get all saved verses
  const { data: verses, error: versesError } = await supabase
    .from('user_saved_verses')
    .select('*')
    .eq('user_id', user.id);

  if (versesError) {
    console.error('[migrateThemeData] Error fetching verses:', versesError);
    return;
  }

  console.log('[migrateThemeData] Found verses to migrate:', {
    count: verses?.length,
    versesWithThemes: verses?.filter(v => v.themes && v.themes.length > 0).length
  });

  // Process each verse
  for (const verse of verses || []) {
    console.log('[migrateThemeData] Processing verse:', {
      id: verse.id,
      reference: verse.display_reference,
      currentThemes: verse.themes,
      themeType: verse.themes ? typeof verse.themes : 'undefined',
      isArray: Array.isArray(verse.themes)
    });

    if (!Array.isArray(verse.themes)) {
      console.log('[migrateThemeData] Initializing empty themes array for verse:', verse.id);
      const { error: updateError } = await supabase
        .from('user_saved_verses')
        .update({ themes: [] })
        .eq('id', verse.id);

      if (updateError) {
        console.error('[migrateThemeData] Error initializing themes:', updateError);
      }
      continue;
    }

    // Convert theme names to theme IDs
    const themeIds = verse.themes
      .map(theme => {
        if (typeof theme === 'string') {
          // If it's already a UUID, keep it
          if (theme.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
            return theme;
          }
          // Otherwise, look up the theme ID by name
          const matchingTheme = themes?.find(t => t.name === theme);
          return matchingTheme?.id;
        }
        return null;
      })
      .filter((id): id is string => id !== null);

    console.log('[migrateThemeData] Theme conversion result:', {
      verseId: verse.id,
      originalThemes: verse.themes,
      convertedIds: themeIds
    });

    // Update the verse with theme IDs
    const { error: updateError } = await supabase
      .from('user_saved_verses')
      .update({ themes: themeIds })
      .eq('id', verse.id);

    if (updateError) {
      console.error('[migrateThemeData] Error updating verse themes:', {
        verseId: verse.id,
        error: updateError
      });
    } else {
      console.log('[migrateThemeData] Successfully updated verse themes:', {
        verseId: verse.id,
        newThemes: themeIds
      });
    }
  }

  console.log('[migrateThemeData] Theme data migration completed', {
    timestamp: new Date().toISOString()
  });
}