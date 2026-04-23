import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import NotificationCard, { PromotionNotification } from "../../components/notifications-card";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../context/NotificationContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons as Icon } from "@expo/vector-icons";

export const STORE_TO_OPEN_KEY = '@trovio_store_to_open';

export default function NotificationScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<PromotionNotification[]>([]);
  const [savedStoreIds, setSavedStoreIds] = useState<string[]>([]);
  const [storeNameMap, setStoreNameMap] = useState<Record<string, string>>({});
  const { markNotificationsAsRead } = useNotifications();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userError || !userId) {
        setNotifications([]);
        setSavedStoreIds([]);
        setStoreNameMap({});
        return;
      }

      const { data: favorites, error: favoritesError } = await supabase
        .from("engagement_events")
        .select("store_id")
        .eq("user_id", userId)
        .eq("engagement", "favorite")
        .not("store_id", "is", null);

      if (favoritesError || !favorites || favorites.length === 0) {
        setNotifications([]);
        setSavedStoreIds([]);
        setStoreNameMap({});
        return;
      }

      const ids = favorites.map((fav) => fav.store_id).filter(Boolean) as string[];
      setSavedStoreIds(ids);

      const [{ data: promos, error: promosError }, { data: stores, error: storesError }] =
        await Promise.all([
          supabase
            .from("promotions")
            .select("*")
            .in("store_id", ids)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false }),
          supabase
            .from("store_applications")
            .select("id, store_name")
            .in("id", ids),
        ]);

      if (promosError) {
        console.error("Failed to load promotions", promosError);
        setNotifications([]);
        return;
      }

      if (storesError) {
        console.error("Failed to load store info", storesError);
      }

      const names = (stores || []).reduce<Record<string, string>>((acc, store) => {
        acc[store.id] = store.store_name || "Saved Store";
        return acc;
      }, {});
      setStoreNameMap(names);

      const formatted = (promos || []).map((promo) => ({
        id: promo.id,
        store_id: promo.store_id,
        store_name: names[promo.store_id] || "Saved Store",
        title: promo.title,
        // <- Ignore the promotion title
        // description: promo.description,
        description: "has posted an ongoing promotion. Click this to check it out",
        image_url: promo.image_url,
        created_at: promo.created_at,
      }));

      setNotifications(formatted);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
      setSavedStoreIds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark notifications as read when the screen is viewed
  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

  useEffect(() => {
    if (savedStoreIds.length === 0) return;

    const channel = supabase
      .channel("promo-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "promotions" },
        (payload) => {
          const newPromo = payload.new as PromotionNotification;
          if (!savedStoreIds.includes(newPromo.store_id)) return;

          setNotifications((prev) => [
            {
              id: newPromo.id,
              store_id: newPromo.store_id,
              store_name: storeNameMap[newPromo.store_id] || "Saved Store",
              title: newPromo.title,
              description: "has posted an ongoing promotion. Click this to check it out",
              image_url: newPromo.image_url,
              created_at: newPromo.created_at,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [savedStoreIds, storeNameMap]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(async (notification: PromotionNotification) => {
    try {
      // Store the store_id in AsyncStorage so discover screen can open it
      await AsyncStorage.setItem(STORE_TO_OPEN_KEY, notification.store_id);
      // Navigate to discover screen
      router.push("/(tabs)/discover");
    } catch (error) {
      console.error("Error navigating to store:", error);
    }
  }, [router]);

  const renderNotification = useCallback(({ item }: { item: PromotionNotification }) => {
    return (
      <NotificationCard item={item} onPress={handleNotificationPress} />
    );
  }, [handleNotificationPress]);

  // Consistent sizing for back button
  const { width: deviceWidth } = Dimensions.get("window");
  const BACK_BUTTON_SIZE = deviceWidth < 350 ? 36 : 42;

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace("/(tabs)/discover");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ===== HEADER ===== */}
      <View style={styles.topHeader}>
        {/* Back button - always in absolute corner (no circular placeholder) */}
        <TouchableOpacity
          onPress={handleBack}
          style={[
            styles.backButtonWrapper,
            {
              top: Platform.OS === "ios" ? 45 : 48,
              left: 16,
              width: BACK_BUTTON_SIZE,
              height: BACK_BUTTON_SIZE,
              borderRadius: 0,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent",
              // no background, no circle
              shadowOpacity: 0,
              elevation: 0,
            },
          ]}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Icon
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={26}
            color="#FFF"
          />
        </TouchableOpacity>
        {/* Adjusted header and subheader position */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Notifications</Text>
          <Text style={styles.subHeaderText}>Stay updated with new alerts</Text>
        </View>
      </View>

      {/* ===== BODY ===== */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color="#1f78ff" />
            <Text style={styles.loaderText}>Fetching notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>You&apos;re all caught up!</Text>
            <Text style={styles.emptyDescription}>
              Save stores you care about and you&apos;ll be notified when they launch a promotion.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={{ paddingBottom: 24, gap: 14 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ---------------- HEADER ---------------- */
  topHeader: {
    backgroundColor: "#191820",
    paddingVertical: 80,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    justifyContent: "flex-end",
    marginBottom: 15,
    position: "relative",
  },
  backButtonWrapper: {
    position: "absolute",
    zIndex: 99,
    // styles for no circle/backplate
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
    borderRadius: 0,
  },
  headerContainer: {
    marginTop: 32, // Move header lower within the topHeader
    paddingBottom: 10,
  },
  headerText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "left",
  },
  subHeaderText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 10,
    textAlign: "left",
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#",
  },
  emptyState: {
    marginTop: 32,
    paddingHorizontal: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1d1c23",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b6b6b",
  },
});
