import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  groupName: string;
  onSave: (name: string, description?: string) => void;
  onDelete?: () => void;
  deleteMessage?: string;
  className?: string;
}

export function GroupDialog({
  open,
  onOpenChange,
  title,
  groupName,
  onSave,
  onDelete,
  deleteMessage,
  className = ''
}: GroupDialogProps) {
  const [name, setName] = useState(groupName);
  const [description, setDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className={`fixed inset-0 bg-black/50 z-[70] ${className}`} />
          <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md z-[70] ${className}`}>
            <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
              {title}
            </Dialog.Title>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                onSave(name.trim(), description.trim() || undefined);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-dark-200 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-100 focus:outline-none focus:ring-2 focus:ring-olive-500"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-dark-200 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-100 focus:outline-none focus:ring-2 focus:ring-olive-500 min-h-[100px]"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-6">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-red-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 text-dark-200 hover:text-dark-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="px-4 py-2 bg-olive-700 text-dark-100 rounded-md hover:bg-olive-600 transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
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

      {onDelete && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Delete ${title.toLowerCase()}`}
          description={deleteMessage || `Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
            onOpenChange(false);
          }}
          className={className}
        />
      )}
    </>
  );
}