import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ReaderSettings {
  fontSize: number;
  lineSpacing: number;
}

interface SettingsPanelProps {
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  open,
  onOpenChange
}: SettingsPanelProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`
              fixed z-50 bg-dark-800/95 backdrop-blur-sm rounded-lg shadow-lg
              border border-olive-900/50
              ${isMobile 
                ? 'left-4 right-4 bottom-4'
                : 'right-4 top-24 w-[320px] xl:right-[calc((100vw-64rem)/2+1rem)]'
              }
            `}
          >
            <div className="p-4">
              <Dialog.Title className="text-lg font-medium mb-6 text-dark-100">
                Reading Settings
              </Dialog.Title>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Font Size ({settings.fontSize}px)
                  </label>
                  <input
                    type="range"
                    min={14}
                    max={36}
                    step={3}
                    value={settings.fontSize}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      fontSize: parseInt(e.target.value)
                    })}
                    className="w-full accent-olive-300 bg-dark-700 h-2 rounded-full appearance-none
                      [&::-webkit-slider-thumb]:w-4 
                      [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-olive-300 
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:border-0
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:shadow-sm
                      [&::-webkit-slider-thumb]:hover:bg-olive-200
                      [&::-moz-range-thumb]:w-4
                      [&::-moz-range-thumb]:h-4
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-olive-300
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:transition-all
                      [&::-moz-range-thumb]:shadow-sm
                      [&::-moz-range-thumb]:hover:bg-olive-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-200 mb-2">
                    Line Spacing ({settings.lineSpacing.toFixed(1)})
                  </label>
                  <input
                    type="range"
                    min={1.2}
                    max={2.4}
                    step={0.1}
                    value={settings.lineSpacing}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      lineSpacing: parseFloat(e.target.value)
                    })}
                    className="w-full accent-olive-300 bg-dark-700 h-2 rounded-full appearance-none
                      [&::-webkit-slider-thumb]:w-4 
                      [&::-webkit-slider-thumb]:h-4 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-olive-300 
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:border-0
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:shadow-sm
                      [&::-webkit-slider-thumb]:hover:bg-olive-200
                      [&::-moz-range-thumb]:w-4
                      [&::-moz-range-thumb]:h-4
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-olive-300
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:transition-all
                      [&::-moz-range-thumb]:shadow-sm
                      [&::-moz-range-thumb]:hover:bg-olive-200"
                  />
                </div>
              </div>

              <Dialog.Close asChild>
                <button
                  className="absolute top-3 right-3 p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-700/50"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}