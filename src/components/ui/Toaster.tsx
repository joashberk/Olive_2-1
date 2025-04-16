import * as Toast from '@radix-ui/react-toast';
import { useToast } from './useToast';

export function Toaster() {
  const { open, setOpen, toastProps } = useToast();

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        className={`${
          toastProps.variant === 'destructive' ? 'bg-red-100' : 'bg-olive-100'
        } rounded-lg shadow-lg p-4 data-[state=open]:animate-slideIn data-[state=closed]:animate-hide data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform_200ms_ease-out] data-[swipe=end]:animate-swipeOut`}
        open={open}
        onOpenChange={setOpen}
      >
        <Toast.Title className="font-semibold mb-1">{toastProps.title}</Toast.Title>
        {toastProps.description && (
          <Toast.Description className="text-sm text-gray-600">
            {toastProps.description}
          </Toast.Description>
        )}
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 p-6 w-full md:max-w-[420px] flex flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}