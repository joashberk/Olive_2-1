import { useState } from 'react';
import { ChevronDown, Settings } from 'lucide-react';
import { bibleBooks } from '@/data/bibleBooks';
import { BibleNavigationModal } from './BibleNavigationModal';
import { useQueryClient } from '@tanstack/react-query';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { translations } from '@/data/translations';

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
  const queryClient = useQueryClient();
  const [translation, setTranslation] = useState<'asv' | 'web'>(() => {
    return localStorage.getItem('selectedTranslation') as 'asv' | 'web' || 'web';
  });

  const handleTranslationChange = async (newTranslation: 'asv' | 'web') => {
    // Update localStorage
    localStorage.setItem('selectedTranslation', newTranslation);
    
    // Update state
    setTranslation(newTranslation);
    
    // Clear all Bible-related caches but keep saved verses
    await queryClient.cancelQueries();
    queryClient.removeQueries({ queryKey: ['chapter'] });
    
    // Invalidate saved verses queries to force a refetch with new translation
    queryClient.invalidateQueries({ queryKey: ['userSavedVerses'] });
    
    // Clear our Bible cache
    localStorage.setItem('clearCache', 'true');
    
    // Force reload the current chapter
    window.location.reload();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNavigation(true)}
            className="group text-2xl font-serif italic text-dark-100 hover:text-olive-300 transition-colors flex items-center gap-2 -ml-1 md:ml-0"
          >
            {currentBook.name} {selectedChapter}
            <ChevronDown className="w-5 h-5 text-dark-400 group-hover:text-olive-300 transition-colors" />
          </button>
          
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="px-3 py-1.5 text-sm bg-dark-800/50 text-dark-300 rounded-lg hover:bg-dark-800 transition-colors"
              >
                {translation.toUpperCase()}
                <span className="sr-only">Current translation: {translation === 'asv' ? 'American Standard Version' : 'World English Bible'}</span>
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[220px] bg-dark-800 rounded-lg p-1 shadow-xl border border-dark-700 z-[60]"
                sideOffset={5}
                align="start"
                side="bottom"
                alignOffset={0}
              >
                {translations.map((t) => (
                  <DropdownMenu.Item
                    key={t.id}
                    className={`
                      flex flex-col px-3 py-2 outline-none cursor-pointer rounded-md
                      ${translation === t.id ? 'bg-olive-900/20 text-olive-300' : 'text-dark-200 hover:bg-dark-700'}
                    `}
                    onClick={() => handleTranslationChange(t.id as 'asv' | 'web')}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="text-xs opacity-75">{t.description}</span>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
        
        <button
          onClick={onSettingsClick}
          className="p-2 text-dark-300 hover:text-dark-100 bg-dark-800/50 hover:bg-dark-800 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
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