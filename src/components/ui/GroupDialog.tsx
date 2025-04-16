import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState } from 'react';

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  groupName: string;
  description?: string;
  onSave: (name: string, description: string) => void;
  onDelete?: () => void;
  deleteMessage?: string;
  className?: string;
}

export function GroupDialog({
  open,
  onOpenChange,
  title,
  groupName,
  description = '',
  onSave,
  onDelete,
  deleteMessage = 'Are you sure you want to delete this group? Items in this group will be untagged but not deleted.',
  className
}: GroupDialogProps) {
  const [name, setName] = useState(groupName);
  const [desc, setDesc] = useState(description);

  return (
    <Dialog.Root 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          setName(groupName);
          setDesc(description);
        }
        onOpenChange(newOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 bg-black/50 ${className}`} />
        <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md ${className}`}>
          <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
            {title}
          </Dialog.Title>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              onSave(name, desc);
            }
          }}>
            <div className="space-y-4 mb-6">
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
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-100 focus:outline-none focus:ring-2 focus:ring-olive-500 resize-none h-24"
                  placeholder="Enter description"
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(deleteMessage)) {
                      onDelete();
                    }
                  }}
                  className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
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
  );
}