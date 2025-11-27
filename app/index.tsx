import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setIsSignedIn(Boolean(data.session));
      setIsLoading(false);
    });

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

  if (isLoading) return null;

  return <Redirect href={isSignedIn ? '/(tabs)/discover' : '/(auth)/login'} />;
}


