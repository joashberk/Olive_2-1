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
          const oldReference = verse.reference;
          
          // Skip verses with null references
          if (!oldReference) {
            console.warn('Skipping verse with null reference:', verse.id);
            return null;
          }

          // Try to repair the reference
          const repairedReference = repairVerseReference(oldReference);
          if (!repairedReference) {
            console.warn('Could not repair reference:', oldReference);
            return null;
          }

          // Validate the repaired reference
          if (!isValidReference(repairedReference)) {
            console.warn('Invalid repaired reference:', repairedReference);
            return null;
          }
          
          // Parse the reference to get components
          const { bookId, chapter, verse: verseNumber } = parseVerseReference(repairedReference);
          if (!bookId || !chapter || !verseNumber) {
            console.warn('Could not parse reference components:', repairedReference);
            return null;
          }

          // Create a standardized reference
          const standardReference = createVerseReference(bookId, chapter, verseNumber);
          if (!standardReference) {
            console.warn('Could not create standard reference from:', { bookId, chapter, verseNumber });
            return null;
          }

          // Skip if no change is needed
          if (standardReference === oldReference && 
              verse.book_name === bookId &&
              verse.chapter_number === chapter) {
            return null;
          }

          // Update with all required fields including the new ones
          const update: SavedVerse = {
            id: verse.id,
            user_id: user.id,
            verse_text: verse.text,
            display_reference: standardReference,
            book_name: bookId,
            chapter_number: chapter,
            verse_selections: verse.verse_selections || [],
            updated_at: new Date().toISOString(),
            created_at: verse.created_at,
            themes: verse.themes || [],
            is_composite: verse.is_composite || false,
            click_count: verse.click_count || 0,
            last_accessed: verse.last_accessed || null
          };

          // Log the update for debugging
          console.log('Processing verse update:', {
            id: update.id,
            user_id: update.user_id,
            oldReference,
            newReference: update.display_reference,
            changes: {
              book_name: update.book_name,
              chapter_number: update.chapter_number
            }
          });

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

      console.log('Sending batch update:', updates);

      // Update each verse individually to handle duplicates
      for (const update of updates) {
        try {
          if (!update) continue; // Skip if update is null

          // Check if a verse with the same reference already exists
          const { data: existingData, error: existingError } = await supabase
            .from('user_saved_verses')
            .select('id')
            .eq('user_id', user.id)
            .eq('display_reference', update.display_reference)
            .limit(1);

          if (existingError) {
            console.error('Error checking for duplicate verse:', existingError);
            continue;
          }

          const existingVerse = existingData?.[0] ?? null;

          if (existingVerse) {
            // If a duplicate exists, delete the current verse
            const { error: deleteError } = await supabase
              .from('user_saved_verses')
              .delete()
              .eq('id', update.id);

            if (deleteError) {
              console.error('Error deleting duplicate verse:', deleteError);
              continue;
            }

            console.log(`Deleted duplicate verse: ${update.id}`);
          } else {
            // Update the verse if no duplicate exists
            const { error: updateError } = await supabase
              .from('user_saved_verses')
              .update(update)
              .eq('id', update.id);

            if (updateError) {
              console.error('Error updating verse:', updateError);
              continue;
            }

            console.log(`Successfully updated verse: ${update.id}`);
          }
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