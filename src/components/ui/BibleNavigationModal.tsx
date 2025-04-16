import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bibleBooks } from '@/data/bibleBooks';
import { ChevronRight, X, ArrowLeft } from 'lucide-react';

interface BibleNavigationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBook: string;
  selectedChapter: number;
  onBookChange: (bookId: string) => void;
  onChapterChange: (chapter: number) => void;
}

export function BibleNavigationModal({
  open,
  onOpenChange,
  selectedBook,
  selectedChapter,
  onBookChange,
  onChapterChange,
}: BibleNavigationModalProps) {
  const [step, setStep] = useState<'book_name' | 'chapter'>('book_name');
  const [selectedBookId, setSelectedBookId] = useState(selectedBook);
  const currentBook = bibleBooks.find(book => book.id === selectedBookId)!;

  // Reset to book selection when modal is closed
  useEffect(() => {
    if (!open) {
      setStep('book_name');
    }
  }, [open]);

  // Update selected book when prop changes
  useEffect(() => {
    setSelectedBookId(selectedBook);
  }, [selectedBook]);

  const handleBookSelect = (bookId: string) => {
    setSelectedBookId(bookId);
    onBookChange(bookId);
    setStep('chapter');
  };

  const handleChapterSelect = (chapter: number) => {
    onChapterChange(chapter);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep('book_name');
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <div className="fixed inset-0 z-[100] overflow-y-auto">
                <div className="min-h-full flex items-center justify-center p-4">
                  <motion.div
                    className="w-full max-w-xl sm:max-w-4xl bg-dark-900 rounded-xl shadow-2xl border border-dark-800"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-4 p-6 border-b border-dark-800">
                        {step === 'chapter' && (
                          <button
                            onClick={() => setStep('book_name')}
                            className="p-2 -ml-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-800/50"
                          >
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                        )}
                        <Dialog.Title className="text-xl font-serif text-dark-100 flex-1">
                          {step === 'book_name' ? 'Select Book' : `Select Chapter in ${currentBook.name}`}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button
                            className="p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-800/50"
                            aria-label="Close navigation"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4">
                        <AnimatePresence mode="wait" initial={false}>
                          {step === 'book_name' ? (
                            <motion.div
                              key="book-selection"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                              className="space-y-6 sm:space-y-8"
                            >
                              <div>
                                <h3 className="text-sm font-medium text-dark-400 mb-3">Old Testament</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {bibleBooks
                                    .filter(book => book.testament === 'old')
                                    .map(book => (
                                      <button
                                        key={book.id}
                                        onClick={() => handleBookSelect(book.id)}
                                        className={`
                                          flex items-center justify-between p-2.5 rounded-lg text-left transition-colors text-sm
                                          ${book.id === selectedBookId
                                            ? 'bg-olive-900/50 text-olive-300'
                                            : 'bg-dark-800 text-dark-200 hover:bg-dark-700'
                                          }
                                        `}
                                      >
                                        <span className="truncate">{book.name}</span>
                                        <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                                      </button>
                                    ))}
                                </div>
                              </div>

                              <div>
                                <h3 className="text-sm font-medium text-dark-400 mb-3">New Testament</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                  {bibleBooks
                                    .filter(book => book.testament === 'new')
                                    .map(book => (
                                      <button
                                        key={book.id}
                                        onClick={() => handleBookSelect(book.id)}
                                        className={`
                                          flex items-center justify-between p-2.5 rounded-lg text-left transition-colors text-sm
                                          ${book.id === selectedBookId
                                            ? 'bg-olive-900/50 text-olive-300'
                                            : 'bg-dark-800 text-dark-200 hover:bg-dark-700'
                                          }
                                        `}
                                      >
                                        <span className="truncate">{book.name}</span>
                                        <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="chapter-selection"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map(chapter => (
                                  <button
                                    key={chapter}
                                    onClick={() => handleChapterSelect(chapter)}
                                    className={`
                                      p-4 rounded-lg text-center transition-colors
                                      ${chapter === selectedChapter
                                        ? 'bg-olive-900/50 text-olive-300'
                                        : 'bg-dark-800 text-dark-200 hover:bg-dark-700'
                                      }
                                    `}
                                  >
                                    {chapter}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}