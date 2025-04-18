import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { translations } from '@/data/translations';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [selectedTranslation, setSelectedTranslation] = useState(() => 
    localStorage.getItem('selectedTranslation') || 'web'
  );

  useEffect(() => {
    localStorage.setItem('selectedTranslation', selectedTranslation);
    // Reload the page to apply the new translation
    if (open === false) {
      window.location.reload();
    }
  }, [selectedTranslation, open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-dark-800 p-6 shadow-lg focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-dark-100">
              Settings
            </Dialog.Title>
            <Dialog.Close className="text-dark-400 hover:text-dark-100">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-dark-200 mb-2">
                Bible Translation
              </h3>
              <div className="space-y-2">
                {translations.map(translation => (
                  <label
                    key={translation.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-dark-700 cursor-pointer hover:bg-dark-600 transition-colors"
                  >
                    <input
                      type="radio"
                      name="translation"
                      value={translation.id}
                      checked={selectedTranslation === translation.id}
                      onChange={e => setSelectedTranslation(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-dark-100">
                        {translation.name}
                      </div>
                      <div className="text-sm text-dark-300">
                        {translation.description}
                      </div>
                      {translation.hasStrongs && (
                        <div className="text-xs text-olive-400 mt-1">
                          Includes Strong's numbers
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 