import type { BibleBook } from '@/lib/types';
import { BibleStorage } from '@/lib/cache';

interface BibleIndex {
  [bookId: string]: {
    name: string;
    chapterCount: number;
    size: number;
  };
}

interface BookData {
  name: string;
  chapters: Array<{
    chapter: number;
    verses: Array<{
      verse: number;
      text: string;
      words?: any[];
    }>;
  }>;
}

let bibleIndex: BibleIndex | null = null;
let bookCache: { [bookId: string]: BookData } = {};

async function loadBibleIndex(): Promise<BibleIndex> {
  if (bibleIndex) return bibleIndex;
  
  try {
    const response = await fetch('/bibles/asv/index.json');
    if (!response.ok) {
      throw new Error(`Failed to load Bible index: ${response.status} ${response.statusText}`);
    }
    
    bibleIndex = await response.json();
    return bibleIndex;
  } catch (error) {
    console.error('Error loading Bible index:', error);
    throw error;
  }
}

export async function loadBook(bookId: string): Promise<BibleBook | null> {
  try {
    const index = await loadBibleIndex();
    const normalizedId = bookId.toLowerCase();
    const bookInfo = index[normalizedId];
    
    if (!bookInfo) {
      console.error(`Book not found: ${bookId}`);
      return null;
    }

    // Check if book is already in memory cache
    if (bookCache[normalizedId]) {
      console.log(`📖 Loading book from cache: ${normalizedId}`);
      return {
        name: bookCache[normalizedId].name,
        chapters: bookCache[normalizedId].chapters
      };
    }

    console.log(`📥 Loading book: ${normalizedId}`);

    // Load the entire book from local files
    try {
      const response = await fetch(`/bibles/asv/${normalizedId}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load book file: ${normalizedId}.json (${response.status} ${response.statusText})`);
      }

      const bookData: BookData = await response.json();
      console.log(`✅ Successfully loaded book: ${normalizedId}`);

      // Store in memory cache
      bookCache[normalizedId] = bookData;

      // Cache individual chapters for offline access
      await Promise.all(bookData.chapters.map(async (chapter) => {
        try {
          await BibleStorage.saveChapter(normalizedId, chapter.chapter, chapter.verses.map(v => ({
            verseNumber: v.verse,
            text: v.text,
            words: v.words || []
          })));
        } catch (error) {
          console.warn(`Failed to cache chapter ${chapter.chapter}:`, error);
        }
      }));

      return {
        name: bookData.name,
        chapters: bookData.chapters
      };
    } catch (error) {
      console.error(`Failed to load book ${normalizedId}:`, error);
      
      // Try to load from IndexedDB as fallback
      const chapter = await BibleStorage.getChapter(normalizedId, 1);
      if (chapter) {
        console.log(`📖 Loaded first chapter from IndexedDB for ${normalizedId}`);
        return {
          name: bookInfo.name,
          chapters: [{ chapter: 1, verses: chapter.verses }]
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Failed to load book: ${bookId}`, error);
    return null;
  }
}

// Add a function to preload a book
export async function preloadBook(bookId: string): Promise<void> {
  try {
    await loadBook(bookId.toLowerCase());
  } catch (error) {
    console.warn(`Failed to preload book ${bookId}:`, error);
  }
}