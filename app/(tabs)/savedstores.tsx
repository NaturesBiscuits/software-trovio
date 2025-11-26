import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { StoreApplication } from "../../components/DiscoverFlipCard";
import StoreProfileModal, { removeSavedStoreId } from "../../components/StoreProfileModal";

// VerticalStoreCardWithHeart: a local wrapper that adds an inline heart button
function VerticalStoreCardWithHeart({ store, onPress, onUnfavorite }: {
  store: StoreApplication,
  onPress?: () => void,
  onUnfavorite?: (store: StoreApplication) => void,
}) {
  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.storeCardTouchable}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          <VerticalStoreCardOnlyImage store={store} />
        </View>

        <View style={styles.inlineInfoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.verticalTitle}>{store.store_name || 'Unnamed Store'}</Text>
            <View style={styles.verticalRow}>
              <Ionicons name="location-outline" size={14} color="#be3e3e" />
              <Text style={styles.verticalAddress} numberOfLines={1}>
                {store.address || 'No address'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inlineHeartButton}
            onPress={() => onUnfavorite && onUnfavorite(store)}
            activeOpacity={0.7}
            testID="inline-heart"
          >
            <Ionicons name="heart" size={22} color="red" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// A small local helper to render only the image area of VerticalStoreCard, in order to preserve image loading logic.
import OriginalVerticalStoreCard from "../../components/VerticalStoreCard";
function VerticalStoreCardOnlyImage({ store }: { store: StoreApplication }) {
  // This component renders only the image/placeholder part from VerticalStoreCard
  // To keep code DRY and avoid duplicating all the image loading logic, you can either
  //   - factor out image logic from VerticalStoreCard, OR
  //   - simply use OriginalVerticalStoreCard here with a "onlyImage" prop
  // For brevity, let's use the original card and overlay everything else above the image.
  // But in a production refactor, ideally extract the image logic.
  // So, here, we just render OriginalVerticalStoreCard and overlay our content above image.
  // But since we want tight control here, let's mimic the image area:

  // --- COPIED IMAGE LOADING LOGIC ---
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  // For fade-in/out, we omit for brevity

  useEffect(() => {
    let isActive = true;
    const doLoad = async () => {
      if (store.photos_url?.length && store.user_id) {
        setImageLoading(true);
        const { getStorageImageUrls } = await import("../../lib/storageUtils");
        const urls = await getStorageImageUrls(store.photos_url, store.user_id);
        if (!isActive) return;
        const filtered = urls.filter((url: any): url is string => Boolean(url));
        setImageUrls(filtered);
        setCurrentPhotoIndex(0);
      } else {
        setImageUrls([]);
      }
      if (isActive) setImageLoading(false);
    };
    doLoad();
    return () => { isActive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.photos_url, store.user_id]);
  // --- END IMAGE LOADING LOGIC ---

  return (
    <View style={styles.imageContainer}>
      {imageUrls.length > 0 && !imageLoading ? (
        <Image
          source={{ uri: imageUrls[currentPhotoIndex] }}
          style={styles.verticalImg}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.verticalPlaceholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
        </View>
      )}
    </View>
  );
}

import { Image } from "react-native"; // needed for the image rendering above

export default function FavouritesScreen() {
  const router = useRouter();

  const [savedStores, setSavedStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);

  const fetchSavedStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userError || !userId) {
        setSavedStores([]);
        setLoading(false);
        return;
      }
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

      const { data, error } = await supabase
        .from("store_applications")
        .select("*")
        .in("id", ids);

      if (error) throw error;

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
        setSavedStores(prev => prev.filter(s => s.id !== store.id));
        await removeSavedStoreId(store.id);

        const { error } = await supabase
          .from("user_favorite_stores")
          .delete()
          .match({ user_id: userId, store_id: store.id });

        if (error) {
          console.error("Error removing favorite store:", error);
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
    <VerticalStoreCardWithHeart
      store={item}
      onPress={() => handleOpenStore(item)}
      onUnfavorite={handleUnfavorite}
    />
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

// Styles: add new ones for the inline layout
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

  /* Card Inline Heart */
  cardContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: "hidden",
    marginBottom: 0,
    marginTop: 0,
    // Visible border
    borderWidth: 1.2,
    borderColor: "#dedede"
  },
  storeCardTouchable: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 200,
    overflow: "hidden",
  },
  verticalImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  verticalPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderIcon: {
    fontSize: 40,
  },
  inlineInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    paddingBottom: 15,
    paddingTop: 16,
  },
  verticalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
    color: "#333",
    lineHeight: 22,
  },
  verticalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verticalAddress: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    maxWidth: 180,
  },
  inlineHeartButton: {
    marginLeft: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 6,
    alignSelf: "flex-start",
    top: 0,
  },
});
