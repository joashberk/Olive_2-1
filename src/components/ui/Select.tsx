import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  variant?: 'light' | 'dark';
  className?: string;
}

function Select({ value, onValueChange, options, placeholder, variant = 'light', className = '' }: SelectProps) {
  const triggerClassName = variant === 'dark'
    ? `inline-flex items-center justify-between rounded-md px-3 py-2 text-sm bg-dark-800 border border-dark-700 text-dark-100 hover:bg-dark-700 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 ${className}`
    : `inline-flex items-center justify-between rounded-md px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-olive-500 ${className}`;

  const contentClassName = variant === 'dark'
    ? "overflow-hidden bg-dark-800 rounded-md shadow-lg border border-dark-700"
    : "overflow-hidden bg-white rounded-md shadow-lg border border-gray-200";

  const itemClassName = variant === 'dark'
    ? "relative flex items-center px-4 py-2 text-sm text-dark-100 rounded-md hover:bg-dark-700/50 focus:bg-dark-700/50 outline-none cursor-pointer transition-colors"
    : "relative flex items-center px-4 py-2 text-sm text-gray-900 rounded-md hover:bg-olive-50 focus:bg-olive-50 outline-none cursor-pointer transition-colors";

  const scrollButtonClassName = variant === 'dark'
    ? "flex items-center justify-center h-6 bg-dark-800 text-dark-400 cursor-default"
    : "flex items-center justify-center h-6 bg-white text-gray-700 cursor-default";

  // Group options by testament if they have a group property
  const groupedOptions = options.reduce((acc, option) => {
    if (option.group) {
      if (!acc[option.group]) {
        acc[option.group] = [];
      }
      acc[option.group].push(option);
    } else {
      if (!acc['ungrouped']) {
        acc['ungrouped'] = [];
      }
      acc['ungrouped'].push(option);
    }
    return acc;
  }, {} as Record<string, SelectOption[]>);

  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange}>
      <RadixSelect.Trigger className={triggerClassName}>
        <RadixSelect.Value placeholder={placeholder}>
          {options.find(opt => opt.value === value)?.label || placeholder}
        </RadixSelect.Value>
        <RadixSelect.Icon>
          <ChevronDown />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={contentClassName}
          position="popper"
          sideOffset={8}
          align="start"
          style={{ 
            zIndex: 100,
            position: 'relative',
            width: 'var(--radix-select-trigger-width)',
            maxHeight: '300px'
          }}
        >
          <RadixSelect.ScrollUpButton className={scrollButtonClassName}>
            ▲
          </RadixSelect.ScrollUpButton>
          
          <RadixSelect.Viewport className="p-1">
            {Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {group !== 'ungrouped' && (
                  <div className="px-4 py-2 text-xs font-semibold text-dark-400">
                    {group}
                  </div>
                )}
                {groupOptions.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    className={itemClassName}
                  >
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                ))}
              </div>
            ))}
          </RadixSelect.Viewport>

          <RadixSelect.ScrollDownButton className={scrollButtonClassName}>
            ▼
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

export default Select;