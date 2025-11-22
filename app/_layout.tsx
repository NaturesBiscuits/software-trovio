import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { LanguageProvider } from '../context/LanguageContext';
import { UserProfileProvider } from '../context/UserProfileContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLoggedin, setIsLoggedIn] = useState(false);
  const shouldCreateAccount = false;

  useEffect(() => {
    let isMounted = true;
    // Initialize session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setIsLoggedIn(Boolean(data.session));
    });
    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session));
    });
    return () => {
      isMounted = false;
      // `subscription` is the `data` object returned by Supabase; it contains a
      // `subscription` property which exposes `unsubscribe()` in some versions.
      // Defensively call whichever function exists to avoid runtime errors on unmount.
      try {
        // If the returned data has the shape { subscription }, call unsubscribe on it.
        // Otherwise, if the data object itself exposes unsubscribe(), call that.
        const subAny = subscription as any;
        if (subAny?.subscription && typeof subAny.subscription.unsubscribe === 'function') {
          subAny.subscription.unsubscribe();
        } else if (typeof subAny?.unsubscribe === 'function') {
          subAny.unsubscribe();
        }
      } catch (e) {
        // Silently ignore errors during cleanup.
      }
    };
  }, []);

  return (
    <LanguageProvider>
      <UserProfileProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Protected guard={isLoggedin}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Protected guard={!isLoggedin}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Protected guard={shouldCreateAccount}>
              <Stack.Screen name='signup'/>
            </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} /> 
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProfileProvider>
    </LanguageProvider>
  );
}
