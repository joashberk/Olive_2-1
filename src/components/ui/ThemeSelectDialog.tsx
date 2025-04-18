import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Check, X } from 'lucide-react';
import { useState } from 'react';
import { GroupDialog } from './GroupDialog';
import { ConfirmDialog } from './ConfirmDialog';
import type { Theme } from '@/lib/types';

interface ThemeSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themes: Theme[];
  selectedThemes: string[];
  onSaveThemes: (themes: string[]) => void;
  onCreateTheme: (name: string, description?: string) => void;
  onDeleteTheme?: (themeId: string) => void;
}

export function ThemeSelectDialog({
  open,
  onOpenChange,
  themes,
  selectedThemes,
  onSaveThemes,
  onCreateTheme,
  onDeleteTheme
}: ThemeSelectDialogProps) {
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [newSelection, setNewSelection] = useState<Set<string>>(new Set(selectedThemes));
  const [themeToDelete, setThemeToDelete] = useState<Theme | null>(null);

  console.log('ThemeSelectDialog render:', {
    selectedThemes,
    newSelection: Array.from(newSelection),
    themes: themes.map(t => ({ id: t.id, name: t.name }))
  });

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70]" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 rounded-xl max-w-md w-full shadow-2xl border border-dark-700 z-[70]">
            <div className="p-6 border-b border-dark-700">
              <Dialog.Title className="text-2xl font-serif text-dark-100">
                Select Themes
              </Dialog.Title>
              <Dialog.Description className="text-dark-300 mt-2">
                Choose themes for this verse or create a new one.
              </Dialog.Description>
            </div>

            <div className="p-6">
              <div className="space-y-2 mb-6">
                {themes.length === 0 ? (
                  <div className="text-center py-8 text-dark-300">
                    <p className="mb-2">No themes created yet</p>
                    <p className="text-sm">Create your first theme to get started</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className="flex items-center gap-2"
                      >
                        <button
                          onClick={() => {
                            console.log('Theme clicked:', {
                              themeId: theme.id,
                              themeName: theme.name,
                              currentSelection: Array.from(newSelection)
                            });
                            const updated = new Set(newSelection);
                            if (updated.has(theme.id)) {
                              updated.delete(theme.id);
                            } else {
                              updated.add(theme.id);
                            }
                            console.log('Updated selection:', Array.from(updated));
                            setNewSelection(updated);
                          }}
                          className={`
                            group flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                            ${newSelection.has(theme.id)
                              ? 'bg-olive-900/30 text-olive-300 ring-1 ring-olive-500'
                              : 'text-dark-200 hover:bg-dark-800/50 hover:text-dark-100'
                            }
                          `}
                        >
                          <div className={`
                            flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center
                            ${newSelection.has(theme.id)
                              ? 'bg-olive-500 border-olive-500'
                              : 'border-dark-500 group-hover:border-dark-400'
                            }
                          `}>
                            {newSelection.has(theme.id) && (
                              <Check className="w-3.5 h-3.5 text-dark-900" />
                            )}
                          </div>
                          <span className="flex-1 text-left">{theme.name}</span>
                        </button>
                        {onDeleteTheme && (
                          <button
                            onClick={() => setThemeToDelete(theme)}
                            className="p-2 text-dark-400 hover:text-dark-300 rounded-lg hover:bg-dark-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setShowThemeForm(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-olive-300 hover:text-olive-200 hover:bg-dark-800/50 rounded-lg transition-colors mt-4"
                >
                  <div className="w-5 h-5 rounded-full border border-olive-500 flex items-center justify-center bg-dark-800/50">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span>Create New Theme</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2 text-dark-300 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Saving theme selection:', Array.from(newSelection));
                    onSaveThemes(Array.from(newSelection));
                    onOpenChange(false);
                  }}
                  className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>

            <Dialog.Close className="absolute top-4 right-4 p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-700">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <GroupDialog
        open={showThemeForm}
        onOpenChange={setShowThemeForm}
        title="New Theme"
        groupName=""
        onSave={async (name, description) => {
          onCreateTheme(name, description);
          // We'll let the parent component handle selecting the new theme
          // since we don't have access to the new theme ID here
          setShowThemeForm(false);
        }}
      />

      <ConfirmDialog
        open={themeToDelete !== null}
        onOpenChange={(open) => !open && setThemeToDelete(null)}
        title="Delete Theme"
        description={`Are you sure you want to delete the theme "${themeToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (themeToDelete && onDeleteTheme) {
            onDeleteTheme(themeToDelete.id);
            // Remove from selection if it was selected
            if (newSelection.has(themeToDelete.id)) {
              const updated = new Set(newSelection);
              updated.delete(themeToDelete.id);
              setNewSelection(updated);
            }
          }
        }}
      />
    </>
  );
} 