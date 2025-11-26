import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "../../lib/supabase";
import { getStorageImageUrls } from "../../lib/storageUtils";
import type { StoreApplication } from "../../components/DiscoverFlipCard";
import StoreRouteMap from "../../components/StoreRouteMap";
import { useRouter } from "expo-router";

const { width: deviceWidth, height: deviceHeight } = Dimensions.get("window");
const PLACEHOLDER_WIDTH = Math.min(350, deviceWidth - 40);
const PLACEHOLDER_HEIGHT = 220;

// This is how far up the user can scroll (overscroll, pull down) in px
const SCROLL_TOP_LIMIT = 0;

type Promotion = {
  id: string;
  title: string;
  details: string;
};

export default function MyStoreScreen() {
  const [store, setStore] = useState<StoreApplication | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDetails, setPromoDetails] = useState("");

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
    const fetchMyStore = async () => {
      setLoadingStore(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (userError || !userId) {
          setStore(null);
          return;
        }

        const { data, error } = await supabase
          .from("store_applications")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(1);

        if (error || !data || data.length === 0) {
          setStore(null);
          return;
        }

        setStore(data[0] as StoreApplication);
      } finally {
        setLoadingStore(false);
      }
    };

    fetchMyStore();
  }, []);

  useEffect(() => {
    const loadPhotos = async () => {
      if (!store || !Array.isArray(store.photos_url) || !store.photos_url.length || !store.user_id) {
        setPhotoUrls([]);
        setCarouselIndex(0);
        return;
      }
      setLoadingPhotos(true);
      try {
        const urls = await getStorageImageUrls(store.photos_url, store.user_id);
        setPhotoUrls(urls.filter((url): url is string => Boolean(url)));
      } catch {
        setPhotoUrls([]);
      } finally {
        setLoadingPhotos(false);
        setCarouselIndex(0);
      }
    };

    if (store) {
      loadPhotos();
    }
  }, [store]);

  const handleCreatePromotion = () => {
    if (!promoTitle.trim() || !promoDetails.trim()) {
      return;
    }
    const newPromo: Promotion = {
      id: Date.now().toString(),
      title: promoTitle.trim(),
      details: promoDetails.trim(),
    };
    setPromotions((prev) => [newPromo, ...prev]);
    setPromoTitle("");
    setPromoDetails("");
    setPromoModalVisible(false);
  };

  if (loadingStore) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#468dff" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>You don&apos;t have a store yet</Text>
        <Text style={styles.emptySubtitle}>
          Apply for a professional account to create your store profile and start adding promotions.
        </Text>
      </View>
    );
  }

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
        <View style={styles.pageHeaderContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/(tabs)/discover")}
            activeOpacity={0.8}
            hitSlop={{ left: 8, right: 8, top: 8, bottom: 8 }}
          >
            <Icon name="arrow-back" size={25} color="#000" />
          </TouchableOpacity>
          <Text style={styles.pageTitleWithBack}>{store.store_name || "My Store"}</Text>
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
          {store.description ? (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{store.description}</Text>
            </>
          ) : null}

          {store.address ? (
            <>
              <Text style={styles.sectionTitle}>Address</Text>
              <Text style={styles.descriptionText}>{store.address}</Text>
            </>
          ) : null}

          {Array.isArray(store.tags) && store.tags.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {store.tags.map((tag, idx) => (
                  <View key={tag + idx} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.sectionTitle}>Location & Route</Text>
          {typeof store.latitude === "number" && typeof store.longitude === "number" ? (
            <StoreRouteMap
              destination={{ latitude: store.latitude, longitude: store.longitude }}
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

          {promotions.length === 0 ? (
            <Text style={styles.promotionsText}>
              No promotions currently available. Tap the + button to create one.
            </Text>
          ) : (
            promotions.map((promo) => (
              <View key={promo.id} style={styles.promotionItem}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoDetails}>{promo.details}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Promotion Creation Modal */}
      <Modal
        visible={promoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPromoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create Promotion</Text>
            <TextInput
              value={promoTitle}
              onChangeText={setPromoTitle}
              placeholder="Promotion title"
              placeholderTextColor="#999"
              style={styles.modalInput}
            />
            <TextInput
              value={promoDetails}
              onChangeText={setPromoDetails}
              placeholder="Promotion details"
              placeholderTextColor="#999"
              style={[styles.modalInput, { height: 90, textAlignVertical: "top" }]}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => {
                  setPromoModalVisible(false);
                  setPromoTitle("");
                  setPromoDetails("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleCreatePromotion}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Lower down the header area by increasing marginTop
  pageHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 36, // Lowered even more from previous 18
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
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  promoDetails: {
    fontSize: 14,
    color: "#555",
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

