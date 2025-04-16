import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [open, setOpen] = useState(false);
  const [toastProps, setToastProps] = useState<ToastProps>({
    title: '',
    description: '',
    variant: 'default',
  });

  const toast = useCallback((props: ToastProps) => {
    setToastProps(props);
    setOpen(true);
  }, []);

  return { toast, open, setOpen, toastProps };
}