import * as Dialog from '@radix-ui/react-dialog';
import { X, Check } from 'lucide-react';
import { Notebook } from '@/types';

interface NotebookSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebooks: Notebook[];
  selectedNotebookId: string | null;
  onSelect: (notebookId: string | null) => void;
  className?: string;
}

export function NotebookSelectDialog({
  open,
  onOpenChange,
  notebooks,
  selectedNotebookId,
  onSelect,
  className = ''
}: NotebookSelectDialogProps) {
  const handleSelect = (notebookId: string | null) => {
    // If clicking the currently selected notebook, remove it
    if (notebookId === selectedNotebookId) {
      onSelect(null);
    } else {
      onSelect(notebookId);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 bg-black/50 z-[200] ${className}`} />
        <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md z-[200] ${className}`}>
          <div className="p-6 border-b border-dark-700">
            <Dialog.Title className="text-2xl font-serif text-dark-100">
              Select Notebook
            </Dialog.Title>
            <Dialog.Description className="text-dark-300 mt-2">
              Choose a notebook for this note or remove it from the current notebook.
            </Dialog.Description>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              <button
                onClick={() => handleSelect(null)}
                className={`
                  group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${selectedNotebookId === null
                    ? 'bg-olive-900/30 text-olive-300 ring-1 ring-olive-500'
                    : 'text-dark-200 hover:bg-dark-800/50 hover:text-dark-100'
                  }
                `}
              >
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center
                  ${selectedNotebookId === null
                    ? 'bg-olive-500 border-olive-500'
                    : 'border-dark-500 group-hover:border-dark-400'
                  }
                `}>
                  {selectedNotebookId === null && (
                    <Check className="w-3.5 h-3.5 text-dark-900" />
                  )}
                </div>
                <span className="flex-1 text-left">No Notebook</span>
              </button>

              {notebooks.map((notebook) => (
                <button
                  key={notebook.id}
                  onClick={() => handleSelect(notebook.id)}
                  className={`
                    group w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${selectedNotebookId === notebook.id
                      ? 'bg-olive-900/30 text-olive-300 ring-1 ring-olive-500'
                      : 'text-dark-200 hover:bg-dark-800/50 hover:text-dark-100'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-5 h-5 rounded border transition-all flex items-center justify-center
                    ${selectedNotebookId === notebook.id
                      ? 'bg-olive-500 border-olive-500'
                      : 'border-dark-500 group-hover:border-dark-400'
                    }
                  `}>
                    {selectedNotebookId === notebook.id && (
                      <Check className="w-3.5 h-3.5 text-dark-900" />
                    )}
                  </div>
                  <span className="flex-1 text-left">{notebook.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-700">
            <X className="w-5 h-5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 