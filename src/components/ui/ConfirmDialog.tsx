import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  className?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
  className = ''
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={`fixed inset-0 bg-black/50 z-[70] ${className}`} />
        <Dialog.Content className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md z-[70] ${className}`}>
          <Dialog.Title className="text-xl font-semibold mb-2 text-dark-100">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-dark-300 mb-6">
            {description}
          </Dialog.Description>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-dark-300 hover:text-dark-200 transition-colors rounded-lg hover:bg-dark-700"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                variant === 'destructive'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-olive-600 text-white hover:bg-olive-700'
              }`}
            >
              {confirmLabel}
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