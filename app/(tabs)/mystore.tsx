import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import CreatePromotionModal from "../../components/CreatePromotionModal";
import EditStoreModal from "../../components/EditStoreModal";
import type { StoreApplication } from "../../components/DiscoverFlipCard";
import StoreRouteMap from "../../components/StoreRouteMap";
import VerticalStoreCard from "../../components/VerticalStoreCard";
import { getCachedImageUrl, getCachedImageUrls } from "../../lib/imageCache";
import { supabase } from "../../lib/supabase";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");
const PLACEHOLDER_WIDTH = Math.min(350, deviceWidth - 40);
const PLACEHOLDER_HEIGHT = 220;

// This is how far up the user can scroll (overscroll, pull down) in px
const SCROLL_TOP_LIMIT = 0;

type Promotion = {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

export default function MyStoreScreen() {
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionImageUrls, setPromotionImageUrls] = useState<Map<string, string | null>>(new Map());
  const [loadingPromotionImages, setLoadingPromotionImages] = useState<Set<string>>(new Set());
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const flatListRef = useRef<FlatList<string>>(null);
  const onViewRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCarouselIndex(viewableItems[0].index ?? 0);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const router = useRouter();

  // ScrollView ref so we can manipulate scroll position if user scrolls too far up
  const scrollRef = useRef<ScrollView>(null);

  // Clamp to a negative maximum offset
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < -SCROLL_TOP_LIMIT) {
      // Over-scroll up was too far; reset to the limit
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: -SCROLL_TOP_LIMIT, animated: false });
      }
    }
  };

  useEffect(() => {
    const fetchMyStores = async () => {
      setLoadingStore(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userError || !userId) {
          setStores([]);
          return;
        }

        const { data, error } = await supabase
          .from("store_applications")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          setStores([]);
          return;
        }

        setStores(data as StoreApplication[]);
      } finally {
        setLoadingStore(false);
      }
    };

    fetchMyStores();
  }, []);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!selectedStore || !Array.isArray(selectedStore.photos_url) || !selectedStore.photos_url.length || !selectedStore.user_id) {
        setPhotoUrls([]);
        setCarouselIndex(0);
        return;
      }
      setLoadingPhotos(true);
      try {
        const urls = await getCachedImageUrls(selectedStore.photos_url, selectedStore.user_id);
        setPhotoUrls(urls.filter((url): url is string => Boolean(url)));
      } catch {
        setPhotoUrls([]);
      } finally {
        setLoadingPhotos(false);
        setCarouselIndex(0);
      }
    };

    if (selectedStore) {
      loadPhotos();
    }
  }, [selectedStore]);

  // Fetch promotions from database
  useEffect(() => {
    const fetchPromotions = async () => {
      if (!selectedStore) {
        setPromotions([]);
        setPromotionImageUrls(new Map());
        return;
      }

      setLoadingPromotions(true);
      try {
        const { data, error } = await supabase
          .from("promotions")
          .select("*")
          .eq("store_id", selectedStore.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        const promotionsData = (data as Promotion[]) || [];
        setPromotions(promotionsData);

        // Load image URLs for all promotions in parallel
        const loadPromotionImages = async () => {
          // Initialize loading state for all promotions with images
          const initialLoadingSet = new Set<string>();
          promotionsData.forEach((promo) => {
            if (promo.image_url && promo.user_id) {
              initialLoadingSet.add(promo.id);
            }
          });
          setLoadingPromotionImages(initialLoadingSet);

          // Load all images in parallel
          const imagePromises = promotionsData.map(async (promo) => {
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

          setPromotionImageUrls(urlMap);
          setLoadingPromotionImages(new Set()); // Clear loading state
        };

        loadPromotionImages();
      } catch (error) {
        console.error("Error fetching promotions:", error);
      } finally {
        setLoadingPromotions(false);
      }
    };

    fetchPromotions();
  }, [selectedStore]);

  // Check and update expired promotions periodically
  useEffect(() => {
    if (!selectedStore || promotions.length === 0) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const expired = promotions.filter(
        (p) => new Date(p.expires_at) <= now && p.is_active
      );

      if (expired.length > 0) {
        // Update expired promotions
        const expiredIds = expired.map((p) => p.id);
        const { error } = await supabase
          .from("promotions")
          .update({ is_active: false })
          .in("id", expiredIds);

        if (!error) {
          // Refresh promotions list
          const { data } = await supabase
            .from("promotions")
            .select("*")
            .eq("store_id", selectedStore.id)
            .order("created_at", { ascending: false });
          if (data) {
            const promotionsData = data as Promotion[];
            setPromotions(promotionsData);

            // Reload image URLs
            const loadPromotionImages = async () => {
              const initialLoadingSet = new Set<string>();
              promotionsData.forEach((promo) => {
                if (promo.image_url && promo.user_id) {
                  initialLoadingSet.add(promo.id);
                }
              });
              setLoadingPromotionImages(initialLoadingSet);

              const imagePromises = promotionsData.map(async (promo) => {
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

              const results = await Promise.all(imagePromises);
              const urlMap = new Map<string, string | null>();
              results.forEach(({ id, url }) => {
                urlMap.set(id, url);
              });

              setPromotionImageUrls(urlMap);
              setLoadingPromotionImages(new Set());
            };

            loadPromotionImages();
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedStore, promotions]);

  const handlePromotionSuccess = async () => {
    // Refresh promotions after creation
    if (!selectedStore) return;
    
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("store_id", selectedStore.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const promotionsData = data as Promotion[];
      setPromotions(promotionsData);

      // Load image URLs for new promotions
      const loadPromotionImages = async () => {
        const initialLoadingSet = new Set<string>();
        promotionsData.forEach((promo) => {
          if (promo.image_url && promo.user_id) {
            initialLoadingSet.add(promo.id);
          }
        });
        setLoadingPromotionImages(initialLoadingSet);

        const imagePromises = promotionsData.map(async (promo) => {
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

        const results = await Promise.all(imagePromises);
        const urlMap = new Map<string, string | null>();
        results.forEach(({ id, url }) => {
          urlMap.set(id, url);
        });

        setPromotionImageUrls(urlMap);
        setLoadingPromotionImages(new Set());
      };

      loadPromotionImages();
    }
  };

  const handleStoreUpdateSuccess = async () => {
    // Refresh store data after update
    if (!selectedStore) return;
    
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userError || !userId) return;

    const { data, error } = await supabase
      .from("store_applications")
      .select("*")
      .eq("id", selectedStore.id)
      .eq("user_id", userId)
      .eq("status", "accepted")
      .single();

    if (!error && data) {
      setSelectedStore(data as StoreApplication);
    }
  };

  if (loadingStore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#468dff" />
      </View>
    );
  }

  // Show list of stores if no store is selected
  if (!selectedStore) {
    return (
      <View style={styles.screenContainer}>
        <View style={styles.pageHeaderContainerAdjusted}>
          <TouchableOpacity
            style={styles.backButtonAdjusted}
            onPress={() => router.replace("/(tabs)/discover")}
            activeOpacity={0.8}
            hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <Icon name="arrow-back" size={25} color="#000" />
          </TouchableOpacity>
          <Text style={styles.pageTitleWithBackAdjusted}>My Stores</Text>
        </View>

        {stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>You don&apos;t have a store yet</Text>
            <Text style={styles.emptySubtitle}>
              Apply for a professional account to create your store profile and start adding promotions.
            </Text>
          </View>
        ) : (
          <FlatList
            data={stores}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <VerticalStoreCard
                store={item}
                onPress={() => setSelectedStore(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }

  // Show store details when a store is selected
  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ref={scrollRef}
        scrollEventThrottle={16}
        bounces={true}
        onScroll={handleScroll}
        // disables extremely excessive scroll up/overscroll, while allowing a refresh/pull-down bounce
      >
        {/* Page title with back button */}
        <View style={styles.pageHeaderContainerAdjusted}>
          <TouchableOpacity
            style={styles.backButtonAdjusted}
            onPress={() => setSelectedStore(null)}
            activeOpacity={0.8}
            hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <Icon name="arrow-back" size={25} color="#000" />
          </TouchableOpacity>
          <Text style={styles.pageTitleWithBackAdjusted}>{selectedStore.store_name || "My Store"}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
            activeOpacity={0.8}
            hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <Icon name="create-outline" size={24} color="#1f78ff" />
          </TouchableOpacity>
        </View>

        {/* Carousel Area */}
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          {loadingPhotos ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : photoUrls.length > 0 ? (
            <View style={styles.carouselContainerNoBG}>
              <FlatList
                data={photoUrls}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                ref={flatListRef}
                keyExtractor={(item, idx) => item + idx}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.carouselImageWrapperNoBG,
                      { width: PLACEHOLDER_WIDTH, height: PLACEHOLDER_HEIGHT },
                    ]}
                  >
                    <Image
                      source={{ uri: item }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                    {index === carouselIndex && (
                      <View style={styles.dotsContainerInPhoto}>
                        {photoUrls.map((_, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.dotSmallWhite,
                              carouselIndex === idx ? styles.activeDotSmallWhite : undefined,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                getItemLayout={(_, index) => ({
                  length: PLACEHOLDER_WIDTH,
                  offset: PLACEHOLDER_WIDTH * index,
                  index,
                })}
                style={styles.carouselScrollNoBG}
                contentContainerStyle={{ alignItems: "center" }}
              />
            </View>
          ) : (
            <View style={styles.photoPlaceholderContainer}>
              <Icon name="image-outline" size={52} color="#bbb" />
              <Text style={styles.placeholderText}>Store photos will appear here</Text>
              <Text style={styles.placeholderSubtext}>Size: 350 x 180</Text>
            </View>
          )}
        </View>

        {/* Store Info Card: description, address, tags, location & route */}
        <View style={styles.infoCard}>
          {selectedStore.description ? (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{selectedStore.description}</Text>
            </>
          ) : null}

          {selectedStore.address ? (
            <>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.descriptionText}>{selectedStore.address}</Text>
            </>
          ) : null}

          {Array.isArray(selectedStore.tags) && selectedStore.tags.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {selectedStore.tags.map((tag, idx) => (
                  <View key={tag + idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Location & Route</Text>
          {typeof selectedStore.latitude === "number" && typeof selectedStore.longitude === "number" ? (
            <StoreRouteMap
              destination={{ latitude: selectedStore.latitude, longitude: selectedStore.longitude }}
            />
          ) : (
            <Text style={styles.emptyText}>Location unavailable.</Text>
          )}
        </View>

        {/* Current Promotions Container */}
        <View style={styles.promotionsCard}>
          <View style={styles.promotionsHeader}>
            <Text style={styles.promotionsTitle}>Current Promotions</Text>
            <TouchableOpacity
              style={styles.addPromoButton}
              onPress={() => setPromoModalVisible(true)}
              activeOpacity={0.8}
            >
              <Icon name="add-circle-outline" size={24} color="#1f78ff" />
            </TouchableOpacity>
          </View>

          {loadingPromotions ? (
            <ActivityIndicator size="small" color="#1f78ff" style={{ marginVertical: 20 }} />
          ) : promotions.length === 0 ? (
            <Text style={styles.promotionsText}>
              No promotions currently available. Tap the + button to create one.
            </Text>
          ) : (
            promotions.map((promo) => {
              const expiresAt = new Date(promo.expires_at);
              const isExpired = expiresAt <= new Date();
              const timeRemaining = expiresAt.getTime() - Date.now();
              const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
              const daysRemaining = Math.floor(hoursRemaining / 24);
              const imageUrl = promotionImageUrls.get(promo.id);
              const isLoadingImage = loadingPromotionImages.has(promo.id);

              return (
                <View key={promo.id} style={styles.promotionItem}>
                  {isLoadingImage ? (
                    <View style={[styles.promoImage, styles.promoImageLoading]}>
                      <ActivityIndicator size="small" color="#468dff" />
                    </View>
                  ) : imageUrl ? (
                    <ExpoImage
                      source={{ uri: imageUrl }}
                      style={styles.promoImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                  ) : promo.image_url ? (
                    <View style={[styles.promoImage, styles.promoImageFallback]}>
                      <Icon name="image-outline" size={32} color="#bbb" />
                    </View>
                  ) : null}
                  <View style={styles.promoContent}>
                    <View style={styles.promoHeader}>
                      <Text style={styles.promoTitle}>{promo.title}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          !promo.is_active || isExpired
                            ? styles.statusInactive
                            : styles.statusActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            !promo.is_active || isExpired
                              ? styles.statusTextInactive
                              : styles.statusTextActive,
                          ]}
                        >
                          {!promo.is_active || isExpired ? "Expired" : "Active"}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.promoDetails}>{promo.description}</Text>
                    <View style={styles.promoFooter}>
                      <Icon name="time-outline" size={14} color="#666" />
                      <Text style={styles.promoTime}>
                        {isExpired
                          ? "Expired"
                          : daysRemaining > 0
                          ? `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left`
                          : hoursRemaining > 0
                          ? `${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""} left`
                          : "Expiring soon"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Promotion Creation Modal */}
      {selectedStore && (
        <CreatePromotionModal
          visible={promoModalVisible}
          onClose={() => setPromoModalVisible(false)}
          storeId={selectedStore.id}
          userId={selectedStore.user_id || ""}
          onSuccess={handlePromotionSuccess}
        />
      )}

      {/* Edit Store Modal */}
      {selectedStore && (
        <EditStoreModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          store={selectedStore}
          onSuccess={handleStoreUpdateSuccess}
        />
      )}
    </View>
  );
}

// @ts-ignore PLACEHOLDER_WIDTH is dynamic but safe for styles
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  // Lower down and shift right the header area (marginTop & marginLeft increased)
  pageHeaderContainerAdjusted: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 48,      // Lowered further from previous 36
    marginLeft: 14,     // Moved a bit to the right
  },
  backButtonAdjusted: {
    marginRight: 10,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 20,
    // Add slight left margin so it's not flush to the edge (acts jointly with container marginLeft)
    marginLeft: 0,
  },
  pageTitleWithBackAdjusted: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    flexShrink: 1,
    marginLeft: 4, // Space between icon and text after shifting
    flex: 1,
  },
  editButton: {
    padding: 4,
    marginLeft: 8,
  },
  // (Keep old ones for potential other uses)
  pageHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 36,
  },
  backButton: {
    marginRight: 10,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 20,
  },
  pageTitleWithBack: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    flexShrink: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#fff",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Carousel styles (aligned with StoreProfileModal)
  carouselContainerNoBG: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT + 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 8,
    position: "relative",
  },
  carouselScrollNoBG: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    borderRadius: 16,
  },
  carouselImageWrapperNoBG: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 0,
    borderRadius: 16,
    position: "relative",
  },
  carouselImage: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    borderRadius: 16,
  },
  dotsContainerInPhoto: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 5,
  },
  dotSmallWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: "#fff",
    opacity: 0.6,
  },
  activeDotSmallWhite: {
    backgroundColor: "#fff",
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoPlaceholderContainer: {
    alignItems: "center",
    marginBottom: 8,
    marginTop: 8,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#aaa",
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  descriptionText: {
    color: "#444",
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: "#eef1ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#4f63d2",
    fontWeight: "600",
  },
  emptyText: {
    color: "#777",
    marginBottom: 12,
  },
  promotionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 34,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  promotionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  promotionsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  promotionsText: {
    color: "#444",
    fontSize: 15,
    marginBottom: 6,
  },
  addPromoButton: {
    padding: 4,
  },
  promotionItem: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promoImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f5f5f5",
  },
  promoImageLoading: {
    justifyContent: "center",
    alignItems: "center",
  },
  promoImageFallback: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  promoContent: {
    padding: 12,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#e8f5e9",
  },
  statusInactive: {
    backgroundColor: "#ffebee",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#4caf50",
  },
  statusTextInactive: {
    color: "#f44336",
  },
  promoDetails: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 8,
  },
  promoFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  promoTime: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#000",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  modalButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCancelButton: {
    backgroundColor: "#f3f3f3",
  },
  modalSaveButton: {
    backgroundColor: "#1f78ff",
  },
  modalCancelText: {
    color: "#333",
    fontWeight: "600",
  },
  modalSaveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
