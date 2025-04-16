import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { bibleBooks } from '@/data/bibleBooks';
import { BibleNavigationModal } from './BibleNavigationModal';
import { ReadingSettingsIcon } from './icons/ReadingSettingsIcon';

interface ChapterNavigationProps {
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
  onSettingsClick: () => void;
}

export function ChapterNavigation({ 
  selectedBook, 
  selectedChapter,
  onBookChange,
  onChapterChange,
  onSettingsClick
}: ChapterNavigationProps) {
  const [showNavigation, setShowNavigation] = useState(false);
  const currentBook = bibleBooks.find(book => book.id === selectedBook)!;

  return (
    <div className="w-full">
      <div className="flex justify-between items-start">
        <button
          onClick={() => setShowNavigation(true)}
          className="group text-2xl md:text-3xl font-serif italic text-dark-100 hover:text-olive-300 transition-colors flex items-center gap-2"
        >
          {currentBook.name} {selectedChapter}
          <ChevronDown className="w-5 h-5 text-dark-400 group-hover:text-olive-300 transition-colors" />
        </button>
        <button
          onClick={onSettingsClick}
          className="p-2 text-dark-300 hover:text-dark-100 bg-dark-800/50 hover:bg-dark-800 rounded-full transition-colors"
        >
          <ReadingSettingsIcon className="w-5 h-5" />
        </button>
      </div>

      <BibleNavigationModal
        open={showNavigation}
        onOpenChange={setShowNavigation}
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookChange={onBookChange}
        onChapterChange={onChapterChange}
      />
    </div>
  );
} 