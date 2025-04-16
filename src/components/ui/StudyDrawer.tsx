import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GreekLexiconEntry, HebrewLexiconEntry } from '@/lib/types';
import { formatStrongsNumber } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ParsedWord {
  text: string;
  strongsNumber?: string;
}

interface ParsedVerse {
  reference: string;
  text: string;
  words: ParsedWord[];
}

interface StudyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  verse: ParsedVerse | null;
}

export function StudyDrawer({ isOpen, onClose, verse }: StudyDrawerProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());

  const toggleWord = (strongsNumber: string) => {
    setExpandedWords(prev => {
      const next = new Set(prev);
      if (next.has(strongsNumber)) {
        next.delete(strongsNumber);
      } else {
        next.add(strongsNumber);
      }
      return next;
    });
  };

  // Query for Greek lexicon entries
  const { data: greekLexiconEntries } = useQuery({
    queryKey: ['greekLexicon', verse?.words.map(w => w.strongsNumber).join(',')],
    queryFn: async () => {
      const greekWords = verse?.words
        .filter(w => w.strongsNumber?.startsWith('G'))
        .map(w => w.strongsNumber!)
        .map(formatStrongsNumber) ?? [];

      if (greekWords.length === 0) return {};

      const { data, error } = await supabase
        .from('greek_lexicon')
        .select('*')
        .in('strongs_id', greekWords);

      if (error) throw error;

      return data.reduce((acc, entry) => {
        const originalId = entry.strongs_id.replace(/^([GH])0+/, '$1');
        acc[originalId] = entry;
        return acc;
      }, {} as Record<string, GreekLexiconEntry>);
    },
    enabled: isOpen && verse?.words.some(w => w.strongsNumber?.startsWith('G')),
  });

  // Query for Hebrew lexicon entries
  const { data: hebrewLexiconEntries } = useQuery({
    queryKey: ['hebrewLexicon', verse?.words.map(w => w.strongsNumber).join(',')],
    queryFn: async () => {
      const hebrewWords = verse?.words
        .filter(w => w.strongsNumber?.startsWith('H'))
        .map(w => w.strongsNumber!)
        .map(formatStrongsNumber) ?? [];

      if (hebrewWords.length === 0) return {};

      const { data, error } = await supabase
        .from('hebrew_lexicon')
        .select('*')
        .in('strongs_id', hebrewWords);

      if (error) throw error;

      return data.reduce((acc, entry) => {
        const originalId = entry.strongs_id.replace(/^([GH])0+/, '$1');
        acc[originalId] = entry;
        return acc;
      }, {} as Record<string, HebrewLexiconEntry>);
    },
    enabled: isOpen && verse?.words.some(w => w.strongsNumber?.startsWith('H')),
  });

  const renderLexiconInfo = (strongsNumber: string) => {
    const isGreek = strongsNumber.startsWith('G');
    const isHebrew = strongsNumber.startsWith('H');
    
    if (!isGreek && !isHebrew) return null;
    
    const lexiconEntry = isGreek 
      ? greekLexiconEntries?.[strongsNumber]
      : hebrewLexiconEntries?.[strongsNumber];
    
    if (!lexiconEntry) {
      return (
        <div className="mt-4 p-4 bg-dark-700 rounded-lg">
          <p className="text-sm text-dark-300 italic">
            Lexicon definition not available.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 p-4 bg-dark-700 rounded-lg">
        <h4 className="text-sm font-medium text-olive-300 mb-2">
          {isGreek ? 'Greek' : 'Hebrew'} Lexicon Entry
        </h4>
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-serif text-dark-100">
                {lexiconEntry.original_word}
              </span>
              {lexiconEntry.transliteration && (
                <span className="text-sm italic text-dark-300">
                  ({lexiconEntry.transliteration})
                </span>
              )}
            </div>
            {lexiconEntry.morph && (
              <span className="text-xs bg-dark-600 text-olive-300 px-2 py-0.5 rounded w-fit">
                {lexiconEntry.morph}
              </span>
            )}
          </div>
          <div>
            {lexiconEntry.gloss && (
              <p className="text-sm font-medium text-dark-200">
                {lexiconEntry.gloss}
              </p>
            )}
            {lexiconEntry.definition && (
              <p className="text-sm text-dark-300 mt-1">
                {lexiconEntry.definition}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <Dialog.Overlay 
                asChild
                forceMount
              >
                <motion.div
                  className="fixed inset-0 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1]
                  }}
                >
                  {/* Layered backdrop for depth */}
                  <div className="absolute inset-0 bg-black/40" />
                  <div 
                    className="absolute inset-0 backdrop-blur-[3px]"
                    style={{
                      backdropFilter: 'blur(3px)',
                      WebkitBackdropFilter: 'blur(3px)'
                    }}
                  />
                </motion.div>
              </Dialog.Overlay>

              <Dialog.Content
                asChild
                forceMount
              >
                <motion.div
                  className={`
                    fixed bg-dark-800 shadow-xl z-50
                    ${isMobile 
                       
                      ? 'bottom-0 left-0 right-0 rounded-t-xl max-h-[80vh]'
                      : 'top-0 right-0 bottom-0 w-[600px] border-l border-dark-700'
                    }
                  `}
                  initial={isMobile ? { y: '100%' } : { x: '100%' }}
                  animate={isMobile ? { y: 0 } : { x: 0 }}
                  exit={isMobile ? { y: '100%' } : { x: '100%' }}
                  transition={{ 
                    type: 'spring',
                    damping: 30,
                    stiffness: 300,
                    mass: 0.8
                  }}
                >
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex justify-between items-start p-6 border-b border-dark-700">
                      <Dialog.Title className="text-xl font-semibold text-olive-300">
                        Word Study
                      </Dialog.Title>
                      <Dialog.Close asChild>
                        <button
                          className="p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-700"
                          aria-label="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      {verse && (
                        <div className="divide-y divide-dark-700">
                          <div className="p-6">
                            <h3 className="text-sm font-medium text-dark-300 mb-2">
                              {verse.reference}
                            </h3>
                            <p className="text-lg font-serif leading-relaxed text-dark-100">
                              {verse.text}
                            </p>
                          </div>

                          <div className="p-6">
                            <h3 className="text-sm font-medium text-dark-300 mb-4">
                              Word-by-Word Analysis
                            </h3>
                            <div className="space-y-4">
                              {verse.words.map((word, index) => {
                                if (!word.strongsNumber) return null;
                                
                                const isExpanded = expandedWords.has(word.strongsNumber);
                                const lexiconEntry = word.strongsNumber.startsWith('G')
                                  ? greekLexiconEntries?.[word.strongsNumber]
                                  : hebrewLexiconEntries?.[word.strongsNumber];
                                
                                return (
                                  <div 
                                    key={`${word.strongsNumber}-${index}`}
                                    className="bg-dark-700/50 rounded-lg transition-colors hover:bg-dark-700"
                                  >
                                    <button
                                      onClick={() => toggleWord(word.strongsNumber!)}
                                      className="w-full text-left p-4 flex items-start justify-between"
                                    >
                                      <div className="flex-1">
                                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                          <span className="text-lg font-semibold text-dark-100">
                                            {word.text}
                                          </span>
                                          {lexiconEntry?.transliteration && (
                                            <span className="text-sm italic text-dark-300">
                                              ({lexiconEntry.transliteration})
                                            </span>
                                          )}
                                          <span className="text-xs px-2 py-0.5 bg-dark-600 text-olive-300 rounded-full">
                                            {word.strongsNumber}
                                          </span>
                                        </div>
                                      </div>
                                      {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-dark-400" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5 text-dark-400" />
                                      )}
                                    </button>
                                    
                                    {isExpanded && (
                                      <div className="px-4 pb-4">
                                        {renderLexiconInfo(word.strongsNumber)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}