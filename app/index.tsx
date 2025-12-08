import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';

const LANDING_PAGE_STORAGE_KEY = '@trovio_landing_page_seen';
const ONBOARDING_STORAGE_KEY = '@trovio_onboarding_seen';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const [hasSeenLandingPage, setHasSeenLandingPage] = useState<boolean | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const storedLandingPageFlag = await AsyncStorage.getItem(LANDING_PAGE_STORAGE_KEY);
        const storedOnboardingFlag = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (isMounted) {
          setHasSeenLandingPage(storedLandingPageFlag === 'true');
          setHasSeenOnboarding(storedOnboardingFlag === 'true');
        }
      } catch (error) {
        console.warn('Failed to read storage flags', error);
        if (isMounted) {
          setHasSeenLandingPage(false);
          setHasSeenOnboarding(false);
        }
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

  // Show loading state while checking status
  if (isLoading || hasSeenLandingPage === null || hasSeenOnboarding === null) return null;

  // Show landing page first if user hasn't seen it
  if (!hasSeenLandingPage) {
    return <Redirect href="/landingpage" />;
  }

  // Show onboarding if user has seen landing page but not onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // After both landing page and onboarding, redirect based on auth status
  return <Redirect href={isSignedIn ? '/(tabs)/discover' : '/(auth)/login'} />;
}


