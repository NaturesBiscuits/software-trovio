import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../../components/BottomNav";
import { supabase } from "../../../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import StoreProfileModal from "../../../components/StoreProfileModal";

// --- Type Definitions ---
interface StoreApplication {
  id: string;
  user_id: string | null;
  full_name: string | null;
  store_name: string | null;
  address: string | null;
  tags: string[] | null;
  id_url: string[] | null;
  license_url: string[] | null;
  photos_url: string[] | null;
  status: string | null;
  created_at: string | null;
  description: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  latitude: number | null;
  longitude: number | null;
}

type TagItem = { id: string; name: string };

// --- Constants ---
const RECENTS_STORAGE_KEY = "recent-searches-topnavtabs";
const MAX_RECENT_SEARCHES = 6;
const RECENT_STORES_STORAGE_KEY = "recent-stores-topnavtabs";
const MAX_RECENT_STORES = 6;

const ANDROID_STATUSBAR_HEIGHT = StatusBar.currentHeight ?? 0;
const TOP_INSET = Platform.OS === "ios" ? 24 : ANDROID_STATUSBAR_HEIGHT;

const SCREEN_WIDTH = Dimensions.get("window").width;
const SIDEPANEL_WIDTH = Math.min(350, Math.floor(SCREEN_WIDTH * 0.84));

// Tag background color for unselected tags - lighter, matched to side panel with 95% opacity
const TAG_BG_UNSELECTED = "rgba(46,51,68,0.95)"; // #2e3344 at 95% opacity

export default function SearchScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentStores, setRecentStores] = useState<StoreApplication[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);

  // Side Panel
  const [isTagPanelOpen, setIsTagPanelOpen] = useState(false);
  const sidePanelAnim = useRef(new Animated.Value(-SIDEPANEL_WIDTH)).current;

  // --- Utility Functions ---
  const getStorageUrl = (filename: string | null, userId: string | null): string | null => {
    if (!filename || !userId) return null;
    const storagePath = `applications/${userId}/store_photos/${filename}`;
    const { data } = supabase.storage.from("tus").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const saveRecents = async (recents: string[]) => {
    try {
      await AsyncStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recents));
    } catch (e) {
      console.error("Error saving recent searches:", e);
    }
  };

  const saveRecentStores = async (recentStoresList: StoreApplication[]) => {
    try {
      // Store only the IDs and essential data to save space
      const storesToSave = recentStoresList.map(store => ({
        id: store.id,
        store_name: store.store_name,
        address: store.address,
        photos_url: store.photos_url,
        user_id: store.user_id,
        description: store.description,
        tags: store.tags,
        latitude: store.latitude,
        longitude: store.longitude,
      }));
      await AsyncStorage.setItem(RECENT_STORES_STORAGE_KEY, JSON.stringify(storesToSave));
    } catch (e) {
      console.error("Error saving recent stores:", e);
    }
  };

  const addRecentStore = (store: StoreApplication) => {
    setRecentStores((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.id !== store.id);
      // Add to beginning and limit to MAX_RECENT_STORES
      const next = [store, ...filtered].slice(0, MAX_RECENT_STORES);
      saveRecentStores(next);
      return next;
    });
  };

  const handleSearchSubmit = () => {
    const term = searchQuery.trim();
    setIsSearchActive(true);
    if (!term) return;
    setRecentSearches((prev) => {
      const exists = prev.find((s) => s.toLowerCase() === term.toLowerCase());
      let next: string[];
      if (exists) {
        next = [term, ...prev.filter((s) => s.toLowerCase() !== term.toLowerCase())];
      } else {
        next = [term, ...prev.slice(0, MAX_RECENT_SEARCHES - 1)];
      }
      saveRecents(next);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setIsSearchActive(false);
  };

  const toggleTag = (tag: TagItem) => {
    setSelectedTags((prevTags) => {
      const isSelected = prevTags.some((t) => t.id === tag.id);
      const nextTags = isSelected
        ? prevTags.filter((t) => t.id !== tag.id)
        : [...prevTags, tag];

      setIsSearchActive(nextTags.length > 0 || searchQuery.trim().length > 0);
      return nextTags;
    });
  };

  // SidePanel Controls
  const openTagPanel = () => {
    setIsTagPanelOpen(true);
    Animated.timing(sidePanelAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: false,
    }).start();
  };

  const closeTagPanel = () => {
    Animated.timing(sidePanelAnim, {
      toValue: -SIDEPANEL_WIDTH,
      duration: 200,
      useNativeDriver: false,
    }).start(() => setIsTagPanelOpen(false));
  };

  // --- Effects ---
  useEffect(() => {
    const loadRecents = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENTS_STORAGE_KEY);
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Error loading recent searches:", e);
      }
    };
    loadRecents();
  }, []);

  useEffect(() => {
    const loadRecentStores = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_STORES_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as StoreApplication[];
          setRecentStores(parsed);
        }
      } catch (e) {
        console.error("Error loading recent stores:", e);
      }
    };
    loadRecentStores();
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      setTagsLoading(true);
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .order("name", { ascending: true });
      if (!error && data) {
        setAllTags(data as TagItem[]);
      } else if (error) {
        console.error("Error fetching tags:", error);
      }
      setTagsLoading(false);
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("store_applications")
        .select("*")
        .eq("status", "accepted");

      if (error) {
        console.error("Error fetching stores:", error);
      } else if (data) {
        const sorted = (data as StoreApplication[]).sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
        setStores(sorted);
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "" && selectedTags.length === 0) {
      setIsSearchActive(false);
    } else {
      setIsSearchActive(true);
    }
  }, [searchQuery, selectedTags.length]);

  useEffect(() => {
    if (Platform.OS === "web" && scrollViewRef.current) {
      const node = scrollViewRef.current;
      // @ts-ignore
      if (node && node instanceof HTMLElement) {
        node.style.overscrollBehavior = "contain";
        // @ts-ignore
        node.style.WebkitOverscrollBehavior = "contain";
      }
    }
  });

  // --- Filtered Results Logic ---
  const filteredStores = useMemo(() => {
    if (!isSearchActive) return [];
    const query = searchQuery.trim().toLowerCase();
    const selectedTagNames = selectedTags.map(t => t.name);
    return stores.filter((store) => {
      const matchesSearch = !query ||
        store.store_name?.toLowerCase().includes(query) ||
        store.address?.toLowerCase().includes(query) ||
        store.description?.toLowerCase().includes(query);

      const matchesTags = selectedTags.length === 0 ||
        (store.tags && store.tags.some(tag => selectedTagNames.includes(tag)));

      return matchesSearch && matchesTags;
    });
  }, [stores, searchQuery, selectedTags, isSearchActive]);

  // --- Components ---
  function BlackHeader() {
    return (
      <View style={styles.searchHeaderContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButtonTopLeft}
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, left: 12, bottom: 12, right: 12 }}
          >
            <Icon name="arrow-back" size={25} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.blackHeaderText}>Search stores</Text>
        </View>
      </View>
    );
  }

  function StoreCard({ store }: { store: StoreApplication }) {
    const photoFilename = store.photos_url?.[0] || null;
    const photoUrl = getStorageUrl(photoFilename, store.user_id);

    return (
      <TouchableOpacity
        key={store.id}
        style={styles.storeCard}
        onPress={() => {
          setSelectedStore(store);
          addRecentStore(store);
        }}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.storeImage} />
        ) : (
          <View style={styles.storeImagePlaceholder}>
            <Icon name="image-outline" size={40} color="#999" />
          </View>
        )}

        <View style={styles.storeContent}>
          <Text style={styles.storeName}>
            {store.store_name || "Unnamed Store"}
          </Text>
          <View style={styles.addressContainer}>
            <Icon name="location-outline" size={14} color="#be3e3e" />
            <Text style={styles.storeAddress} numberOfLines={1}>
              {store.address || "No address"}
            </Text>
          </View>
          {store.description && (
            <Text style={styles.storeDescription} numberOfLines={2}>
              {store.description}
            </Text>
          )}
          {store.tags && store.tags.length > 0 && (
            <View style={styles.storeTagsContainer}>
              {store.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.storeTag}>
                  <Text style={styles.storeTagText}>{tag}</Text>
                </View>
              ))}
              {store.tags.length > 3 && (
                <Text style={styles.moreTagsText}>+{store.tags.length - 3}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // --- Tag Filter Side Panel ---
  function TagSidePanel() {
    if (!isTagPanelOpen) return null;
    return (
      <View style={styles.sidePanelLayer}>
        <Pressable style={styles.sidePanelBackdrop} onPress={closeTagPanel} />
        <Animated.View
          style={[
            styles.sidePanel,
            {
              width: SIDEPANEL_WIDTH,
              right: sidePanelAnim,
              transform: [
                { translateX: sidePanelAnim },
              ],
            },
          ]}
        >
          <View style={styles.sidePanelHeader}>
            <Text style={styles.panelWhiteTitle}>Filter by Tags</Text>
            <TouchableOpacity onPress={closeTagPanel} style={styles.sidePanelCloseButton}>
              <Icon name="close" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ height: 6 }} />
          {tagsLoading ? (
            <ActivityIndicator size="small" color="#9333ea" />
          ) : (
            <ScrollView
              contentContainerStyle={styles.panelTagsContent}
              showsVerticalScrollIndicator
              style={{ flex: 1 }}
            >
              {/* Tag chips in the panel: NOW SAME LENGTH as below the search bar */}
              <View style={styles.panelTagsRowWrap}>
                {allTags.map((tag) => {
                  const isSelected = selectedTags.some((t) => t.id === tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tagChip,
                        styles.panelTagChip,
                        isSelected ? styles.tagChipSelected : styles.tagChipUnselected,
                        !isSelected && { backgroundColor: TAG_BG_UNSELECTED, borderColor: "#232837" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          isSelected ? styles.tagTextSelected : [styles.tagTextUnselected, { color: "#fff" }],
                        ]}
                      >
                        {tag.name}
                      </Text>
                      {isSelected && (
                        <Icon name="close" size={14} color="#fff" style={styles.tagCloseIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                {allTags.length === 0 && !tagsLoading && (
                  <Text style={{ color: "#aaa", fontSize: 13 }}>No tags available</Text>
                )}
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    );
  }

  // Inline selected tag "badges"
  function SelectedTagBadges() {
    if (selectedTags.length === 0) return null;
    return (
      <ScrollView
        style={styles.selectedTagsInlineScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectedTagsInlineContainer}
      >
        {selectedTags.map(tag => (
          <View key={tag.id} style={[styles.tagChip, styles.selectedTagBadgeInline, styles.tagChipSelected]}>
            <Text style={[styles.tagText, styles.tagTextSelected]}>{tag.name}</Text>
            <TouchableOpacity
              onPress={() => toggleTag(tag)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={14} color="#fff" style={styles.tagCloseIcon} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    );
  }

  // --- Main Render ---
  let mainContent;
  if (isSearchActive) {
    if (loading) {
      mainContent = <ActivityIndicator size="large" style={styles.loader} color="#9333ea" />;
    } else if (filteredStores.length > 0) {
      mainContent = (
        <View style={styles.resultsContainer}>
          {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </View>
      );
    } else {
      mainContent = (
        <View style={styles.emptyState}>
          <Icon name="search-outline" size={60} color="#ccc" />
          <Text style={styles.emptyStateText}>No stores found</Text>
          <Text style={styles.emptyStateSubtext}>
            Try adjusting your search or filters
          </Text>
        </View>
      );
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#151515" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={Platform.OS !== "ios" ? true : false}
      >
        <BlackHeader />
        <View style={{ height: 22 }} />

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search stores..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor="#999"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
            >
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {/* Button to open tags side panel (always visible) */}
          <TouchableOpacity
            onPress={openTagPanel}
            style={styles.filterButton}
            accessibilityLabel="Open tags filter"
          >
            <Icon name="filter" size={20} color="#9333ea" />
          </TouchableOpacity>
        </View>

        {/* Selected tag badges under search bar */}
        <SelectedTagBadges />

        {/* Clear Filters Button */}
        {(searchQuery.length > 0 || selectedTags.length > 0) && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Icon name="close-circle-outline" size={16} color="#9333ea" />
            <Text style={styles.clearButtonText}>Clear all filters</Text>
          </TouchableOpacity>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && !isSearchActive && (
          <View style={styles.recentsSection}>
            <View style={styles.recentsHeader}>
              <Text style={styles.recentsLabel}>Recent searches</Text>
              <TouchableOpacity onPress={() => {
                setRecentSearches([]);
                AsyncStorage.removeItem(RECENTS_STORAGE_KEY);
              }} style={styles.clearRecentsButton}>
                <Icon name="trash-outline" size={15} color="#9333ea" />
                <Text style={styles.clearRecentsText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentsScroll}
              contentContainerStyle={styles.recentsContainer}
            >
              {recentSearches.map((term, idx) => (
                <TouchableOpacity
                  key={term + idx}
                  onPress={() => {
                    setSearchQuery(term);
                    setIsSearchActive(true);
                    handleSearchSubmit();
                  }}
                  style={styles.recentChip}
                >
                  <Icon name="time-outline" size={13} color="#9333ea" />
                  <Text style={styles.recentText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recently Viewed Stores */}
        {recentStores.length > 0 && !isSearchActive && (
          <View style={styles.recentStoresSection}>
            <View style={styles.recentsHeader}>
              <Text style={styles.recentsLabel}>Recently viewed</Text>
              <TouchableOpacity onPress={() => {
                setRecentStores([]);
                AsyncStorage.removeItem(RECENT_STORES_STORAGE_KEY);
              }} style={styles.clearRecentsButton}>
                <Icon name="trash-outline" size={15} color="#9333ea" />
                <Text style={styles.clearRecentsText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentStoresScroll}
              contentContainerStyle={styles.recentStoresContainer}
            >
              {recentStores.map((store) => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.recentStoreCard}
                  onPress={() => {
                    setSelectedStore(store);
                    addRecentStore(store);
                  }}
                >
                  {getStorageUrl(store.photos_url?.[0] || null, store.user_id) ? (
                    <Image
                      source={{ uri: getStorageUrl(store.photos_url?.[0] || null, store.user_id) || '' }}
                      style={styles.recentStoreImage}
                    />
                  ) : (
                    <View style={styles.recentStoreImagePlaceholder}>
                      <Icon name="image-outline" size={30} color="#999" />
                    </View>
                  )}
                  <View style={styles.recentStoreContent}>
                    <Text style={styles.recentStoreName} numberOfLines={1}>
                      {store.store_name || "Unnamed Store"}
                    </Text>
                    {store.address && (
                      <View style={styles.recentStoreAddressContainer}>
                        <Icon name="location-outline" size={12} color="#be3e3e" />
                        <Text style={styles.recentStoreAddress} numberOfLines={1}>
                          {store.address}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Content (Results/Loader/Empty State) */}
        {mainContent}
      </ScrollView>

      <TagSidePanel />

      <StoreProfileModal
        visible={Boolean(selectedStore)}
        store={selectedStore}
        onClose={() => setSelectedStore(null)}
      />

      <BottomNav visible />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchHeaderContainer: {
    width: 430,
    height: 210,
    borderRadius: 45,
    backgroundColor: "#191820",
    alignSelf: "center",
    marginTop: Platform.OS === "android" ? -16 : -10,
    marginBottom: 0,
    overflow: "hidden",
    zIndex: 9,
    elevation: 9,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    position: "relative",
    justifyContent: "flex-end",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    left: 0,
    top: 0,
    width: '100%',
    paddingTop: (Platform.OS === "ios" ? 24 : ANDROID_STATUSBAR_HEIGHT) + 20,
    paddingLeft: 4,
    zIndex: 30,
  },
  backButtonTopLeft: {
    marginTop: 30,
    marginLeft: 10,
    padding: 4,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  blackHeaderText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 25,
    letterSpacing: 0.5,
    lineHeight: 42,
    marginLeft: 4,
    marginTop: 30,
  },
  searchHeaderContent: {
    height: '100%',
    paddingBottom: 24,
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === "web"
      ? {
          overscrollBehavior: "contain",
          // @ts-ignore - for webkit compatibility
          WebkitOverscrollBehavior: "contain",
        }
      : {}),
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 0,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  filterButton: {
    marginLeft: 10,
    padding: 6,
    backgroundColor: "#f4f2fa",
    borderRadius: 18,
    borderColor: "#ede9fe",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTagsInlineScroll: {
    marginHorizontal: 20,
    minHeight: 34,
    maxHeight: 36,
    marginBottom: 2,
  },
  selectedTagsInlineContainer: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 2,
  },
  selectedTagBadgeInline: {
    marginRight: 4,
    marginBottom: 2,
    backgroundColor: "#9333ea",
  },
  // Side Panel Styles
  sidePanelLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.13)",
  },
  sidePanelBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  sidePanel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    // 90% opacity
    backgroundColor: "rgba(25,24,32,0.9)",
    shadowColor: "#151515",
    shadowOpacity: 0.19,
    shadowRadius: 15,
    shadowOffset: { width: -3, height: 3 },
    elevation: 10,
    borderTopLeftRadius: 45,
    borderBottomLeftRadius: 45,
    paddingTop: TOP_INSET + 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    maxWidth: 350,
    minWidth: 240,
  },
  sidePanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sidePanelTitle: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: "700",
    color: "#9333ea",
  },
  // Style for white "Filter by Tags" in side panel
  panelWhiteTitle: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: "700",
    color: "#fff",
  },
  sidePanelCloseButton: {
    padding: 6,
    marginRight: -6,
    marginTop: 20,
  },
  panelTagsContent: {
    paddingTop: 6,
    paddingBottom: 40,
    paddingRight: 6,
    // No gap here, use wrap instead for grid effect!
  },
  // Make panel chips same as "tagChip"
  panelTagsRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  panelTagChip: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    // Make width auto, just like below search bar tags
  },

  tagsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginLeft: 20,
    marginBottom: 12,
  },
  // Style for white "Filter by Tags" in tags section
  filterWhiteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 20,
    marginBottom: 12,
  },
  tagsScroll: {
    marginBottom: 10,
  },
  tagsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginRight: 0,
    marginBottom: 0,
  },
  tagChipSelected: {
    backgroundColor: "#9333ea",
  },
  tagChipUnselected: {
    backgroundColor: TAG_BG_UNSELECTED,
    borderWidth: 1,
    borderColor: "#232837",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#fff",
  },
  tagTextUnselected: {
    color: "#fff",
  },
  tagCloseIcon: {
    marginLeft: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginLeft: 20,
    marginBottom: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  clearButtonText: {
    color: "#9333ea",
    fontSize: 14,
    fontWeight: "600",
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  storeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  storeImage: {
    width: 120,
    height: 120,
    resizeMode: "cover",
  },
  storeImagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  storeContent: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
  },
  storeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#494848",
    marginBottom: 6,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: "#be3e3e",
    flex: 1,
  },
  storeDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
    marginBottom: 8,
  },
  storeTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  storeTag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storeTagText: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
  },
  loader: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  // ---- Recent Search styles ----
  recentsSection: {
    marginBottom: 16,
    marginTop: -4,
  },
  recentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginLeft: 20,
    marginBottom: 6,
    marginRight: 18,
  },
  recentsLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    opacity: 0.83,
    marginRight: 8,
  },
  clearRecentsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 3,
  },
  clearRecentsText: {
    fontSize: 13,
    color: "#9333ea",
    fontWeight: "600",
    marginLeft: 3,
    paddingTop: 1,
  },
  recentsScroll: {},
  recentsContainer: {
    paddingHorizontal: 20,
    gap: 9,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f2fa",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    gap: 6,
    borderColor: "#ede9fe",
    borderWidth: 1,
  },
  recentText: {
    fontSize: 13,
    color: "#9333ea",
    fontWeight: "500",
  },
  // ---- Recently Viewed Stores styles ----
  recentStoresSection: {
    marginBottom: 16,
    marginTop: -4,
  },
  recentStoresScroll: {
    marginTop: 6,
  },
  recentStoresContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  recentStoreCard: {
    width: 160,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recentStoreImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  recentStoreImagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  recentStoreContent: {
    padding: 10,
  },
  recentStoreName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#494848",
    marginBottom: 4,
  },
  recentStoreAddressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recentStoreAddress: {
    fontSize: 11,
    color: "#be3e3e",
    flex: 1,
  },
});