import { AArrowDown as Add, MoreVertical, Edit, Delete, X, Search, Undo2, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/useToast';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowBigUp as ArrowBack } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useDebounce } from '@/hooks/useDebounce';
import { GroupDialog } from '@/components/ui/GroupDialog';
import { AuthButton } from '@/components/ui/AuthButton';
import { NotebookSelectDialog } from '@/components/ui/NotebookSelectDialog';
import { EditorToolbar } from './ui/EditorToolbar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { stripHtmlTags } from '@/lib/utils';

interface Note {
  id: string;
  title: string | null;
  content: string;
  notebook_id: string | null;
  created_at: string;
  updated_at: string;
  notebooks?: {
    name: string;
  } | null;
}

interface Notebook {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface NoteFormData {
  id: string;
  title: string;
  content: string;
  notebook_id: string | null;
}

function Notes() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [showNotebookForm, setShowNotebookForm] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchInput, 300);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNotebookSelect, setShowNotebookSelect] = useState(false);
  const [selectedNoteForNotebook, setSelectedNoteForNotebook] = useState<Note | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [localNotes, setLocalNotes] = useState<(Note & { notebooks: Notebook | null })[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [debouncedSearch]);

  const { data: notebooks } = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('notebooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notebook[];
    },
    enabled: !!user,
  });

  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes', selectedNotebook, debouncedSearch],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('notes')
        .select('*, notebooks(name)')
        .order('created_at', { ascending: false });

      if (selectedNotebook) {
        query = query.eq('notebook_id', selectedNotebook);
      }

      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,content.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (Note & { notebooks: Notebook | null })[];
    },
    enabled: !!user,
  });

  const createNotebookMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('notebooks')
        .insert([{ 
          user_id: user.id,
          name
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setShowNotebookForm(false);
      setNewNotebookName('');
      toast({
        title: 'Notebook created',
        description: 'Your notebook has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating notebook',
        description: error instanceof Error ? error.message : 'Failed to create notebook',
        variant: 'destructive',
      });
    },
  });

  const updateNotebookMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('notebooks')
        .update({ name })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setEditingNotebook(null);
      toast({
        title: 'Notebook updated',
        description: 'Your notebook has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating notebook',
        description: error instanceof Error ? error.message : 'Failed to update notebook',
        variant: 'destructive',
      });
    },
  });

  const deleteNotebookMutation = useMutation({
    mutationFn: async (notebookId: string) => {
      const { error } = await supabase
        .from('notebooks')
        .delete()
        .eq('id', notebookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      setEditingNotebook(null);
      setSelectedNotebook(null);
      toast({
        title: 'Notebook deleted',
        description: 'Your notebook has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting notebook',
        description: error instanceof Error ? error.message : 'Failed to delete notebook',
        variant: 'destructive',
      });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (noteData: NoteFormData) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('notes')
        .insert([{ 
          user_id: user.id,
          title: noteData.title || null,
          content: noteData.content,
          notebook_id: noteData.notebook_id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsWriting(false);
      toast({
        title: 'Note created',
        description: 'Your note has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating note',
        description: error instanceof Error ? error.message : 'Failed to create note',
        variant: 'destructive',
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (note: Omit<NoteFormData, 'title'> & { title: string | null }) => {
      const { data, error } = await supabase
        .from('notes')
        .update({
          title: note.title,
          content: note.content,
          notebook_id: note.notebook_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', note.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: 'Note deleted',
        description: 'Your note has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting note',
        description: error instanceof Error ? error.message : 'Failed to delete note',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const noteData = {
      id: editingNote?.id || '',
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      notebook_id: formData.get('notebook_id') as string || null
    };

    if (!noteData.content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some content for your note.',
        variant: 'destructive',
      });
      return;
    }

    if (editingNote) {
      updateNoteMutation.mutate(noteData);
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handleDelete = async (noteId: string) => {
    const note = notesData?.find(n => n.id === noteId);
    if (note) {
      setNoteToDelete(note);
    }
  };

  const handleNotebookSelect = async (notebookId: string | null) => {
    console.log('handleNotebookSelect called:', {
      notebookId,
      selectedNoteForNotebook,
      isWriting,
      editingNote,
      notebooks
    });

    if (!selectedNoteForNotebook) {
      console.log('No selectedNoteForNotebook, returning');
      return;
    }

    try {
      console.log('Attempting to update note with notebook:', {
        noteId: selectedNoteForNotebook.id,
        newNotebookId: notebookId
      });

      const { error } = await supabase
        .from('notes')
        .update({ notebook_id: notebookId })
        .eq('id', selectedNoteForNotebook.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Supabase update successful');

      // Update the editingNote if we're in the editor
      if (isWriting && editingNote && selectedNoteForNotebook.id === editingNote.id) {
        console.log('Updating editingNote:', {
          isWriting,
          editingNoteId: editingNote.id,
          selectedNoteId: selectedNoteForNotebook.id
        });

        const selectedNotebook = notebooks?.find(n => n.id === notebookId);
        console.log('Found selected notebook:', selectedNotebook);

        const updatedNote = {
          ...editingNote,
          notebook_id: notebookId,
          notebooks: selectedNotebook ? { name: selectedNotebook.name } : null
        };
        console.log('Setting editingNote to:', updatedNote);
        setEditingNote(updatedNote);
      }

      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setShowNotebookSelect(false);
      setSelectedNoteForNotebook(null);

      console.log('Final state updates complete:', {
        showNotebookSelect: false,
        selectedNoteForNotebook: null,
        editingNote: editingNote
      });

      toast({
        title: 'Notebook updated',
        description: 'The note has been moved to the selected notebook.',
      });
    } catch (error) {
      console.error('Error in handleNotebookSelect:', error);
      toast({
        title: 'Error updating notebook',
        description: error instanceof Error ? error.message : 'Failed to update notebook',
        variant: 'destructive',
      });
    }
  };

  const debouncedNote = useDebounce(editingNote, 1000);

  useEffect(() => {
    if (debouncedNote && isWriting) {
      console.log('Attempting autosave:', debouncedNote);
      setIsSaving(true);
      updateNoteMutation.mutate({
        id: debouncedNote.id,
        title: debouncedNote.title,
        content: debouncedNote.content,
        notebook_id: debouncedNote.notebook_id
      }, {
        onSettled: () => {
          setIsSaving(false);
        }
      });
    }
  }, [debouncedNote, isWriting]);

  const handleNoteChange = (content: string) => {
    if (editingNote) {
      const updatedNote = { ...editingNote, content };
      setEditingNote(updatedNote);
      console.log('Note content updated:', updatedNote);
    }
  };

  const handleSaveNote = () => {
    if (editingNote) {
      updateNoteMutation.mutate({
        id: editingNote.id,
        title: editingNote.title,
        content: editingNote.content,
        notebook_id: editingNote.notebook_id
      });
    }
  };

  useEffect(() => {
    console.log('Current editingNote state:', editingNote);
  }, [editingNote]);

  const handleNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: null,
      content: '',
      notebook_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notebooks: null
    };
    setEditingNote(newNote);
    setIsWriting(true);
    console.log('Created new note:', newNote);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-start mt-8 px-4">
        <img 
          src="/jar/Note-Paper-Pen-01-B.png" 
          alt="Write"
          className="w-[200px] mb-6 opacity-85"
        />
        <h2 className="text-2xl font-serif italic text-dark-100">Write</h2>
        <p className="text-dark-200 mb-6 text-center max-w-[24rem] [text-wrap:balance]">
          Sign in to access your notes.
        </p>
        <AuthButton className="md:w-auto w-full justify-center" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-pulse text-olive-300 text-lg">
          Loading notes...
        </div>
      </div>
    );
  }

  if (isWriting || editingNote) {
    return (
      <div className="fixed inset-0 bg-dark-900 z-50">
        {/* Top Navigation */}
        <div className="border-b border-dark-800">
          {/* Mobile: Stacked rows, Desktop: Single row */}
          <div className="md:h-[4rem] flex md:items-center px-4 md:px-8">
            <div className="w-full max-w-4xl mx-auto">
              {/* Upper Row (mobile) / Left Section (desktop) */}
              <div className="flex flex-col md:flex-row md:items-center w-full gap-4">
                <div className="h-14 md:h-auto flex items-center gap-4 border-b md:border-b-0 border-dark-800">
                  <button
                    onClick={() => {
                      setIsWriting(false);
                      setEditingNote(null);
                    }}
                    className="p-2 text-dark-400 hover:text-dark-300 rounded-lg hover:bg-dark-800/50"
                  >
                    <ArrowBack className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-dark-400">
                      {lastSaved ? `Last edited ${formatDistanceToNow(lastSaved, { addSuffix: true })}` : 'Not saved yet'}
                    </span>
                    {isSaving && (
                      <span className="text-sm text-dark-400">Saving...</span>
                    )}
                  </div>
                </div>

                {/* Lower Row (mobile) / Right Section (desktop) */}
                <div className="h-14 md:h-auto md:ml-auto flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const editorElement = document.querySelector('.ProseMirror');
                        if (editorElement instanceof HTMLElement) {
                          const editor = (editorElement as any)._tiptapEditor;
                          if (editor && editor.can().undo()) {
                            editor.commands.undo();
                          }
                        }
                      }}
                      className="p-2 text-dark-400 hover:text-dark-300 rounded-lg hover:bg-dark-800/50"
                      title="Undo"
                    >
                      <Undo2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const editorElement = document.querySelector('.ProseMirror');
                        if (editorElement instanceof HTMLElement) {
                          const editor = (editorElement as any)._tiptapEditor;
                          if (editor && editor.can().redo()) {
                            editor.commands.redo();
                          }
                        }
                      }}
                      className="p-2 text-dark-400 hover:text-dark-300 rounded-lg hover:bg-dark-800/50"
                      title="Redo"
                    >
                      <Undo2 className="w-5 h-5 scale-x-[-1]" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNoteToDelete(editingNote)}
                      className="px-3 py-1.5 text-sm bg-dark-700/50 text-dark-300 rounded-lg hover:bg-red-900/30 hover:text-red-400 transition-colors flex items-center gap-1.5"
                      title="Delete note"
                    >
                      <Delete className="w-3.5 h-3.5" />
                      Delete
                    </button>

                    <div className="hidden md:block w-px h-5 bg-dark-700" />

                    <div className="flex-1 flex items-center justify-end">
                      {editingNote?.notebooks ? (
                        <button
                          onClick={() => {
                            console.log('Notebook button clicked (has notebook):', {
                              editingNote,
                              currentNotebook: editingNote.notebooks
                            });
                            setSelectedNoteForNotebook(editingNote);
                            setShowNotebookSelect(true);
                            console.log('State after click:', {
                              selectedNoteForNotebook: editingNote,
                              showNotebookSelect: true,
                              isWriting
                            });
                          }}
                          className="px-3 py-1.5 text-sm bg-olive-900/30 text-olive-300 rounded-lg hover:bg-olive-900/50 transition-colors"
                        >
                          {editingNote.notebooks.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            console.log('Notebook button clicked (no notebook):', {
                              editingNote
                            });
                            setSelectedNoteForNotebook(editingNote);
                            setShowNotebookSelect(true);
                            console.log('State after click:', {
                              selectedNoteForNotebook: editingNote,
                              showNotebookSelect: true,
                              isWriting
                            });
                          }}
                          className="px-3 py-1.5 text-sm bg-dark-800 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors"
                        >
                          Add notebook
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
            <div className="prose prose-invert max-w-none">
              <textarea
                value={editingNote?.title ?? ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  if (editingNote) {
                    const updatedNote = { 
                      ...editingNote, 
                      title: e.target.value || null,
                      updated_at: new Date().toISOString()
                    };
                    setEditingNote(updatedNote);
                  }
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const editorElement = document.querySelector('.ProseMirror');
                    if (editorElement instanceof HTMLElement) {
                      editorElement.focus();
                      const selection = window.getSelection();
                      const range = document.createRange();
                      const firstParagraph = editorElement.querySelector('p');
                      if (firstParagraph) {
                        range.setStart(firstParagraph, 0);
                        range.collapse(true);
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                    }
                  }
                }}
                placeholder="Untitled"
                rows={1}
                className="w-full text-[2rem] md:text-[2.5rem] font-serif text-dark-100 bg-transparent border-none outline-none placeholder:text-dark-400/50 mb-6"
                style={{
                  display: 'block',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '1.5',
                  minHeight: '3rem'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />

              <EditorToolbar
                content={editingNote?.content || ''}
                onChange={(newContent) => {
                  console.log('EditorToolbar onChange:', {
                    contentLength: newContent.length,
                    editingNoteExists: !!editingNote
                  });
                  handleNoteChange(newContent);
                }}
              />
            </div>
          </div>

          {/* Editor Delete Confirmation */}
          <ConfirmDialog
            open={!!noteToDelete && isWriting}
            onOpenChange={(open) => !open && setNoteToDelete(null)}
            title="Delete Note"
            description={`Are you sure you want to delete this note${noteToDelete?.title ? `: "${noteToDelete.title}"` : ''}? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => {
              if (noteToDelete) {
                deleteNoteMutation.mutate(noteToDelete.id);
                setNoteToDelete(null);
                setIsWriting(false);
                setEditingNote(null);
              }
            }}
          />

          {/* Editor Notebook Selection */}
          <NotebookSelectDialog
            open={showNotebookSelect && isWriting}
            onOpenChange={(open) => {
              console.log('NotebookSelectDialog onOpenChange:', {
                open,
                isWriting,
                showNotebookSelect,
                selectedNoteForNotebook
              });
              setShowNotebookSelect(open);
            }}
            notebooks={notebooks || []}
            selectedNotebookId={selectedNoteForNotebook?.notebook_id || null}
            onSelect={(notebookId) => {
              console.log('NotebookSelectDialog onSelect:', {
                notebookId,
                selectedNoteForNotebook,
                isWriting
              });
              handleNotebookSelect(notebookId);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-0 md:top-[4rem] inset-x-0 bottom-0 flex flex-col bg-dark-900">
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col md:flex-row max-w-[100rem] mx-auto">
          <div className="hidden md:flex flex-col min-w-[16rem] max-w-fit border-r border-dark-800">
            <div className="p-6 md:pt-12">
              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-serif italic text-dark-100">Notebooks</h2>
                <button
                  onClick={() => setShowNotebookForm(true)}
                  className="p-2 text-olive-300 hover:text-olive-200 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4">
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedNotebook(null)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                    !selectedNotebook
                      ? 'bg-dark-800 text-olive-300'
                      : 'text-dark-200 hover:bg-dark-800/50'
                  }`}
                >
                  All Notes
                </button>

                {notebooks?.map((notebook) => (
                  <div
                    key={notebook.id}
                    className={`
                      group flex items-center px-4 py-3 rounded-lg transition-colors w-full
                      ${selectedNotebook === notebook.id
                        ? 'bg-dark-800 text-olive-300'
                        : 'text-dark-200 hover:bg-dark-800/50'
                      }
                    `}
                  >
                    <button
                      onClick={() => setSelectedNotebook(notebook.id)}
                      className="flex-1 text-left text-sm min-w-0 truncate"
                    >
                      {notebook.name}
                    </button>
                    <button
                      onClick={() => setEditingNotebook(notebook)}
                      className="flex-none text-dark-400 hover:text-dark-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
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
                  <h2 className="text-2xl font-serif italic text-dark-100">Notebooks</h2>
                  <button
                    onClick={() => setShowNotebookForm(true)}
                    className="p-2 text-olive-300 hover:text-olive-200 bg-dark-800 hover:bg-dark-700 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-x-auto -mx-4 px-4">
                  <div className="flex gap-2 min-w-min pb-2">
                    <button
                      onClick={() => setSelectedNotebook(null)}
                      className={`shrink-0 px-4 py-2 rounded-lg transition-colors text-sm ${
                        !selectedNotebook
                          ? 'bg-dark-800 text-olive-300'
                          : 'bg-dark-800/50 text-dark-200 hover:bg-dark-800'
                      }`}
                    >
                      All Notes
                    </button>
                    {notebooks?.map((notebook) => (
                      <div
                        key={notebook.id}
                        className={`
                          shrink-0 flex items-center gap-2 transition-colors
                          ${selectedNotebook === notebook.id
                            ? 'bg-dark-800 text-olive-300'
                            : 'bg-dark-800/50 text-dark-200 hover:bg-dark-800'
                          }
                          rounded-lg
                        `}
                      >
                        <div className="pl-2 pr-0 py-1.5">
                          <button
                            onClick={() => setSelectedNotebook(notebook.id)}
                            className={`text-sm max-w-[12rem] overflow-hidden text-ellipsis whitespace-nowrap ${
                              selectedNotebook === notebook.id
                                ? 'text-olive-300'
                                : 'text-dark-200 hover:text-dark-100'
                            }`}
                          >
                            {notebook.name}
                          </button>
                        </div>
                        <button
                          onClick={() => setEditingNotebook(notebook)}
                          className="pl-0 pr-1.5 py-1.5 text-dark-400 hover:text-dark-300"
                        >
                          <MoreVertical className="w-4 h-4" />
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
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-olive-500"
                  />
                </div>
                <button
                  onClick={handleNewNote}
                  className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                >
                  New Note
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="grid grid-cols-1 gap-4">
                {notesData?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <img 
                      src="/jar/Note-Paper-Pen-01-B.png" 
                      alt="No notes"
                      className="w-[200px] mb-6 opacity-85"
                    />
                    <h3 className="text-xl font-serif text-dark-100 mb-2">
                      No notes yet
                    </h3>
                    <p className="text-dark-300 text-center max-w-[24rem] [text-wrap:balance]">
                      Click the "New Note" button to start writing your first note.
                    </p>
                  </div>
                ) : (
                  notesData?.map((note) => (
                    <div 
                      key={note.id} 
                      onClick={() => {
                        setEditingNote(note);
                        setIsWriting(true);
                      }}
                      className="group bg-dark-800 rounded-xl p-6 border border-dark-700 hover:border-dark-600 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-dark-400">
                            {format(new Date(note.created_at), 'MMM d, yyyy')}
                          </span>
                          {note.notebooks && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNoteForNotebook(note);
                                setShowNotebookSelect(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-olive-900/30 text-olive-300 rounded-lg hover:bg-olive-900/50 transition-colors"
                            >
                              {note.notebooks.name}
                            </button>
                          )}
                          {!note.notebooks && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNoteForNotebook(note);
                                setShowNotebookSelect(true);
                              }}
                              className="px-3 py-1.5 text-sm bg-dark-700/50 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors"
                            >
                              Add notebook
                            </button>
                          )}
                        </div>
                        {note.title && (
                          <div className="max-w-full">
                            <h3 className="text-xl font-serif text-dark-100 mb-2 truncate">
                              {note.title}
                            </h3>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-dark-200 text-lg font-serif leading-relaxed line-clamp-2 mb-3">
                            {stripHtmlTags(note.content)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingNote(note);
                              setIsWriting(true);
                            }}
                            className="px-3 py-1.5 text-sm bg-dark-700/50 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors flex items-center gap-1.5"
                            aria-label="Edit note"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteToDelete(note);
                            }}
                            className="px-3 py-1.5 text-sm bg-dark-700/50 text-dark-300 rounded-lg hover:bg-dark-700 transition-colors flex items-center gap-1.5"
                            aria-label="Delete note"
                          >
                            <Delete className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog.Root open={showNotebookForm} onOpenChange={setShowNotebookForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md z-[60]">
            <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
              New Notebook
            </Dialog.Title>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newNotebookName.trim()) {
                createNotebookMutation.mutate(newNotebookName);
              }
            }}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-1">
                  Name
                </label>
                <input
                  id="name"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-100 focus:outline-none focus:ring-2 focus:ring-olive-500"
                  placeholder="Enter notebook name"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotebookForm(false)}
                  className="px-4 py-2 text-dark-200 hover:text-dark-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newNotebookName.trim()}
                  className="px-4 py-2 bg-olive-700 text-dark-100 rounded-md hover:bg-olive-600 transition-colors disabled:opacity-50"
                >
                  Create Notebook
                </button>
              </div>
            </form>

            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 text-dark-400 hover:text-dark-300"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {editingNotebook && (
        <GroupDialog
          open={!!editingNotebook}
          onOpenChange={(open) => !open && setEditingNotebook(null)}
          title="Edit Notebook"
          groupName={editingNotebook.name}
          onSave={(name) => {
            updateNotebookMutation.mutate({
              id: editingNotebook.id,
              name
            });
          }}
          onDelete={() => {
            deleteNotebookMutation.mutate(editingNotebook.id);
          }}
          deleteMessage="Are you sure you want to delete this notebook? Notes in this notebook will be untagged but not deleted."
          className="z-[60]"
        />
      )}

      {/* List View Delete Confirmation */}
      <ConfirmDialog
        open={!!noteToDelete && !isWriting}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
        title="Delete Note"
        description={`Are you sure you want to delete this note${noteToDelete?.title ? `: "${noteToDelete.title}"` : ''}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (noteToDelete) {
            deleteNoteMutation.mutate(noteToDelete.id);
            setNoteToDelete(null);
          }
        }}
        className="z-[60]"
      />

      {/* List View Notebook Selection */}
      <NotebookSelectDialog
        open={showNotebookSelect && !isWriting}
        onOpenChange={setShowNotebookSelect}
        notebooks={notebooks || []}
        selectedNotebookId={selectedNoteForNotebook?.notebook_id || null}
        onSelect={handleNotebookSelect}
        className="z-[60]"
      />
    </div>
  );
}

export default Notes;