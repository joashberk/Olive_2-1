import { motion, AnimatePresence } from 'framer-motion';
import { Pin, BookOpen, Copy, Share } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
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
  const [showAbove, setShowAbove] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: '50%' });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const { toast } = useToast();

  const updateToolbarPosition = () => {
    const verseElement = document.querySelector(`[data-verse="${selectedVerses[selectedVerses.length - 1]}"]`);
    const toolbar = toolbarRef.current;
    
    if (!verseElement || !toolbar) return;

    const verseRect = verseElement.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate if there's enough space above or below
    const spaceAbove = verseRect.top;
    const spaceBelow = viewportHeight - verseRect.bottom;
    
    // Determine vertical position
    let newShowAbove = spaceAbove > spaceBelow;
    let topPosition = 0;
    
    if (newShowAbove) {
      // Position above verse
      topPosition = Math.max(toolbarRect.height + 8, verseRect.top - toolbarRect.height - 8);
    } else {
      // Position below verse
      topPosition = Math.min(viewportHeight - toolbarRect.height - 8, verseRect.bottom + 8);
    }

    // Ensure horizontal centering while keeping within bounds
    const leftOffset = Math.min(
      Math.max(toolbarRect.width / 2, verseRect.left + verseRect.width / 2),
      viewportWidth - toolbarRect.width / 2
    );

    setShowAbove(newShowAbove);
    setPosition({
      top: topPosition,
      left: `${(leftOffset / viewportWidth) * 100}%`
    });
  };

  useEffect(() => {
    // Set up ResizeObserver to watch for toolbar size changes
    if (toolbarRef.current && !resizeObserver.current) {
      resizeObserver.current = new ResizeObserver(() => {
        // Use requestAnimationFrame to avoid too many updates
        requestAnimationFrame(updateToolbarPosition);
      });
      resizeObserver.current.observe(toolbarRef.current);
    }

    // Initial position update
    updateToolbarPosition();

    // Update position on window resize
    window.addEventListener('resize', updateToolbarPosition);

    return () => {
      window.removeEventListener('resize', updateToolbarPosition);
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
    };
  }, [selectedVerses]);

  // Update position when selected verses change
  useEffect(() => {
    updateToolbarPosition();
  }, [selectedVerses.length]);

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
          ref={toolbarRef}
          initial={{ opacity: 0, y: showAbove ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: showAbove ? -10 : 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
          }}
          className={`
            flex items-center gap-1 px-2 py-1.5 
            bg-dark-800/95 backdrop-blur-sm
            border border-dark-700 rounded-full shadow-lg
            z-[60]
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