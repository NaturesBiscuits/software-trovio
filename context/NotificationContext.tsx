import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface NotificationContextType {
  hasUnreadNotifications: boolean;
  isLoading: boolean;
  checkUnreadNotifications: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const LAST_VIEWED_KEY = '@trovio_notifications_last_viewed';

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkUnreadNotifications = useCallback(async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      if (userError || !userId) {
        setHasUnreadNotifications(false);
        setIsLoading(false);
        return;
      }

      // Get user's favorited stores from engagement_events table
      const { data: favorites, error: favoritesError } = await supabase
        .from("engagement_events")
        .select("store_id")
        .eq("user_id", userId)
        .eq("engagement", "favorite")
        .not("store_id", "is", null);

      if (favoritesError || !favorites || favorites.length === 0) {
        setHasUnreadNotifications(false);
        setIsLoading(false);
        return;
      }

      const favoriteStoreIds = favorites.map((fav) => fav.store_id).filter(Boolean) as string[];

      // Get last viewed timestamp from AsyncStorage
      const lastViewedStr = await AsyncStorage.getItem(LAST_VIEWED_KEY);
      const lastViewed = lastViewedStr ? new Date(lastViewedStr) : null;

      // Get promotions from favorited stores
      const { data: promotions, error: promosError } = await supabase
        .from("promotions")
        .select("created_at")
        .in("store_id", favoriteStoreIds)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (promosError) {
        console.error("Error checking unread notifications:", promosError);
        setHasUnreadNotifications(false);
        setIsLoading(false);
        return;
      }

      // If there's no last viewed timestamp, check if there are any promotions
      if (!lastViewed) {
        setHasUnreadNotifications((promotions?.length || 0) > 0);
        setIsLoading(false);
        return;
      }

      // Check if there are any promotions created after the last viewed timestamp
      const hasUnread = (promotions || []).some(
        (promo) => new Date(promo.created_at) > lastViewed
      );

      setHasUnreadNotifications(hasUnread);
    } catch (error) {
      console.error("Error checking unread notifications:", error);
      setHasUnreadNotifications(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markNotificationsAsRead = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_VIEWED_KEY, now);
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    checkUnreadNotifications();

    // Set up real-time subscription for new promotions
    const channel = supabase
      .channel("notification-checker")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "promotions" },
        () => {
          // When a new promotion is created, check for unread notifications
          checkUnreadNotifications();
        }
      )
      .subscribe();

    // Also check periodically (every 30 seconds) in case we miss real-time updates
    const interval = setInterval(() => {
      checkUnreadNotifications();
    }, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [checkUnreadNotifications]);

  const value: NotificationContextType = {
    hasUnreadNotifications,
    isLoading,
    checkUnreadNotifications,
    markNotificationsAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

