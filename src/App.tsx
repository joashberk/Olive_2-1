import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/Toaster';
import Navigation from '@/components/Navigation';
import BottomNav from '@/components/BottomNav';
import Reader from '@/components/Reader';
import SavedVerses from '@/components/SavedVerses';
import Notes from '@/components/Notes';
import Profile from '@/components/Profile';
import Welcome from '@/components/Welcome';
import { BibleLoader } from '@/components/BibleLoader';
import { FeedbackButton } from '@/components/ui/FeedbackModal';
import { useState, useEffect } from 'react';
import { bibleBooks } from '@/data/bibleBooks';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import { fetchChapter } from '@/services/bibleApi';
import { preloadDefaultImages } from '@/lib/preloadImages';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const pageVariants = {
  initial: { 
    opacity: 0,
    y: 10,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1]
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function ReaderContent() {
  const params = useParams();
  const [selectedBook, setSelectedBook] = useState(() => {
    // Try URL params first, then localStorage, then default
    return params.book || localStorage.getItem('lastOpenedBook') || bibleBooks[0].id;
  });
  
  const [selectedChapter, setSelectedChapter] = useState(() => {
    // Try URL params first, then localStorage, then default
    if (params.chapter) {
      return parseInt(params.chapter);
    }
    const savedChapter = localStorage.getItem('lastOpenedChapter');
    return savedChapter ? parseInt(savedChapter) : 1;
  });

  // Update localStorage when selection changes
  useEffect(() => {
    localStorage.setItem('lastOpenedBook', selectedBook);
    localStorage.setItem('lastOpenedChapter', selectedChapter.toString());
  }, [selectedBook, selectedChapter]);

  return (
    <ErrorBoundary>
      <Reader 
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        onBookChange={setSelectedBook}
        onChapterChange={setSelectedChapter}
      />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isBibleLoaded, setIsBibleLoaded] = useState(false);
  const location = useLocation();
  const isReaderRoute = location.pathname === '/' || location.pathname.match(/^\/[^/]+\/\d+$/);

  // Prefetch initial chapter and preload images
  useEffect(() => {
    if (isBibleLoaded) {
      preloadDefaultImages().catch(error => {
        console.warn('Failed to preload images:', error);
      });
    }
  }, [isBibleLoaded]);

  if (!isBibleLoaded) {
    return <BibleLoader onComplete={() => setIsBibleLoaded(true)} />;
  }

  return (
    <>
      <Welcome />
      <div className="min-h-screen bg-dark-900">
        <div className="sticky top-0 z-50 bg-dark-900 border-b border-dark-800">
          <Navigation />
        </div>
        <main className={`
          container mx-auto px-4 pb-24 md:pb-8
          ${isReaderRoute ? 'py-0' : 'pt-8'}
        `}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/" 
                element={
                  <PageTransition>
                    <ReaderContent />
                  </PageTransition>
                } 
              />
              <Route 
                path="/:book/:chapter" 
                element={
                  <PageTransition>
                    <ReaderContent />
                  </PageTransition>
                } 
              />
              <Route 
                path="/notes" 
                element={
                  <PageTransition>
                    <ErrorBoundary>
                      <Notes />
                    </ErrorBoundary>
                  </PageTransition>
                } 
              />
              <Route 
                path="/saved-verses" 
                element={
                  <PageTransition>
                    <ErrorBoundary>
                      <SavedVerses />
                    </ErrorBoundary>
                  </PageTransition>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PageTransition>
                    <ErrorBoundary>
                      <Profile />
                    </ErrorBoundary>
                  </PageTransition>
                } 
              />
            </Routes>
          </AnimatePresence>
        </main>
        <BottomNav />
        <FeedbackButton />
        <Toaster />
      </div>
    </>
  );
}

function App() {
  // Create QueryClient inside the component with proper configuration
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;