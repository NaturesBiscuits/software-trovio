import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { supabase } from '../lib/supabase';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGE_STORAGE_KEY = '@trovio_language';
const SUPPORTED_LANGUAGES = ['en', 'az'];

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load language from storage on app start
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Try to get language from AsyncStorage first
      const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage)) {
        setCurrentLanguage(storedLanguage);
        await i18next.changeLanguage(storedLanguage);
      } else {
        // Fallback to system language or default
        const systemLanguage = i18next.language || 'en';
        const fallbackLanguage = SUPPORTED_LANGUAGES.includes(systemLanguage) 
          ? systemLanguage 
          : 'en';
        
        setCurrentLanguage(fallbackLanguage);
        await i18next.changeLanguage(fallbackLanguage);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, fallbackLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      // Fallback to default
      setCurrentLanguage('en');
      await i18next.changeLanguage('en');
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language: string) => {
    try {
      if (!SUPPORTED_LANGUAGES.includes(language)) {
        console.warn(`Language ${language} is not supported`);
        return;
      }

      // Update i18next immediately for instant UI updates
      await i18next.changeLanguage(language);
      setCurrentLanguage(language);

      // Persist to AsyncStorage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);

      // Update user profile in Supabase if logged in
      await updateUserProfileLanguage(language);

    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const updateUserProfileLanguage = async (language: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ language: language, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user language in profile:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing language with user profile:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook for getting language from user profile on login
export const useProfileLanguage = () => {
  const { changeLanguage } = useLanguage();

  const loadProfileLanguage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profile?.language && SUPPORTED_LANGUAGES.includes(profile.language)) {
          await changeLanguage(profile.language);
        }
      }
    } catch (error) {
      console.error('Error loading profile language:', error);
    }
  };

  return { loadProfileLanguage };
};
