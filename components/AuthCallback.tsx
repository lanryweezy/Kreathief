import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase/client';
import { useStore } from '../store/useStore';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);
  const addToast = useStore((state) => state.addToast);

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        addToast('Authentication failed. Please try again.', 'error');
        navigate('/auth');
        return;
      }

      if (data.session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        const p = profile as any;

        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          name: p?.name || data.session.user.email?.split('@')[0] || 'User',
          plan: p?.plan || 'free',
        });
        
        addToast('Successfully signed in with Google!', 'success');
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate, setUser, addToast]);

  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 relative">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Finalizing Login</h2>
        <p className="text-gray-500 font-medium animate-pulse">Syncing your creative workspace...</p>
      </div>
    </div>
  );
};
