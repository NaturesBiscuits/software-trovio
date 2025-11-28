import { supabase } from './supabase';

/**
 * Safely gets the current user, handling refresh token errors gracefully
 * This prevents "Invalid Refresh Token" errors from crashing the app
 */
export async function getCurrentUser() {
  try {
    // First try to get the session (doesn't trigger refresh)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      return { user: sessionData.session.user, error: null };
    }

    // If no session, try getUser (may trigger refresh)
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    // Handle refresh token errors gracefully
    if (authError) {
      // Check if it's a refresh token error
      if (
        authError.message?.includes('Refresh Token') || 
        authError.message?.includes('Invalid Refresh Token') ||
        authError.message?.includes('refresh_token_not_found')
      ) {
        console.warn('Refresh token invalid or expired. User may need to sign in again.');
        // Optionally sign out the user to clear invalid tokens
        try {
          await supabase.auth.signOut();
        } catch (signOutError) {
          // Ignore sign out errors
        }
        return { user: null, error: 'Session expired. Please sign in again.' };
      }
      return { user: null, error: authError };
    }

    return { user: userData?.user || null, error: null };
  } catch (error: any) {
    // Handle refresh token errors in catch block too
    if (
      error?.message?.includes('Refresh Token') || 
      error?.message?.includes('Invalid Refresh Token') ||
      error?.message?.includes('refresh_token_not_found')
    ) {
      console.warn('Refresh token invalid or expired. User may need to sign in again.');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore sign out errors
      }
      return { user: null, error: 'Session expired. Please sign in again.' };
    }
    return { user: null, error };
  }
}

