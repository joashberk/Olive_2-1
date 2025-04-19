import type { BibleBook } from '@/lib/types';
import { BibleStorage } from '@/lib/cache';

interface BibleIndex {
  [bookId: string]: {
    name: string;
    chapters: number;
  };
}

interface BibleVerse {
  verse: number;
  text: string;
  words?: {
    word: string;
    strong: string;
  }[];
}

interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

interface BookData {
  name: string;
  chapters: BibleChapter[];
}

interface BibleBook {
  name: string;
  chapters: BibleChapter[];
}

let bibleIndex: BibleIndex | null = null;
let bookCache: { [translation: string]: { [bookId: string]: BookData } } = {};

async function loadBibleIndex(): Promise<BibleIndex> {
  const translation = localStorage.getItem('selectedTranslation') || 'web';
  
  // Check if we need to clear cache
  if (localStorage.getItem('clearCache') === 'true') {
    console.log('Clearing Bible cache due to translation change');
    bibleIndex = null;
    bookCache = {};
    localStorage.removeItem('clearCache');
  }
  
  // Reset bibleIndex if translation has changed
  if (bibleIndex) {
    const currentTranslation = localStorage.getItem('selectedTranslation') || 'web';
    if (currentTranslation !== translation) {
      bibleIndex = null;
      bookCache = {};
    }
  }
  
  if (bibleIndex) {
    return bibleIndex;
  }
  
  try {
    const response = await fetch(`/bibles/${translation}/index.json`);
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
    const translation = localStorage.getItem('selectedTranslation') || 'web';
    console.log('Loading book with translation:', translation);
    
    const index = await loadBibleIndex();
    const normalizedId = bookId.toLowerCase();
    const bookInfo = index[normalizedId];
    
    if (!bookInfo) {
      console.error(`Book not found: ${bookId}`);
      return null;
    }

    // Initialize cache for translation if not exists
    if (!bookCache[translation]) {
      console.log('Initializing cache for translation:', translation);
      bookCache[translation] = {};
    }

    // Check if book is already in memory cache
    if (bookCache[translation][normalizedId]) {
      console.log(`📖 Loading book from cache: ${normalizedId} (${translation})`);
      return {
        name: bookCache[translation][normalizedId].name,
        chapters: bookCache[translation][normalizedId].chapters
      };
    }

    console.log(`📥 Loading book: ${normalizedId} (${translation})`);

    // Determine the correct path for the book file
    // For KJV, use the kjv_books directory
    const bookPath = translation === 'kjv' 
      ? `/bibles/kjv_books/${normalizedId}.json`
      : `/bibles/${translation}/${normalizedId}.json`;

    // Load the entire book from local files
    try {
      const response = await fetch(bookPath);
      if (!response.ok) {
        throw new Error(`Failed to load book file: ${bookPath} (${response.status} ${response.statusText})`);
      }

      const bookData: BookData = await response.json();
      console.log(`✅ Successfully loaded book: ${normalizedId} (${translation})`);

      // Store in memory cache
      bookCache[translation][normalizedId] = bookData;

      // Cache individual chapters for offline access
      await Promise.all(bookData.chapters.map(async (chapter) => {
        try {
          await BibleStorage.saveChapter(
            `${translation}:${normalizedId}`,
            chapter.chapter,
            chapter.verses.map(v => ({
              verseNumber: v.verse,
              text: v.text,
              words: v.words || []
            }))
          );
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
      const chapter = await BibleStorage.getChapter(`${translation}:${normalizedId}`, 1);
      if (chapter) {
        console.log(`📖 Loaded first chapter from IndexedDB for ${normalizedId} (${translation})`);
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