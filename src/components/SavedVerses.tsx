import { AArrowDown as Add, MoreHorizontal, X, Search, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/useToast';
import * as Dialog from '@radix-ui/react-dialog';
import { User } from '@supabase/supabase-js';
import { useDebounce } from '@/hooks/useDebounce';
import { migrateSavedVerses, migrateThemeData } from '@/lib/migrations';
import { GroupDialog } from '@/components/ui/GroupDialog';
import { AuthButton } from '@/components/ui/AuthButton';
import { SavedVerseCard } from '@/components/ui/SavedVerseCard';
import { ThemeSelectDialog } from '@/components/ui/ThemeSelectDialog';
import type { SavedVerse, Theme, VerseSelection } from '@/lib/types';

function SavedVerses() {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [verseToUnsave, setVerseToUnsave] = useState<SavedVerse | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [verseForThemes, setVerseForThemes] = useState<SavedVerse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Run both migrations
        Promise.all([
          migrateSavedVerses(),
          migrateThemeData()
        ]).catch(console.error);
      }
    });
  }, []);

  // Fetch themes
  const { data: themes, isLoading: themesLoading, error: themesError } = useQuery({
    queryKey: ['themes'],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching themes for user:', user.id);
      
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching themes:', error);
        throw error;
      }

      console.log('Fetched themes:', data);
      return data as Theme[];
    },
    enabled: !!user,
  });

  // Fetch saved verses
  const { data: savedVerses, isLoading: isLoadingVerses, error: versesError } = useQuery({
    queryKey: ['savedVerses', selectedTheme, debouncedSearch],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      console.log('Fetching verses with filters:', {
        theme: selectedTheme,
        search: debouncedSearch,
        userId: user.id
      });

      let query = supabase
        .from('user_saved_verses')
        .select(`
          id,
          user_id,
          book_name,
          chapter_number,
          verse_selections,
          verse_text,
          display_reference,
          themes,
          translation,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedTheme) {
        console.log('Applying theme filter:', selectedTheme);
        query = query.contains('themes', [selectedTheme]);
      }

      if (debouncedSearch) {
        console.log('Applying search filter:', debouncedSearch);
        query = query.or(`display_reference.ilike.%${debouncedSearch}%,verse_text.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching saved verses:', error);
        throw error;
      }

      // Ensure themes is always an array
      const versesWithThemes = data?.map(verse => ({
        ...verse,
        themes: verse.themes || []
      })) || [];
      
      console.log('Fetched verses with themes:', versesWithThemes.map(v => ({
        ref: v.display_reference,
        themes: v.themes
      })));

      return versesWithThemes as SavedVerse[];
    },
    enabled: !!user,
  });

  // Add debug logging for themes and verses
  useEffect(() => {
    if (themes && savedVerses) {
      console.log('Current state:', {
        themes: themes.map(t => ({ id: t.id, name: t.name })),
        verses: savedVerses.map(v => ({
          ref: v.display_reference,
          themeIds: v.themes,
          matchingThemes: v.themes
            ?.map(themeId => themes.find(t => t.id === themeId))
            .filter((t): t is Theme => t !== undefined)
            .map(t => t.name)
        }))
      });
    }
  }, [themes, savedVerses]);

  // Theme mutations
  const createThemeMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('themes')
        .insert([{ 
          user_id: user.id,
          name,
          description
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setShowThemeForm(false);
      toast({
        title: 'Theme created',
        description: 'Your theme has been created successfully.',
      });
    },
  });

  const updateThemeMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { error } = await supabase
        .from('themes')
        .update({ name, description })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      setEditingTheme(null);
      toast({
        title: 'Theme updated',
        description: 'Your theme has been updated successfully.',
      });
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase
        .from('themes')
        .delete()
        .eq('id', themeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      toast({
        title: 'Theme deleted',
        description: 'The theme has been deleted successfully.',
      });
    },
  });

  const unsaveVerseMutation = useMutation({
    mutationFn: async (verseId: string) => {
      const { error } = await supabase
        .from('user_saved_verses')
        .delete()
        .eq('id', verseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedVerses'] });
      queryClient.invalidateQueries({ queryKey: ['userSavedVerses'] });
      toast({
        title: 'Verse unsaved',
        description: 'The verse has been removed from your saved verses.',
      });
    },
  });

  // Update verse themes
  const updateVerseThemesMutation = useMutation({
    mutationFn: async ({ verseId, themes }: { verseId: string; themes: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Updating verse themes in mutation:', {
        verseId,
        themeIds: themes
      });

      // First get the current verse data
      const { data: currentVerse, error: fetchError } = await supabase
        .from('user_saved_verses')
        .select(`
          id,
          themes
        `)
        .eq('id', verseId)
        .single();

      if (fetchError) {
        console.error('Error fetching current verse:', fetchError);
        throw fetchError;
      }

      console.log('Current verse data:', currentVerse);

      // Update with new theme IDs
      const { data, error } = await supabase
        .from('user_saved_verses')
        .update({ 
          themes: themes, // These should be theme IDs
          updated_at: new Date().toISOString()
        })
        .eq('id', verseId)
        .select(`
          id,
          book_name,
          chapter_number,
          verse_selections,
          verse_text,
          display_reference,
          themes,
          translation,
          created_at
        `)
        .single();

      if (error) {
        console.error('Error in updateVerseThemesMutation:', error);
        throw error;
      }

      console.log('Updated verse data:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Theme update successful:', data);
      queryClient.invalidateQueries({ queryKey: ['savedVerses'] });
      queryClient.invalidateQueries({ queryKey: ['themes'] });
      
      toast({
        title: 'Themes updated',
        description: 'The verse themes have been updated successfully.',
      });
    },
    onError: (error) => {
      console.error('Theme update error:', error);
      toast({
        title: 'Error updating themes',
        description: 'Failed to update verse themes. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle theme selection from verse cards
  const handleThemeSelect = (themeId: string) => {
    console.log('Theme selected:', {
      themeId,
      currentSelectedTheme: selectedTheme,
      availableThemes: themes?.map(t => ({ id: t.id, name: t.name }))
    });

    setSelectedTheme(prevTheme => {
      const newTheme = prevTheme === themeId ? null : themeId;
      console.log('Setting new selected theme filter:', newTheme);
      return newTheme;
    });
  };

  // Handle updating verse themes
  const handleUpdateVerseThemes = async (verse: SavedVerse, selectedThemes: string[]) => {
    try {
      // Ensure we have the themes data
      if (!themes) {
        console.error('No themes data available');
        return;
      }

      console.log('Theme update requested:', {
        verse: {
          id: verse.id,
          reference: verse.display_reference,
          currentThemes: verse.themes
        },
        selectedThemes,
        allAvailableThemes: themes.map(t => ({
          id: t.id,
          name: t.name
        }))
      });

      // Validate selected themes exist
      const validThemes = selectedThemes.every(themeId => 
        themes.some(t => t.id === themeId)
      );

      if (!validThemes) {
        console.error('Invalid theme selection:', {
          selectedThemes,
          availableThemes: themes.map(t => t.id)
        });
        toast({
          title: 'Error',
          description: 'One or more selected themes are invalid.',
          variant: 'destructive'
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_saved_verses')
        .update({ 
          themes: selectedThemes,
          updated_at: new Date().toISOString()
        })
        .eq('id', verse.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating verse themes:', error);
        throw error;
      }

      console.log('Theme update successful:', {
        verseId: verse.id,
        oldThemes: verse.themes,
        newThemes: data.themes,
        response: data
      });

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['savedVerses'] });
      
      // Close the theme selection dialog
      setVerseForThemes(null);

      toast({
        title: 'Themes updated',
        description: 'Verse themes have been updated successfully.'
      });
    } catch (error) {
      console.error('Error updating verse themes:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verse themes. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Add debug logging for theme selection dialog
  const handleThemeDialogOpen = (verse: SavedVerse) => {
    console.log('Opening theme selection dialog:', {
      verse: {
        id: verse.id,
        reference: verse.display_reference,
        currentThemes: verse.themes
      },
      availableThemes: themes?.map(t => ({
        id: t.id,
        name: t.name
      }))
    });
    setVerseForThemes(verse);
  };

  // Only show error if both queries have failed
  const hasError = themesError && versesError;
  
  // Only show loading on initial load, not during refetches
  const isInitialLoading = !savedVerses && (themesLoading || isLoadingVerses);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-start mt-8 px-4">
        <img 
          src="/jar/Saved-Pin-01-B.png" 
          alt="Saved pin"
          className="w-[200px] mb-6 opacity-85"
        />
        <h2 className="text-2xl font-serif italic text-dark-100">Saved Verses</h2>
        <p className="text-dark-200 mb-6 text-center max-w-[24rem]">
          Sign in to access your saved verses.
        </p>
        <AuthButton className="md:w-auto w-full justify-center" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-start mt-8 px-4">
        <h2 className="text-2xl font-serif italic text-dark-100 mb-4">Error Loading Saved Verses</h2>
        <p className="text-dark-200 text-center max-w-[24rem]">
          {themesError?.message || versesError?.message || 'An error occurred while loading your saved verses.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-start mt-8 px-4">
        <div className="animate-pulse">
          <h2 className="text-2xl font-serif italic text-dark-100 mb-4">Loading your verses...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 md:top-[4rem] inset-x-0 bottom-0 flex flex-col bg-dark-900">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row max-w-[100rem] mx-auto">
          <div className="hidden md:flex flex-col w-64 border-r border-dark-800">
            <div className="p-6 md:pt-12">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-serif italic text-dark-100">Themes</h2>
                <button
                  onClick={() => setShowThemeForm(true)}
                  className="p-2 text-olive-300 hover:text-olive-200 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedTheme(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                    !selectedTheme
                      ? 'bg-dark-800 text-olive-300'
                      : 'text-dark-200 hover:bg-dark-800/50'
                  }`}
                >
                  All Verses
                </button>

                {themes?.map((theme) => (
                  <div
                    key={theme.id}
                    className={`
                      group flex items-center justify-between px-4 py-3 rounded-lg transition-colors
                      ${selectedTheme === theme.id
                        ? 'bg-dark-800 text-olive-300'
                        : 'text-dark-200 hover:bg-dark-800/50'
                      }
                    `}
                  >
                    <button
                      onClick={() => setSelectedTheme(theme.id)}
                      className="flex-1 text-left text-sm"
                    >
                      {theme.name}
                    </button>
                    <button
                      onClick={() => setEditingTheme(theme)}
                      className="p-1 text-dark-400 hover:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 md:p-8 md:pt-12 border-b border-dark-800">
              <div className="md:hidden mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-2xl font-serif italic text-dark-100">Themes</h2>
                  <button
                    onClick={() => setShowThemeForm(true)}
                    className="p-2 text-olive-300 hover:text-olive-200 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-2 min-w-min pb-2">
                    <button
                      onClick={() => setSelectedTheme(null)}
                      className={`shrink-0 px-4 py-2 rounded-lg transition-colors text-sm ${
                        !selectedTheme
                          ? 'bg-dark-800 text-olive-300'
                          : 'bg-dark-800/50 text-dark-200 hover:bg-dark-800'
                      }`}
                    >
                      All Verses
                    </button>
                    {themes?.map((theme) => (
                      <div
                        key={theme.id}
                        className={`
                          shrink-0 flex items-center gap-2 transition-colors
                          ${selectedTheme === theme.id
                            ? 'bg-dark-800 text-olive-300'
                            : 'bg-dark-800/50 text-dark-200 hover:bg-dark-800'
                          }
                          rounded-lg
                        `}
                      >
                        <div className="pl-2 pr-0 py-1.5">
                          <button
                            onClick={() => setSelectedTheme(theme.id)}
                            className={`text-sm max-w-[12rem] overflow-hidden text-ellipsis whitespace-nowrap ${
                              selectedTheme === theme.id
                                ? 'text-olive-300'
                                : 'text-dark-200 hover:text-dark-100'
                            }`}
                          >
                            {theme.name}
                          </button>
                        </div>
                        <button
                          onClick={() => setEditingTheme(theme)}
                          className="pl-0 pr-1.5 py-1.5 text-dark-400 hover:text-dark-300"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved verses..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 p-4 md:p-8">
                {savedVerses?.map((verse) => {
                  console.log('Rendering verse card:', {
                    ref: verse.display_reference,
                    themes: verse.themes,
                    availableThemes: themes
                  });
                  return (
                    <SavedVerseCard
                      key={verse.id}
                      verse={verse}
                      themes={themes || []}
                      onUnsave={() => unsaveVerseMutation.mutate(verse.id)}
                      onThemeClick={() => handleThemeDialogOpen(verse)}
                      onThemeSelect={handleThemeSelect}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog.Root open={!!verseToUnsave} onOpenChange={(open) => !open && setVerseToUnsave(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg max-w-md w-full">
            <Dialog.Title className="text-xl font-serif text-dark-100 mb-2">
              Unsave Verse
            </Dialog.Title>
            <Dialog.Description className="text-dark-300 mb-6">
              Are you sure you want to remove this verse from your saved verses?
            </Dialog.Description>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setVerseToUnsave(null)}
                className="px-4 py-2 text-dark-300 hover:text-dark-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (verseToUnsave) {
                    unsaveVerseMutation.mutate(verseToUnsave.id);
                    setVerseToUnsave(null);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Unsave
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <GroupDialog
        open={showThemeForm}
        onOpenChange={setShowThemeForm}
        title="New Theme"
        groupName=""
        onSave={(name, description) => {
          createThemeMutation.mutate({ name, description });
        }}
      />

      {editingTheme && (
        <GroupDialog
          open={!!editingTheme}
          onOpenChange={(open) => !open && setEditingTheme(null)}
          title="Edit Theme"
          groupName={editingTheme.name}
          description={editingTheme.description || ''}
          onSave={(name, description) => {
            updateThemeMutation.mutate({
              id: editingTheme.id,
              name,
              description
            });
          }}
          onDelete={() => {
            deleteThemeMutation.mutate(editingTheme.id);
          }}
          deleteMessage="Are you sure you want to delete this theme? Verses in this theme will be untagged but not deleted."
        />
      )}

      {/* Add ThemeSelectDialog */}
      {verseForThemes && (
        <ThemeSelectDialog
          open={!!verseForThemes}
          onOpenChange={(open) => !open && setVerseForThemes(null)}
          themes={themes || []}
          selectedThemes={verseForThemes.themes || []}
          onSaveThemes={(themes) => {
            handleUpdateVerseThemes(verseForThemes, themes);
          }}
          onCreateTheme={(name, description) => {
            createThemeMutation.mutate({ name, description });
          }}
          onDeleteTheme={(themeId) => {
            deleteThemeMutation.mutate(themeId);
          }}
        />
      )}
    </div>
  );
}

export default SavedVerses;