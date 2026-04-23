import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { getCurrentUser } from "../../lib/authUtils";
import { getCachedImageUrl } from "../../lib/imageCache";
import { supabase } from "../../lib/supabase";

interface PromotionWithStore {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  store_name: string;
}

export default function ActivePromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionWithStore[]>([]);
  const [imageUrls, setImageUrls] = useState<Map<string, string | null>>(new Map());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePromotions = async () => {
      setLoading(true);
      try {
        const { user, error: authError } = await getCurrentUser();
        const userId = user?.id;

        if (authError || !userId) {
          setLoading(false);
          return;
        }

        // Get all store IDs for the user
        const { data: storesData } = await supabase
          .from("store_applications")
          .select("id, store_name")
          .eq("user_id", userId)
          .eq("status", "accepted");

        const storeIds = storesData?.map((s) => s.id) || [];

        if (storeIds.length === 0) {
          setPromotions([]);
          setLoading(false);
          return;
        }

        // Create a map of store_id to store_name
        const storeNameMap = new Map<string, string>();
        storesData?.forEach((store) => {
          if (store.id) {
            storeNameMap.set(store.id, store.store_name || "Unnamed Store");
          }
        });

        // Fetch all active promotions from all user's stores
        const { data: promotionsData, error: promotionsError } = await supabase
          .from("promotions")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .in("store_id", storeIds)
          .order("created_at", { ascending: false });

        if (promotionsError) {
          console.error("Error fetching promotions:", promotionsError);
          setPromotions([]);
          setLoading(false);
          return;
        }

        // Add store names to promotions
        const promotionsWithStoreNames: PromotionWithStore[] =
          (promotionsData || []).map((promo) => ({
            ...promo,
            store_name: storeNameMap.get(promo.store_id) || "Unnamed Store",
          }));

        setPromotions(promotionsWithStoreNames);

        // Load image URLs for all promotions in parallel
        const loadPromotionImages = async () => {
          // Initialize loading state for all promotions with images
          const initialLoadingSet = new Set<string>();
          promotionsWithStoreNames.forEach((promo) => {
            if (promo.image_url && promo.user_id) {
              initialLoadingSet.add(promo.id);
            }
          });
          setLoadingImages(initialLoadingSet);

          // Load all images in parallel
          const imagePromises = promotionsWithStoreNames.map(async (promo) => {
            if (!promo.image_url || !promo.user_id) {
              return { id: promo.id, url: null };
            }

            try {
              const url = await getCachedImageUrl(promo.image_url, promo.user_id, 'tus');
              return { id: promo.id, url };
            } catch (error) {
              console.error(`Error loading image for promotion ${promo.id}:`, error);
              return { id: promo.id, url: null };
            }
          });

          // Wait for all images to load
          const results = await Promise.all(imagePromises);
          
          // Update state with all loaded URLs
          const urlMap = new Map<string, string | null>();
          results.forEach(({ id, url }) => {
            urlMap.set(id, url);
          });

          setImageUrls(urlMap);
          setLoadingImages(new Set()); // Clear loading state
        };

        loadPromotionImages();
      } catch (error) {
        console.error("Error fetching active promotions:", error);
        setPromotions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromotions();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#191820" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Back button and header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Icon name="chevron-back" size={28} color="#181a20" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.greetingTitle}>Active Promotions</Text>
            <Text style={styles.greetingSubtitle}>
              All active promotions across your stores
            </Text>
          </View>

          {promotions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="megaphone-outline" size={64} color="#8f92a1" />
              <Text style={styles.emptyTitle}>No Active Promotions</Text>
              <Text style={styles.emptySubtitle}>
                You don&apos;t have any active promotions at the moment.
              </Text>
            </View>
          ) : (
            <View style={styles.promotionsList}>
              {promotions.map((promo) => {
                const daysUntilExpiry = getDaysUntilExpiry(promo.expires_at);
                const imageUrl = imageUrls.get(promo.id);
                const isLoadingImage = loadingImages.has(promo.id);

                return (
                  <View key={promo.id} style={styles.promotionCard}>
                    {isLoadingImage ? (
                      <View style={styles.promotionImageFallback}>
                        <ActivityIndicator size="small" color="#468dff" />
                      </View>
                    ) : imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.promotionImage}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={styles.promotionImageFallback}>
                        <Icon name="gift-outline" size={42} color="#8f92a1" />
                      </View>
                    )}

                    <View style={styles.promotionContent}>
                      <View style={styles.promotionHeader}>
                        <View style={styles.storeInfo}>
                          <Icon name="storefront" size={16} color="#468dff" />
                          <Text style={styles.storeName}>{promo.store_name}</Text>
                        </View>
                        {daysUntilExpiry > 0 && (
                          <View style={styles.expiryBadge}>
                            <Icon name="time-outline" size={12} color="#4caf50" />
                            <Text style={styles.expiryText}>
                              {daysUntilExpiry} {daysUntilExpiry === 1 ? "day" : "days"} left
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.promotionTitle}>{promo.title}</Text>
                      <Text style={styles.promotionDescription} numberOfLines={3}>
                        {promo.description}
                      </Text>

                      <View style={[styles.promotionFooter, { justifyContent: "space-between" }]}>
                        <View style={styles.dateInfo}>
                          <Icon name="calendar-outline" size={14} color="#8f92a1" />
                          <Text style={styles.dateText}>
                            Expires {formatDate(promo.expires_at)}
                          </Text>
                        </View>
                        {/* Boost Promotions Button */}
                        <TouchableOpacity
                          style={styles.boostButton}
                          onPress={() => router.push("/(tabs)/boostpromotions")}
                          activeOpacity={0.8}
                        >
                          <Icon name="rocket-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.boostButtonText}>Boost</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#181a20",
  },
  greetingSubtitle: {
    fontSize: 14,
    color: "#8f92a1",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191820",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8f92a1",
    textAlign: "center",
    lineHeight: 20,
  },
  promotionsList: {
    gap: 16,
  },
  promotionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ecedf2",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  promotionImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#f4f4f6",
  },
  promotionImageFallback: {
    width: "100%",
    height: 200,
    backgroundColor: "#f4f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  promotionContent: {
    padding: 16,
  },
  promotionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  storeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#468dff",
  },
  expiryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4caf5015",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4caf50",
  },
  promotionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#191820",
    marginBottom: 8,
  },
  promotionDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  promotionFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f6",
    // justifyContent: "space-between" is now set inline where needed
  },
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#8f92a1",
  },
  boostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#191820",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    marginLeft: 8,
  },
  boostButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
