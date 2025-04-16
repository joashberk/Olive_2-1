import * as Dialog from '@radix-ui/react-dialog';
import { useState, useRef } from 'react';
import { MessageSquare, X, ImagePlus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './useToast';
import { supabase } from '@/lib/supabase';
import { FeedbackType } from '@/lib/types';
import { feedbackCategories, validateImage } from '@/lib/feedback';
import { useLocation } from 'react-router-dom';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-8 z-40 p-3 bg-dark-800/80 hover:bg-dark-800 backdrop-blur-sm rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
        aria-label="Send feedback"
      >
        <MessageSquare className="w-5 h-5 text-dark-300 group-hover:text-olive-300" />
      </button>

      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>('other');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const location = useLocation();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImage(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid image',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter your feedback message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();
      
      let screenshotUrl: string | null = null;

      if (selectedImage) {
        const timestamp = Date.now();
        const extension = selectedImage.name.split('.').pop();
        const path = `screenshots/${timestamp}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('feedback')
          .upload(path, selectedImage, {
            contentType: selectedImage.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('feedback')
          .getPublicUrl(path);

        screenshotUrl = publicUrl;
      }

      // Get the current page name from the route
      const pageName = location.pathname === '/' ? 'home' : location.pathname.slice(1);

      const { error } = await supabase
        .from('feedback')
        .insert([{
          type,
          message,
          screenshot_url: screenshotUrl,
          user_id: user?.id,
          user_email: user?.email,
          user_name: user?.user_metadata?.full_name,
          page_name: pageName
        }]);

      if (error) throw error;

      toast({
        title: 'Feedback sent',
        description: 'Thank you for your feedback!',
      });

      setMessage('');
      setType('other');
      setSelectedImage(null);
      setImagePreview(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: 'Error sending feedback',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <AnimatePresence>
          {open && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[500px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-dark-800 p-6 shadow-xl focus:outline-none z-50 overflow-y-auto"
                  initial={{ opacity: 0, y: '-48%', x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: '-50%', x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: '-48%', x: '-50%', scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
                    Send Feedback
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        What kind of feedback do you have?
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {feedbackCategories.map(category => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setType(category.id)}
                            className={`
                              flex flex-col items-start px-4 py-3 rounded-md text-sm transition-colors
                              ${type === category.id
                                ? 'bg-olive-900/50 text-olive-300 border-2 border-olive-700'
                                : 'bg-dark-700 text-dark-300 hover:bg-dark-600 border-2 border-transparent'
                              }
                            `}
                          >
                            <span className="font-medium">{category.label}</span>
                            <span className="text-xs opacity-80 mt-1">
                              {category.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-dark-200 mb-2"
                      >
                        Your Message
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-dark-100 placeholder:text-dark-400 focus:outline-none focus:ring-2 focus:ring-olive-500 min-h-[120px] resize-y"
                        placeholder={
                          type === 'bug'
                            ? "What's not working? Please provide steps to reproduce if possible."
                            : type === 'feature'
                            ? "What feature would you like to see? How would it help you?"
                            : "What's on your mind?"
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-200 mb-2">
                        Add Screenshot (optional)
                      </label>
                      
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Screenshot preview"
                            className="w-full h-auto rounded-md max-h-[200px] object-contain bg-dark-700"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1 bg-dark-800/90 text-dark-300 hover:text-dark-200 rounded-full"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-3 bg-dark-700 border-2 border-dashed border-dark-600 rounded-md text-dark-300 hover:text-dark-200 hover:border-dark-500 transition-colors flex items-center justify-center gap-2"
                          >
                            <ImagePlus className="w-5 h-5" />
                            <span>Choose image</span>
                          </button>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-dark-400">
                        Supported formats: JPEG, PNG, WebP (max 5MB)
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 text-dark-200 hover:text-dark-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="px-6 py-2 bg-olive-700 text-dark-100 rounded-md hover:bg-olive-600 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? 'Sending...' : 'Send Feedback'}
                      </button>
                    </div>
                  </form>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 p-2 text-dark-400 hover:text-dark-300 rounded-full hover:bg-dark-700"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}