import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';

const ONBOARDING_STORAGE_KEY = '@trovio_onboarding_seen';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const storedOnboardingFlag = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (isMounted) {
          setHasSeenOnboarding(storedOnboardingFlag === 'true');
        }
      } catch (error) {
        console.warn('Failed to read onboarding flag', error);
        if (isMounted) setHasSeenOnboarding(false);
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setIsSignedIn(Boolean(data.session));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => {
      isMounted = false;
      // Defensively handle subscription cleanup
      try {
        const subAny = subscription as any;
        if (subAny?.subscription && typeof subAny.subscription.unsubscribe === 'function') {
          subAny.subscription.unsubscribe();
        } else if (typeof subAny?.unsubscribe === 'function') {
          subAny.unsubscribe();
        }
      } catch (e) {
        // Silently ignore errors during cleanup
      }
    };
  }, []);

  // Show loading state while checking onboarding status
  if (isLoading || hasSeenOnboarding === null) return null;

  // Always show onboarding first if user hasn't seen it
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // After onboarding, redirect based on auth status
  return <Redirect href={isSignedIn ? '/(tabs)/discover' : '/(auth)/login'} />;
}


