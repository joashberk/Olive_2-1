import { MoreHorizontal, Copy, Share, Pin, Tag, Plus } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { useToast } from './useToast';

interface Theme {
  id: string;
  name: string;
  user_id: string;
}

export interface SavedVerse {
  id: string;
  user_id: string;
  book_name: string;
  chapter_number: number;
  verse_selections: {
    start: number;
    end: number;
  }[];
  verse_text: string;
  display_reference: string;
  themes: string[];
  created_at: string;
  translation: 'asv' | 'web';
}

interface SavedVerseCardProps {
  verse: SavedVerse;
  themes: Theme[];
  onUnsave: () => void;
  onThemeClick: () => void;
  onThemeSelect: (themeId: string) => void;
}

export function SavedVerseCard({ verse, themes, onUnsave, onThemeClick, onThemeSelect }: SavedVerseCardProps) {
  const { toast } = useToast();
  const [showUnsaveDialog, setShowUnsaveDialog] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${verse.display_reference} ${verse.translation.toUpperCase()}: ${verse.verse_text}`);
      toast({
        title: "Copied to clipboard",
        description: "Verse has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${verse.display_reference} ${verse.translation.toUpperCase()}`,
          text: `${verse.display_reference} ${verse.translation.toUpperCase()}: ${verse.verse_text}`,
        });
      } else {
        await handleCopy();
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast({
          title: "Failed to share",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="group relative bg-dark-800 rounded-xl p-6 hover:bg-dark-750 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-serif text-dark-100 mb-3 flex items-center gap-2">
            {verse.display_reference}
            <span className="text-sm font-sans text-dark-300 bg-dark-700 px-2 py-0.5 rounded">
              {verse.translation.toUpperCase()}
            </span>
          </h3>
          <p className="text-dark-200 text-lg font-serif mb-3 line-clamp-2">
            {verse.verse_text}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {verse.themes.map((themeId) => {
              const theme = themes.find((t) => t.id === themeId);
              if (!theme) return null;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeSelect(theme.id)}
                  className="px-3 py-1.5 text-sm bg-olive-900/30 text-olive-300 rounded-lg hover:bg-olive-900/50 transition-colors flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {theme.name}
                </button>
              );
            })}
            
            <button
              onClick={onThemeClick}
              className="px-3 py-1.5 text-sm bg-dark-700/50 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add theme
            </button>
          </div>
        </div>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex-shrink-0 p-1.5 text-dark-400 hover:text-dark-300 rounded-lg hover:bg-dark-700 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[180px] bg-dark-700 rounded-lg p-1 shadow-xl"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-dark-100 hover:bg-dark-600 hover:text-dark-50 rounded-md cursor-pointer outline-none"
                onSelect={handleCopy}
              >
                <Copy className="w-4 h-4" />
                Copy
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-dark-100 hover:bg-dark-600 hover:text-dark-50 rounded-md cursor-pointer outline-none"
                onSelect={handleShare}
              >
                <Share className="w-4 h-4" />
                Share
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-dark-600 my-1" />

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600 hover:text-red-300 rounded-md cursor-pointer outline-none"
                onSelect={() => setShowUnsaveDialog(true)}
              >
                <Pin className="w-4 h-4" />
                Unsave
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <Dialog.Root open={showUnsaveDialog} onOpenChange={setShowUnsaveDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md">
            <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
              Unsave Verse
            </Dialog.Title>
            
            <p className="text-dark-200 mb-6">
              Are you sure you want to unsave {verse.display_reference}?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUnsaveDialog(false)}
                className="px-4 py-2 text-dark-200 hover:text-dark-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUnsave();
                  setShowUnsaveDialog(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Unsave
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}