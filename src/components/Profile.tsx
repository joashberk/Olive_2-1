import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { AuthButton } from './ui/AuthButton';

function Profile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-start mt-8 px-4">
      <img 
        src="/jar/Profile-Olive-01-B.png" 
        alt="Profile olive"
        className="w-[200px] mb-6 opacity-85"
      />
      {!user ? (
        <>
          <h2 className="text-2xl font-serif italic text-dark-100">Sign In</h2>
          <p className="text-dark-200 mb-6 text-center max-w-[24rem]">
            Sign in to access your personal Bible study features.
          </p>
          <AuthButton className="md:w-auto w-full justify-center" />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-serif italic text-dark-100 mb-3">Welcome</h2>
          <p className="text-xl text-olive-300 mb-6">{user.user_metadata.full_name}</p>
          <AuthButton className="md:w-auto w-full justify-center" />
        </>
      )}
    </div>
  );
}

export default Profile;