import { bibleBooks } from '@/data/bibleBooks';
import { loadBook } from '@/lib/loadBook';
import type { BibleVerse, BibleChapter, Word } from '@/lib/types';
import BibleStorage from './BibleStorage';

// Helper function to format verse references
function formatVerseReference(bookId: string, chapter: number, verse: number): string {
  try {
    const book = bibleBooks.find(b => b.id === bookId);
    if (!book) {
      console.warn(`Unknown book ID: ${bookId}`);
      return '';
    }
    return `${book.name} ${chapter}:${verse}`;
  } catch (error) {
    console.error('Error formatting verse reference:', error);
    return '';
  }
}

// Helper function to extract Strong's numbers from KJV text
function extractStrongsFromKJV(text: string): { text: string, words: Word[] } {
  // Regular expression to match Strong's numbers in the text
  const regex = /\{([HG][0-9]+)\}|\{(\([HG]8[0-9]+\))\}/g;
  
  // Clean the text by removing Strong's numbers
  const cleanText = text.replace(regex, '');
  
  // Extract word-Strong's pairs
  const words: Word[] = [];
  let match;
  let lastIndex = 0;
  const wordRegex = /(\w+)\{([HG][0-9]+)\}/g;
  
  // Simplified matching just for demonstration
  // In a real implementation, you would need more sophisticated logic
  // to match words with their Strong's numbers
  while ((match = wordRegex.exec(text)) !== null) {
    words.push({
      word: match[1],
      strong: match[2]
    });
  }
  
  return {
    text: cleanText,
    words
  };
}

const memoryCache = new Map<string, BibleChapter>();

export async function fetchChapter(bookId: string, chapter: number, includeStrongs: boolean = false): Promise<BibleChapter> {
  const cacheKey = `${bookId}-${chapter}-${includeStrongs}`;
  
  // Check memory cache first
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Load from local Bible data
  try {
    const bookData = await loadBook(bookId);
    if (!bookData || !bookData.chapters || !bookData.chapters[chapter - 1]) {
      throw new Error(`Chapter ${chapter} not found in book ${bookId}`);
    }

    const chapterData = bookData.chapters[chapter - 1];
    const translation = localStorage.getItem('selectedTranslation') || 'web';
    
    const formattedChapter: BibleChapter = {
      bookId,
      chapter,
      reference: `${bookData.name} ${chapter}`,
      verses: chapterData.verses.map(verse => {
        let text = verse.text;
        let words = verse.words || [];
        
        // For KJV, extract Strong's numbers if they exist
        if (translation === 'kjv' && text.includes('{')) {
          const processed = extractStrongsFromKJV(text);
          text = processed.text;
          // Only add words if we have Strong's data and includeStrongs is true
          if (includeStrongs && processed.words.length > 0) {
            words = processed.words;
          }
        }
        
        return {
          verse: verse.verse,
          text: text,
          reference: formatVerseReference(bookId, chapter, verse.verse),
          words: includeStrongs ? words : []
        };
      })
    };

    // Save to memory cache
    memoryCache.set(cacheKey, formattedChapter);

    // Save to IndexedDB for offline access
    try {
      await BibleStorage.saveChapter(bookId, chapter, formattedChapter.verses);
    } catch (error) {
      console.warn('Failed to save to offline storage:', error);
      // Continue even if offline storage fails
    }

    return formattedChapter;
  } catch (error) {
    console.error('Error loading chapter:', error);
    throw error;
  }
}

export async function searchVerses(query: string): Promise<BibleVerse[]> {
  // Try offline search first
  try {
    const offlineResults = await BibleStorage.searchVerses(query);
    if (offlineResults?.length > 0) {
      console.log('Found search results in offline storage:', offlineResults);
      return offlineResults.map(verse => ({
        verse: verse.verseNumber,
        text: verse.text,
        reference: formatVerseReference(verse.book, verse.chapter, verse.verseNumber),
        words: verse.words || []
      })).filter(verse => verse.reference); // Filter out verses with invalid references
    }
  } catch (error) {
    console.warn('Error searching offline storage:', error);
  }

  // Search in loaded books
  try {
    const results: BibleVerse[] = [];
    const searchText = query.toLowerCase();

    // Get list of all books
    for (const bookInfo of bibleBooks) {
      const bookData = await loadBook(bookInfo.id);
      if (!bookData) continue;

      for (let chapterIndex = 0; chapterIndex < bookData.chapters.length; chapterIndex++) {
        const chapter = bookData.chapters[chapterIndex];
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(searchText)) {
            const reference = formatVerseReference(bookInfo.id, chapterIndex + 1, verse.verse);
            if (reference) {
              results.push({
                verse: verse.verse,
                text: verse.text,
                reference,
                words: verse.words || []
              });
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error searching verses:', error);
    throw error;
  }
}