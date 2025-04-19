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
import { testTranslationColumn } from '@/lib/supabase';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ReaderProps {
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
}

interface ReaderSettings {
  fontSize: number;
  lineSpacing: number;
  fontFamily: 'serif' | 'sans';
}

const defaultSettings: ReaderSettings = {
  fontSize: 23,
  lineSpacing: 2.0,
  fontFamily: 'sans'
};

function Reader({ selectedBook, selectedChapter, onBookChange, onChapterChange }: ReaderProps) {
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showStudyDrawer, setShowStudyDrawer] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('readerSettings');
    const parsedSettings = saved ? JSON.parse(saved) : defaultSettings;
    console.log("Initial reader settings:", parsedSettings);
    return parsedSettings;
  });
  
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);
  const { book, chapter } = useParams();
  const navigate = useNavigate();
  
  // Get the current translation
  const [currentTranslation, setCurrentTranslation] = useState<'asv' | 'web' | 'kjv'>(() => {
    return localStorage.getItem('selectedTranslation') as 'asv' | 'web' | 'kjv' || 'web';
  });
  
  // Update translation when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const translation = localStorage.getItem('selectedTranslation') as 'asv' | 'web' | 'kjv' || 'web';
      setCurrentTranslation(translation);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const { data: savedVerses } = useQuery({
    queryKey: ['userSavedVerses', selectedBook, selectedChapter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set<number>();

      const translation = localStorage.getItem('selectedTranslation') || 'web';
      console.log('Current translation:', translation);

      console.log('Fetching saved verses for:', {
        book: selectedBook,
        chapter: selectedChapter,
        translation,
        userId: user.id
      });

      const { data, error } = await supabase
        .from('user_saved_verses')
        .select('verse_selections, translation')
        .eq('book_name', selectedBook)
        .eq('chapter_number', selectedChapter)
        .eq('translation', translation)
        .eq('user_id', user.id);

      console.log('Supabase response:', { data, error });

      const savedVerseNumbers = new Set<number>();
      data?.forEach(verse => {
        console.log('Processing verse:', verse);
        verse.verse_selections.forEach((selection: VerseSelection) => {
          console.log('Processing selection:', selection);
          for (let i = selection.start; i <= selection.end; i++) {
            savedVerseNumbers.add(i);
          }
        });
      });

      console.log('Final saved verse numbers:', Array.from(savedVerseNumbers));
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

      // Get current translation
      const translation = localStorage.getItem('selectedTranslation') as 'asv' | 'web' | 'kjv' || 'web';
      console.log('Saving verse with translation:', translation);

      const result = await insertSavedVerse(
        user.id,
        selectedBook,
        selectedChapter,
        versesToSave,
        chapterData,
        translation
      );

      console.log('Save result:', result);

      if (!result) {
        throw new Error('Failed to save verse');
      }

      return { savedVerses: versesToSave };
    },
    
    onSuccess: (data) => {
      console.log('Save successful:', data);
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
      console.error('Save error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    console.log("Settings changed, saving to localStorage:", settings);
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

  // Add logging for when savedVerses changes
  useEffect(() => {
    console.log('savedVerses updated:', savedVerses ? Array.from(savedVerses) : null);
  }, [savedVerses]);

  // Test translation column
  useEffect(() => {
    testTranslationColumn().then(success => {
      if (success) {
        console.log('Translation column exists and is working correctly');
      } else {
        console.error('Translation column may not be set up correctly');
      }
    });
  }, []);

  // Add scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY < 10 || scrollDelta < 0) {
        setIsNavVisible(true);
      } 
      // Hide navigation when scrolling down
      else if (scrollDelta > 5) {
        setIsNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        <div 
          className={`${settings.fontFamily === 'serif' ? 'font-serif' : 'font-travelsans'} space-y-4`}
          data-font-family={settings.fontFamily}
        >
          {console.log("Rendering verses with fontFamily:", settings.fontFamily)}
          {chapterData.verses.map((verse, index) => {
            const isSelected = selectedVerses.has(verse.verse);
            const isSaved = savedVerses?.has(verse.verse);
            
            // Log when a verse is marked as saved
            if (isSaved) {
              console.log('Rendering saved verse:', {
                verse: verse.verse,
                reference: verse.reference,
                isSaved
              });
            }
            
            const selectedArray = Array.from(selectedVerses ?? []);
            const isLastSelected = isSelected && verse.verse === Math.max(...selectedArray, -Infinity);
            
            return (
              <span 
                key={`${verse.reference}-${index}`}
                data-verse={verse.verse}
                onClick={() => handleVerseClick(verse)}
                className={`
                  verse-container relative cursor-pointer
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
      {/* Mobile header with animation */}
      {isMobile === true && (
        <div className={`bg-dark-900/95 backdrop-blur-sm z-50 transition-transform duration-300 fixed top-0 left-0 right-0 border-b border-dark-800 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="px-4 py-4 border-b border-dark-800">
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
      )}
      
      {/* Desktop header without animation - starts below nav and sticks to top */}
      {isMobile === false && (
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm z-50 w-full">
          <div className="w-full">
            <div className="md:container md:mx-auto md:px-8 md:py-6 md:pt-8">
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
        </div>
      )}
      
      {/* Fallback header when isMobile is undefined during initial load */}
      {isMobile === undefined && (
        <div className="sticky top-0 bg-dark-900/95 backdrop-blur-sm z-50 w-full">
          <div className="w-full">
            <div className="container mx-auto px-4 py-4 md:px-8 md:py-3">
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
        </div>
      )}

      {/* Only add spacer for mobile view */}
      {isMobile === true && <div className="h-[4.5rem]" />}

      <ChapterNavigationButtons
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookChange={onBookChange}
        onChapterChange={onChapterChange}
      />
      
      <div className="flex flex-col h-full">
        <div className="md:container md:mx-auto px-4 py-4 md:p-8 flex-1 overflow-y-auto" ref={contentRef}>
          <div className="max-w-2xl mx-auto">
            {renderContent()}
          </div>
        </div>

        {/* Copyright message at the bottom */}
        <div className="md:container md:mx-auto px-4 md:px-8 pb-16 md:pb-8 pt-4">
          <div className="max-w-2xl mx-auto text-center text-[#777777] text-xs">
            {currentTranslation === 'web' ? (
              <>
                <p className="mb-1">World English Bible (WEB)</p>
                <p className="mb-1">The World English Bible is in the public domain.</p>
                <p className="mb-1"><a href="https://worldenglish.bible/" target="_blank" rel="noopener noreferrer" className="hover:underline">https://worldenglish.bible/</a></p>
              </>
            ) : currentTranslation === 'kjv' ? (
              <>
                <p className="mb-1">King James Version (KJV, 1611)</p>
                <p>Public domain, with Strong's numbers.</p>
              </>
            ) : (
              <>
                <p className="mb-1">American Standard Version (ASV, 1901)</p>
                <p>Public domain.</p>
              </>
            )}
          </div>
        </div>

        <SettingsPanel
          open={showSettings}
          onOpenChange={setShowSettings}
          settings={settings}
          onSettingsChange={(newSettings) => {
            console.log("Settings being updated from:", settings);
            console.log("New settings:", newSettings);
            setSettings(newSettings);
          }}
        />
      </div>
    </div>
  );
}

export default Reader;