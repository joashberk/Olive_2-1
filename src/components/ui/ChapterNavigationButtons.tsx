import { ChevronLeft, ChevronRight } from 'lucide-react';
import { bibleBooks } from '@/data/bibleBooks';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ChapterNavigationButtonsProps {
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
}

export function ChapterNavigationButtons({
  selectedBook,
  selectedChapter,
  onBookChange,
  onChapterChange,
}: ChapterNavigationButtonsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const currentBook = bibleBooks.find(book => book.id === selectedBook)!;
  const currentBookIndex = bibleBooks.findIndex(book => book.id === selectedBook);

  // Add scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY < 10 || scrollDelta < 0) {
        setIsVisible(true);
      } 
      // Hide navigation when scrolling down
      else if (scrollDelta > 5) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handlePreviousChapter = () => {
    if (selectedChapter > 1) {
      onChapterChange(selectedChapter - 1);
    } else if (currentBookIndex > 0) {
      const previousBook = bibleBooks[currentBookIndex - 1];
      onBookChange(previousBook.id);
      onChapterChange(previousBook.chapters);
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < currentBook.chapters) {
      onChapterChange(selectedChapter + 1);
    } else if (currentBookIndex < bibleBooks.length - 1) {
      const nextBook = bibleBooks[currentBookIndex + 1];
      onBookChange(nextBook.id);
      onChapterChange(1);
    }
  };

  const canGoPrevious = selectedChapter > 1 || currentBookIndex > 0;
  const canGoNext = selectedChapter < currentBook.chapters || currentBookIndex < bibleBooks.length - 1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore key events if user is typing in an input or textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'ArrowLeft' && canGoPrevious) {
        handlePreviousChapter();
      } else if (event.key === 'ArrowRight' && canGoNext) {
        handleNextChapter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoPrevious, canGoNext, selectedBook, selectedChapter]);

  return (
    <>
      {/* Desktop Navigation */}
      <div className="fixed top-1/2 -translate-y-1/2 left-0 hidden md:block z-[60]" style={{ left: 'calc(50% - 32rem)' }}>
        <button
          onClick={handlePreviousChapter}
          disabled={!canGoPrevious}
          className="p-3 text-dark-300 hover:text-dark-100 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Previous chapter"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      <div className="fixed top-1/2 -translate-y-1/2 right-0 hidden md:block z-[60]" style={{ right: 'calc(50% - 32rem)' }}>
        <button
          onClick={handleNextChapter}
          disabled={!canGoNext}
          className="p-3 text-dark-300 hover:text-dark-100 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Next chapter"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className="fixed left-1/2 -translate-x-1/2 flex gap-12 md:hidden z-[60] bottom-24">
        <motion.div
          className="flex items-center gap-12"
          animate={{ y: isVisible ? 0 : 64 }}
          transition={{ 
            type: 'spring',
            damping: 30,
            stiffness: 300,
            mass: 0.8
          }}
        >
          <button
            onClick={handlePreviousChapter}
            disabled={!canGoPrevious}
            className="p-2.5 text-dark-300 hover:text-dark-100 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg"
            aria-label="Previous chapter"
          >
            <ChevronLeft className="w-5.5 h-5.5" />
          </button>

          <button
            onClick={handleNextChapter}
            disabled={!canGoNext}
            className="p-2.5 text-dark-300 hover:text-dark-100 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg"
            aria-label="Next chapter"
          >
            <ChevronRight className="w-5.5 h-5.5" />
          </button>
        </motion.div>
      </div>
    </>
  );
} 