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
        // Try to update language column, but handle gracefully if column doesn't exist
        const { error } = await supabase
          .from('profiles')
          .update({ language: language })
          .eq('id', user.id);

        if (error) {
          // Only log if it's not a "column doesn't exist" error
          if (error.code !== 'PGRST204' && error.message?.includes('language') === false) {
            console.error('Error updating user language in profile:', error);
          } else {
            // Column doesn't exist - this is okay, language still works via AsyncStorage
            console.warn('Language column not found in profiles table. Language preference saved locally only.');
          }
        }
      }
    } catch (error) {
      // Don't throw - language still works via AsyncStorage
      console.warn('Could not sync language with user profile (column may not exist):', error);
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
        // Try to get language from profile, but handle gracefully if column doesn't exist
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        // If column doesn't exist, error.code will be PGRST204
        if (error && error.code === 'PGRST204') {
          // Column doesn't exist - this is okay, just use AsyncStorage language
          console.warn('Language column not found in profiles table. Using local language preference.');
          return;
        }

        if (profile?.language && SUPPORTED_LANGUAGES.includes(profile.language)) {
          await changeLanguage(profile.language);
        }
      }
    } catch (error: any) {
      // Don't throw - gracefully handle missing column
      if (error?.code !== 'PGRST204') {
        console.error('Error loading profile language:', error);
      }
    }
  };

  return { loadProfileLanguage };
};
