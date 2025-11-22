import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url: string;
  type?: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      // Check for active session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.log('No active session found');
        setUserProfile(null);
        return;
      }

      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error fetching user:', userError);
        setUserProfile(null);
        return;
      }

      const currentUser = userData.user;
      if (!currentUser) {
        setUserProfile(null);
        return;
      }

      // Fetch profile from Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url, type')
        .eq('id', currentUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Set basic user info even if profile fetch fails
        setUserProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          username: '',
          full_name: '',
          avatar_url: '',
          type: '',
        });
      } else {
        setUserProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          username: profileData?.username || '',
          full_name: profileData?.full_name || '',
          avatar_url: profileData?.avatar_url || '',
          type: profileData?.type || '',
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchUserProfile();
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  useEffect(() => {
    // Only fetch if we don't have profile data yet
    if (!userProfile) {
      fetchUserProfile();
    }

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // User is signed in, fetch profile if we don't have it
        if (!userProfile) {
          fetchUserProfile();
        }
      } else {
        // User is signed out, clear profile
        setUserProfile(null);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [userProfile]);

  const value: UserProfileContextType = {
    userProfile,
    isLoading,
    refreshProfile,
    updateProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
