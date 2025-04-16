import { MoreHorizontal, Copy, Share, Trash2, Tag, Plus } from 'lucide-react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useToast } from './useToast';
import type { Theme } from '@/lib/types';

interface SavedVerse {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
  display_reference: string;
  themes?: string[];
  created_at?: string;
}

interface SavedVerseCardProps {
  verse: SavedVerse;
  onUnsave: () => void;
  onThemeClick: () => void;
}

export function SavedVerseCard({ verse, onUnsave, onThemeClick }: SavedVerseCardProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${verse.display_reference}: ${verse.verse_text}`);
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
          title: verse.display_reference,
          text: `${verse.display_reference}: ${verse.verse_text}`,
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
          <h3 className="text-xl font-serif text-dark-100 mb-3">
            {verse.display_reference}
          </h3>
          <p className="text-dark-200 text-lg font-serif mb-3 line-clamp-2">
            {verse.verse_text}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {verse.themes?.map((theme: string) => (
              <button
                key={theme}
                onClick={onThemeClick}
                className="px-3 py-1.5 text-sm bg-olive-900/30 text-olive-300 rounded-lg hover:bg-olive-900/50 transition-colors flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5" />
                {theme}
              </button>
            ))}
            
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
                onSelect={onUnsave}
              >
                <Trash2 className="w-4 h-4" />
                Unsave
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}