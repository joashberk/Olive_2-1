import { motion, AnimatePresence } from 'framer-motion';
import { Pin, BookOpen, Copy, Share } from 'lucide-react';
import { useState } from 'react';
import { StudyDrawer } from './StudyDrawer';
import { useToast } from './useToast';
import { formatVerseReference } from '@/lib/utils';

interface VerseToolbarProps {
  selectedVerses: number[];
  bookName: string;
  chapter: number;
  verseText: string;
  onSave: () => void;
  onStudy: () => void;
  className?: string;
}

export function VerseToolbar({
  selectedVerses,
  bookName,
  chapter,
  verseText,
  onSave,
  onStudy,
  className = ''
}: VerseToolbarProps) {
  const [showStudyDrawer, setShowStudyDrawer] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      const reference = formatVerseReference(
        bookName, 
        chapter, 
        selectedVerses.map(v => ({ start: v }))
      );
      const textToCopy = `${reference}\n\n${verseText}`;
      await navigator.clipboard.writeText(textToCopy);
      
      toast({
        title: 'Copied to clipboard',
        description: 'Verse text and reference copied successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy verse to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    try {
      const reference = formatVerseReference(
        bookName, 
        chapter, 
        selectedVerses.map(v => ({ start: v }))
      );
      const shareText = `${reference}\n\n${verseText}`;
      
      if (navigator.share) {
        await navigator.share({
          title: reference,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: 'Copied to clipboard',
          description: 'Share text copied to clipboard',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Failed to share',
          description: 'Could not share verse',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={`
            absolute -top-12 left-1/2 -translate-x-1/2
            flex items-center gap-1 px-2 py-1.5 
            bg-dark-800/95 backdrop-blur-sm
            border border-dark-700 rounded-full shadow-lg
            ${className}
          `}
        >
          {/* Save Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="p-2 text-dark-300 hover:text-olive-300 rounded-full hover:bg-dark-700/50"
            aria-label="Save verse"
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Word Study Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStudy();
            }}
            className="p-2 text-dark-300 hover:text-olive-300 rounded-full hover:bg-dark-700/50"
            aria-label="Study verse"
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {/* Copy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-2 text-dark-300 hover:text-olive-300 rounded-full hover:bg-dark-700/50"
            aria-label="Copy verse"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="p-2 text-dark-300 hover:text-olive-300 rounded-full hover:bg-dark-700/50"
            aria-label="Share verse"
          >
            <Share className="w-4 h-4" />
          </button>

          {/* Verse Count */}
          {selectedVerses.length > 1 && (
            <div 
              className="flex items-center border-l border-dark-700 ml-1"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="px-2 text-sm font-sans text-dark-300 whitespace-nowrap">
                {selectedVerses.length} verses
              </span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <StudyDrawer
        isOpen={showStudyDrawer}
        onClose={() => setShowStudyDrawer(false)}
        verse={{
          reference: formatVerseReference(
            bookName, 
            chapter, 
            selectedVerses.map(v => ({ start: v }))
          ),
          text: verseText,
          words: []
        }}
      />
    </>
  );
}