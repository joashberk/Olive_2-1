import type { BibleBook } from '@/lib/types';
import { BibleStorage, ChapterRecord } from '@/lib/cache';

export async function loadBook(bookId: string): Promise<BibleBook | null> {
  try {
    // First check if the book is already loaded
    const isLoaded = await BibleStorage.isChapterLoaded(bookId, 1);
    if (isLoaded) {
      const chapterRecord = await BibleStorage.getChapter(bookId, 1);
      if (chapterRecord && Array.isArray(chapterRecord.verses) && chapterRecord.verses.length > 0) {
        return {
          name: bookId,
          chapters: [
            {
              verses: chapterRecord.verses.map((v) => ({
                verse: v.verseNumber,
                text: v.text,
                words: v.words,
              })),
            },
          ],
        };
      }
    }

    // Otherwise fetch from JSON
    const response = await fetch('/bibles/asv.min.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch Bible JSON: ${response.statusText}`);
    }

    const bibleData = await response.json();
    const normalizedId = bookId.toLowerCase();
    const bookData = bibleData[normalizedId];

    if (!bookData) {
      console.error(`Book not found: ${bookId}`);
      return null;
    }

    return bookData;
  } catch (error) {
    console.error(`Failed to load book: ${bookId}`, error);
    return null;
  }
}