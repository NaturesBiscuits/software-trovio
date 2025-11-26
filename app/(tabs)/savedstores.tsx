import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { StoreApplication } from "../../components/DiscoverFlipCard";
import VerticalStoreCard from "../../components/VerticalStoreCard";
import StoreProfileModal, { removeSavedStoreId } from "../../components/StoreProfileModal";

export default function FavouritesScreen() {
  const router = useRouter();

  const [savedStores, setSavedStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);

  const fetchSavedStores = useCallback(async () => {
    setLoading(true);
    try {
      // Get current authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userError || !userId) {
        setSavedStores([]);
        setLoading(false);
        return;
      }

      // Fetch favorite store IDs for this user
      const { data: favorites, error: favError } = await supabase
        .from("user_favorite_stores")
        .select("store_id")
        .eq("user_id", userId);

      if (favError || !favorites || favorites.length === 0) {
        setSavedStores([]);
        setLoading(false);
        return;
      }

      const ids = favorites.map(f => f.store_id);

      // Query ALL store_applications whose id is in saved ids.
      const { data, error } = await supabase
        .from("store_applications")
        .select("*")
        .in("id", ids);

      if (error) throw error;

      // Keep same order as ids
      const dataOrEmpty = data || [];
      const ordered = ids
        .map(id => dataOrEmpty.find(d => d.id === id))
        .filter(Boolean) as StoreApplication[];

      setSavedStores(ordered);
    } catch (e) {
      console.error("Error loading saved stores:", e);
      setSavedStores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnfavorite = useCallback(
    async (store: StoreApplication) => {
      // Confirm with the user before removing
      const confirm = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Remove favourite",
          "Are you sure you want to remove this?",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Remove", style: "destructive", onPress: () => resolve(true) },
          ],
          { cancelable: true }
        );
      });

      if (!confirm) return;

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userError || !userId) {
          return;
        }

        // Optimistically remove from local list
        setSavedStores(prev => prev.filter(s => s.id !== store.id));

        // Keep local AsyncStorage in sync with favorites
        await removeSavedStoreId(store.id);

        const { error } = await supabase
          .from("user_favorite_stores")
          .delete()
          .match({ user_id: userId, store_id: store.id });

        if (error) {
          console.error("Error removing favorite store:", error);
          // Optionally refetch to keep in sync
          fetchSavedStores();
        }
      } catch (e) {
        console.error("Error in handleUnfavorite:", e);
      }
    },
    [fetchSavedStores]
  );

  useEffect(() => {
    fetchSavedStores();
  }, [fetchSavedStores]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSavedStores().finally(() => setRefreshing(false));
  }, [fetchSavedStores]);

  const handleBack = () => {
    router.push("/(tabs)/discover");
  };

  const handleOpenStore = (store: StoreApplication) => {
    setSelectedStore(store);
  };

  const handleCloseStore = () => {
    setSelectedStore(null);
  };

  // Card rendering
  const renderCard = ({ item }: { item: StoreApplication }) => (
    <View style={styles.card}>
      <VerticalStoreCard store={item} onPress={() => handleOpenStore(item)} />
      <TouchableOpacity
        style={styles.heartButton}
        onPress={() => handleUnfavorite(item)}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={22} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourites</Text>
      </View>
      {/* Content */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 28 }} />
      ) : savedStores.length === 0 ? (
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Ionicons name="heart-outline" size={60} color="#ddd" />
          <Text style={{ color: "#777", fontSize: 16, marginTop: 12 }}>No favourites yet.</Text>
          <Text style={{ color: "#aaa", fontSize: 13 }}>Tap the heart on a store to save it here.</Text>
        </View>
      ) : (
        <FlatList
          data={savedStores}
          renderItem={renderCard}
          keyExtractor={s => s.id}
          showsVerticalScrollIndicator={false}
          style={{ marginTop: 0 }}
          contentContainerStyle={{ paddingBottom: 50, gap: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <StoreProfileModal
        visible={!!selectedStore}
        store={selectedStore}
        onClose={handleCloseStore}
        userCoords={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 40,
  },

  /* Header Section */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 6,
    paddingLeft: 8,
  },
  backButton: {
    marginRight: 10,
    marginLeft: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginLeft: 4,
  },

  /* Card */
  card: {
    width: "100%",
    position: "relative",
    marginBottom: 0,
    marginTop: 0,
  },
  heartButton: {
    position: "absolute",
    top: 18,
    right: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 6,
  },
});
