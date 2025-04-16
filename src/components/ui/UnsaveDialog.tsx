import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface UnsaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function UnsaveDialog({ open, onOpenChange, onConfirm }: UnsaveDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md">
          <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
            Unsave Verse
          </Dialog.Title>
          
          <p className="text-dark-200 mb-6">
            Are you sure you want to unsave this verse?
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-dark-200 hover:text-dark-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="px-4 py-2 bg-olive-700 text-dark-100 rounded-md hover:bg-olive-600 transition-colors"
            >
              Unsave
            </button>
          </div>

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