import { useState, useEffect, FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '@/lib/supabase';
import { useToast } from './useToast';
import { useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthButtonProps {
  className?: string;
  onClick?: () => void;
}

export function AuthButton({ className = '', onClick }: AuthButtonProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Show success toast on successful sign in
        toast({
          title: 'Welcome!',
          description: 'You have successfully signed in.',
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const validateInput = () => {
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return false;
    }

    if (!email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return false;
    }

    if (isSignUp && !fullName) {
      toast({
        title: 'Missing full name',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleAuth = async (type: 'signup' | 'signin') => {
    if (!validateInput()) return;

    try {
      setIsLoading(true);
      
      const { data, error } = type === 'signup' 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: {
                full_name: fullName,
              },
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          })
        : await supabase.auth.signInWithPassword({ 
            email, 
            password
          });

      if (error) throw error;

      if (type === 'signup' && data?.user?.identities?.length === 0) {
        toast({
          title: 'Email already registered',
          description: 'Please sign in instead.',
          variant: 'destructive',
        });
        return;
      }

      // If remember me is false, set session to expire in 1 hour
      if (!rememberMe) {
        await supabase.auth.setSession({
          access_token: data.session?.access_token || '',
          refresh_token: data.session?.refresh_token || ''
        });
      }

      setShowForm(false);
      setIsSignUp(false);
      setFullName('');
      setEmail('');
      setPassword('');
      navigate('/');
    } catch (error) {
      let description = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          description = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          description = 'Please confirm your email address before signing in.';
        } else {
          description = error.message;
        }
      }
      
      toast({
        title: 'Authentication error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error signing out',
        description: error instanceof Error ? error.message : 'Failed to sign out',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  const handleOpenChange = (open: boolean) => {
    setShowForm(open);
    if (!open) {
      onClick?.();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAuth(isSignUp ? 'signup' : 'signin');
  };

  const buttonClassName = `px-4 py-2 text-sm font-medium text-dark-100 bg-dark-700 rounded-md hover:bg-dark-600 transition-colors disabled:opacity-50 ${className}`;

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className={buttonClassName}
      >
        Sign Out
      </button>
    );
  }

  return (
    <Dialog.Root open={showForm} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button 
          className={buttonClassName}
          disabled={isLoading}
          onClick={() => onClick?.()}
        >
          Sign In
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <AnimatePresence>
          {showForm && (
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
                  className="fixed left-[50%] top-[50%] bg-dark-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-md z-50"
                  initial={{ opacity: 0, y: '-48%', x: '-50%', scale: 0.95 }}
                  animate={{ opacity: 1, y: '-50%', x: '-50%', scale: 1 }}
                  exit={{ opacity: 0, y: '-48%', x: '-50%', scale: 0.95 }}
                  transition={{ 
                    duration: 0.2,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  {/* Logo */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="text-3xl font-serif font-bold text-olive-300">
                      Olive
                    </div>
                    <div className="text-xs font-medium text-olive-400">
                      beta
                    </div>
                  </div>
                  
                  <Dialog.Title className="text-xl font-semibold mb-4 text-dark-100">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-dark-200 mb-1">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
                          disabled={isLoading}
                          placeholder="Enter your full name"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-dark-200 mb-1">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
                        disabled={isLoading}
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-dark-200 mb-1">
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-dark-700 border border-dark-600 text-dark-100 rounded-md focus:outline-none focus:ring-2 focus:ring-olive-500"
                        disabled={isLoading}
                        placeholder="Enter your password"
                      />
                    </div>

                    {!isSignUp && (
                      <div className="flex items-center">
                        <input
                          id="rememberMe"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-dark-600 bg-dark-700 text-olive-500 focus:ring-2 focus:ring-olive-500"
                        />
                        <label htmlFor="rememberMe" className="ml-2 block text-sm text-dark-200">
                          Remember me
                        </label>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-dark-100 bg-olive-700 rounded-md hover:bg-olive-600 transition-colors disabled:opacity-50"
                      >
                        {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleMode}
                      className="w-full text-sm text-olive-400 hover:text-olive-300"
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : "Don't have an account? Sign up"}
                    </button>
                  </form>

                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 text-dark-400 hover:text-dark-300"
                      aria-label="Close"
                    >
                      ✕
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