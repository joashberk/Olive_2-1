import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bibleBooks } from '@/data/bibleBooks';
import { fetchChapter } from '@/services/bibleApi';
import type { BibleVerse, BibleChapter } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/useToast';
import { VerseToolbar } from '@/components/ui/VerseToolbar';
import { insertSavedVerse } from '@/lib/supabase';
import { ChapterNavigation } from './ui/ChapterNavigation';
import { ChapterNavigationButtons } from './ui/ChapterNavigationButtons';
import { SettingsPanel } from './ui/SettingsPanel';

interface ReaderProps {
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
}

interface ReaderSettings {
  fontSize: number;
  lineSpacing: number;
}

const defaultSettings: ReaderSettings = {
  fontSize: 23,
  lineSpacing: 2.0
};

function Reader({ selectedBook, selectedChapter, onBookChange, onChapterChange }: ReaderProps) {
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showStudyDrawer, setShowStudyDrawer] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('readerSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const { book, chapter } = useParams();
  const navigate = useNavigate();

  const { data: savedVerses } = useQuery({
    queryKey: ['userSavedVerses', selectedBook, selectedChapter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set<number>();

      const { data } = await supabase
        .from('user_saved_verses')
        .select('verse_selections')
        .eq('book_name', selectedBook)
        .eq('chapter_number', selectedChapter)
        .eq('user_id', user.id);

      const savedVerseNumbers = new Set<number>();
      data?.forEach(verse => {
        verse.verse_selections.forEach((selection: VerseSelection) => {
          for (let i = selection.start; i <= selection.end; i++) {
            savedVerseNumbers.add(i);
          }
        });
      });

      return savedVerseNumbers;
    }
  });

  const { data: chapterData, isLoading: isChapterLoading, error: chapterError } = useQuery<BibleChapter>({
    queryKey: ['chapter', selectedBook, selectedChapter],
    queryFn: () => fetchChapter(selectedBook, selectedChapter),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
    enabled: !!selectedBook && !!selectedChapter
  });

  const handleVerseClick = (verse: BibleVerse) => {
    const verseNum = verse.verse;
    setSelectedVerses(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(verseNum)) {
        newSelection.delete(verseNum);
      } else {
        newSelection.add(verseNum);
      }
      return newSelection;
    });
  };

  const saveVersesMutation = useMutation<
    { savedVerses: number[] },
    Error,
    void,
    unknown
  >({
    mutationFn: async () => {
      const versesToSave = Array.from(selectedVerses).sort((a, b) => a - b);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      if (versesToSave.length === 0) {
        throw new Error('Please select at least one verse to save');
      }

      if (!chapterData?.verses || isChapterLoading) {
        throw new Error('Please wait for chapter to load before saving');
      }

      const result = await insertSavedVerse({
        user_id: user.id,
        book_name: selectedBook,
        chapter_number: selectedChapter,
        selectedVerses: new Set(versesToSave),
        chapterData
      });

      return { savedVerses: versesToSave };
    },
    
    onSuccess: (data) => {
      const savedVerseSet = new Set(data.savedVerses);
      setSelectedVerses(prev => {
        const newSelection = new Set(prev);
        savedVerseSet.forEach(verse => newSelection.delete(verse));
        return newSelection;
      });

      // Invalidate both Reader and SavedVerses queries
      queryClient.invalidateQueries({ queryKey: ['userSavedVerses'] });
      queryClient.invalidateQueries({ queryKey: ['savedVerses'] });
      
      toast({
        title: 'Success',
        description: `Saved ${data.savedVerses.length} verse${data.savedVerses.length === 1 ? '' : 's'}`,
      });
    },
    
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    localStorage.setItem('readerSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    setSelectedVerses(new Set());
  }, [selectedBook, selectedChapter]);

  useEffect(() => {
    if (book && chapter) {
      const bookId = bibleBooks.find(b => 
        b.id.toLowerCase() === book.toLowerCase() || 
        b.name.toLowerCase() === book.toLowerCase()
      )?.id;

      if (bookId) {
        onBookChange(bookId);
        onChapterChange(parseInt(chapter));
      }
    }
  }, [book, chapter, onBookChange, onChapterChange]);

  useEffect(() => {
    const currentBook = bibleBooks.find(b => b.id === selectedBook);
    if (currentBook) {
      navigate(`/${currentBook.id}/${selectedChapter}`);
    }
  }, [selectedBook, selectedChapter, navigate]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      localStorage.setItem('lastOpenedBook', selectedBook);
      localStorage.setItem('lastOpenedChapter', selectedChapter.toString());
    }
  }, [selectedBook, selectedChapter]);

  // Prefetch next and previous chapters
  useEffect(() => {
    const currentBookIndex = bibleBooks.findIndex(b => b.id === selectedBook);
    const currentBook = bibleBooks[currentBookIndex];
    
    // Prefetch next chapter
    if (selectedChapter < currentBook.chapters) {
      queryClient.prefetchQuery({
        queryKey: ['chapter', selectedBook, selectedChapter + 1],
        queryFn: () => fetchChapter(selectedBook, selectedChapter + 1),
        staleTime: Infinity,
        gcTime: Infinity
      });
    }
    
    // Prefetch previous chapter
    if (selectedChapter > 1) {
      queryClient.prefetchQuery({
        queryKey: ['chapter', selectedBook, selectedChapter - 1],
        queryFn: () => fetchChapter(selectedBook, selectedChapter - 1),
        staleTime: Infinity,
        gcTime: Infinity
      });
    }
    
    // Prefetch next book's first chapter
    if (selectedChapter === currentBook.chapters && currentBookIndex < bibleBooks.length - 1) {
      const nextBook = bibleBooks[currentBookIndex + 1];
      queryClient.prefetchQuery({
        queryKey: ['chapter', nextBook.id, 1],
        queryFn: () => fetchChapter(nextBook.id, 1),
        staleTime: Infinity,
        gcTime: Infinity
      });
    }
    
    // Prefetch previous book's last chapter
    if (selectedChapter === 1 && currentBookIndex > 0) {
      const prevBook = bibleBooks[currentBookIndex - 1];
      queryClient.prefetchQuery({
        queryKey: ['chapter', prevBook.id, prevBook.chapters],
        queryFn: () => fetchChapter(prevBook.id, prevBook.chapters),
        staleTime: Infinity,
        gcTime: Infinity
      });
    }
  }, [selectedBook, selectedChapter, queryClient]);

  const getSelectedVerseText = () => {
    if (!chapterData?.verses || selectedVerses.size === 0) return '';

    const sortedVerses = Array.from(selectedVerses).sort((a, b) => a - b);
    const verseMap = new Map(sortedVerses.map((v, i) => [v, i]));

    return chapterData.verses
      .filter(v => selectedVerses.has(v.verse))
      .sort((a, b) => {
        const aIndex = verseMap.get(a.verse) ?? 0;
        const bIndex = verseMap.get(b.verse) ?? 0;
        return aIndex - bIndex;
      })
      .map(v => v.text)
      .join(' ');
  };

  const renderContent = () => {
    if (chapterError) {
      throw chapterError; // This will be caught by the error boundary
    }

    if (isChapterLoading || !chapterData) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-4 bg-dark-700 rounded w-24"></div>
            <div className="space-y-3 w-full max-w-lg">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-4 bg-dark-700 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!chapterData.verses || chapterData.verses.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-dark-400">No chapter data available</div>
        </div>
      );
    }

    return (
      <div 
        className="prose prose-lg max-w-none"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineSpacing
        }}
      >
        <div className="font-serif space-y-4">
          {chapterData.verses.map((verse, index) => {
            const isSelected = selectedVerses.has(verse.verse);
            const isSaved = savedVerses?.has(verse.verse);
            const selectedArray = Array.from(selectedVerses ?? []);
            const isLastSelected = isSelected && verse.verse === Math.max(...selectedArray, -Infinity);
            
            return (
              <span 
                key={`${verse.reference}-${index}`}
                data-verse={verse.verse}
                onClick={() => handleVerseClick(verse)}
                className={`
                  verse-container relative
                  ${isSelected ? 'selected' : ''}
                  ${isSaved ? 'saved' : ''}
                `}
              >
                <span className="verse-number">
                  {verse.verse}
                </span>
                <span className="verse-text">
                  {verse.text}
                </span>
                {' '}
                {isLastSelected && selectedVerses.size > 0 && (
                  <VerseToolbar
                    selectedVerses={Array.from(selectedVerses).sort((a, b) => a - b)}
                    bookName={selectedBook}
                    chapter={selectedChapter}
                    verseText={getSelectedVerseText()}
                    onSave={() => saveVersesMutation.mutate()}
                    onStudy={() => setShowStudyDrawer(true)}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      <div className="bg-dark-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="max-w-2xl mx-auto relative">
            <ChapterNavigation
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
              onBookChange={onBookChange}
              onChapterChange={onChapterChange}
              onSettingsClick={() => setShowSettings(true)}
            />
          </div>
        </div>
      </div>

      <ChapterNavigationButtons
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookChange={onBookChange}
        onChapterChange={onChapterChange}
      />
      
      <div className="flex flex-col h-full">
        <div className="container mx-auto px-4 flex-1 overflow-y-auto" ref={contentRef}>
          <div className="max-w-2xl mx-auto">
            {renderContent()}
          </div>
        </div>

        <SettingsPanel
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>
    </div>
  );
}

export default Reader;