import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BibleStorage } from '@/lib/cache';
import { bibleBooks } from '@/data/bibleBooks';
import { loadBook } from '@/lib/loadBook';

interface LoadingState {
  book: string;
  chapter: number;
  progress: number;
  status: 'initial' | 'adjacent' | 'background';
}

interface BibleLoaderProps {
  onComplete: () => void;
  initialBook?: string;
  initialChapter?: number;
}

export function BibleLoader({ 
  onComplete, 
  initialBook,
  initialChapter 
}: BibleLoaderProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    book: '',
    chapter: 0,
    progress: 0,
    status: 'initial'
  });
  const [error, setError] = useState<string | null>(null);

  const loadChapter = async (bookId: string, chapterNum: number) => {
    try {
      const isLoaded = await BibleStorage.isChapterLoaded(bookId, chapterNum);
      if (isLoaded) return true;

      const bookData = await loadBook(bookId);
      if (!bookData) return false;

      const chapter = bookData.chapters[chapterNum - 1];
      if (!chapter) return false;

      for (const verse of chapter.verses) {
        await BibleStorage.saveVerse({
          reference: `${bookId}_${chapterNum}_${verse.verse}`,
          book: bookId,
          chapter: chapterNum,
          verseNumber: verse.verse,
          text: verse.text,
          words: verse.words || [],
        });
      }

      return true;
    } catch (err) {
      console.error('Error loading chapter:', err);
      return false;
    }
  };

  const loadAdjacentChapters = async (bookId: string, chapterNum: number) => {
    setLoadingState(prev => ({ ...prev, status: 'adjacent' }));
    const book = bibleBooks.find(b => b.id === bookId);
    if (!book) return;
    
    // Load previous chapter if exists
    if (chapterNum > 1) {
      await loadChapter(bookId, chapterNum - 1);
    }
    
    // Load next chapter if exists
    const bookData = await loadBook(bookId);
    if (bookData && chapterNum < bookData.chapters.length) {
      await loadChapter(bookId, chapterNum + 1);
    }
  };

  const startProgressiveLoading = async (currentBookId: string) => {
    setLoadingState(prev => ({ ...prev, status: 'background' }));
    
    // Find current book index
    const currentBookIndex = bibleBooks.findIndex(b => b.id === currentBookId);
    if (currentBookIndex === -1) return;
    
    // Load books in order of proximity to current book
    const loadOrder = bibleBooks
      .map((book, index) => ({ book, distance: Math.abs(index - currentBookIndex) }))
      .sort((a, b) => a.distance - b.distance);
      
    for (const { book } of loadOrder) {
      if (book.id === currentBookId) continue; // Skip current book
      
      const bookData = await loadBook(book.id);
      if (!bookData) continue;
      
      // Load first chapter of each book
      const chapter = bookData.chapters[0];
      for (const verse of chapter.verses) {
        await BibleStorage.saveVerse({
          reference: `${book.id}_1_${verse.verse}`,
          book: book.id,
          chapter: 1,
          verseNumber: verse.verse,
          text: verse.text,
          words: verse.words || [],
        });
      }
      
      // Update progress
      setLoadingState(prev => ({
        ...prev,
        progress: Math.floor((loadOrder.findIndex(item => item.book === book) / loadOrder.length) * 100)
      }));
    }
  };

  useEffect(() => {
    const loadBible = async () => {
      try {
        // Get last opened chapter from local storage
        const lastBook = localStorage.getItem('lastOpenedBook') || 'genesis';
        const lastChapter = parseInt(localStorage.getItem('lastOpenedChapter') || '1', 10);
        
        // Use provided initial values or fall back to last opened or genesis
        const bookToLoad = initialBook || lastBook;
        const chapterToLoad = initialChapter || lastChapter;

        // 1. Load initial chapter
        const chapterLoaded = await loadChapter(bookToLoad, chapterToLoad);
        if (!chapterLoaded) throw new Error('Failed to load initial chapter');
        
        // 2. Allow app to become interactive
        onComplete();
        
        // 3. Load adjacent chapters in background
        await loadAdjacentChapters(bookToLoad, chapterToLoad);
        
        // 4. Start progressive loading of other books
        startProgressiveLoading(bookToLoad);
      } catch (err) {
        console.error('Error loading Bible:', err);
        setError((err as Error).message);
      }
    };

    loadBible();
  }, [initialBook, initialChapter, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      {error ? (
        <div className="text-red-600">Error: {error}</div>
      ) : (
        <>
          <motion.div
            className="text-lg font-medium text-olive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {loadingState.status === 'initial' && 'Loading Bible...'}
            {loadingState.status === 'adjacent' && 'Loading nearby chapters...'}
            {loadingState.status === 'background' && (
              <div className="text-sm text-dark-300">
                Loading additional content: {loadingState.progress}%
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
