import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileLanguage } from './LanguageContext';

interface AuthContextType {
  user: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { loadProfileLanguage } = useProfileLanguage();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Load user's language preference if logged in
      if (session?.user) {
        loadProfileLanguage();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Clear image cache on logout
        if (event === 'SIGNED_OUT') {
          const { clearImageCache } = await import('../lib/imageUtils');
          const { clearImageUrlCache } = await import('../lib/imageCache');
          await clearImageCache();
          await clearImageUrlCache();
        }
        
        // Load user's language preference on login
        if (event === 'SIGNED_IN' && session?.user) {
          loadProfileLanguage();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfileLanguage]);

  const value: AuthContextType = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
