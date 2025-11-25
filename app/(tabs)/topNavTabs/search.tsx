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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Assuming you need this for recent searches
import Icon from "react-native-vector-icons/Ionicons";
import BottomNav from "../../../components/BottomNav";
import { supabase } from "../../../lib/supabase";
import { useNavigation } from "@react-navigation/native";

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
const MAX_RECENT_SEARCHES = 6; // Limiting recent searches

// Fallback top inset for Android
const ANDROID_STATUSBAR_HEIGHT = StatusBar.currentHeight ?? 0;
// Calculate top inset for status bar/safe area once.
const TOP_INSET = Platform.OS === "ios" ? 24 : ANDROID_STATUSBAR_HEIGHT;

export default function SearchScreen() {
  const navigation = useNavigation();

  // For limiting bounce/overscroll on web
  const scrollViewRef = useRef<any>(null);

  // --- State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false); // Combines searchQuery.length > 0 and selectedTags.length > 0 or hasSearched

  // --- Utility Functions ---

  /**
   * Retrieves the public URL for a storage file.
   */
  const getStorageUrl = (filename: string | null, userId: string | null): string | null => {
    if (!filename || !userId) return null;
    const storagePath = `applications/${userId}/store_photos/${filename}`;
    const { data } = supabase.storage.from("tus").getPublicUrl(storagePath);
    return data.publicUrl;
  };

  /**
   * Handles saving recent searches to Async Storage.
   */
  const saveRecents = async (recents: string[]) => {
    try {
      await AsyncStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(recents));
    } catch (e) {
      console.error("Error saving recent searches:", e);
    }
  };

  /**
   * Handles search logic submission.
   */
  const handleSearchSubmit = () => {
    const term = searchQuery.trim();
    setIsSearchActive(true); // Always activate search on submit

    if (!term) {
      return; // Do not update recents if the search term is empty
    }

    setRecentSearches((prev) => {
      const exists = prev.find((s) => s.toLowerCase() === term.toLowerCase());
      let next: string[];

      if (exists) {
        // Move existing term to the front
        next = [term, ...prev.filter((s) => s.toLowerCase() !== term.toLowerCase())];
      } else {
        // Add new term and limit the list size
        next = [term, ...prev.slice(0, MAX_RECENT_SEARCHES - 1)];
      }

      saveRecents(next); // Persist the updated list
      return next;
    });
  };

  /**
   * Clears all filters: search query and selected tags.
   */
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setIsSearchActive(false);
  };

  /**
   * Toggles selection of a tag.
   */
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

  // --- Effects (Data Fetching & Persistence) ---

  // 1. Fetch & Load Recent Searches (on mount)
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

  // 2. Fetch All Tags (on mount)
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

  // 3. Fetch All Accepted Stores (on mount)
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

  // 4. Update Search Status on input change
  useEffect(() => {
    if (searchQuery.trim() === "" && selectedTags.length === 0) {
      setIsSearchActive(false);
    } else {
      setIsSearchActive(true);
    }
  }, [searchQuery, selectedTags.length]);

  // --- Limit Scroll "Bounce" (rubber-banding/overscroll behavior) ---

  // On web, set overscroll-behavior to block bounce/rubber-banding
  useEffect(() => {
    if (Platform.OS === "web" && scrollViewRef.current) {
      const node = scrollViewRef.current;
      // React Native Web: setting style directly
      if (node && node instanceof HTMLElement) {
        node.style.overscrollBehavior = "contain";
        node.style.WebkitOverscrollBehavior = "contain"; // for Safari
      }
    }
  });

  // --- Filtered Results Logic (Optimized with useMemo) ---

  const filteredStores = useMemo(() => {
    if (!isSearchActive) {
        return [];
    }

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

  // Modified: search text is now beside the back button in the header
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
            // Add navigation logic here if applicable, e.g.,
            // navigation.navigate("StoreDetail", { storeId: store.id });
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
        // This prop limits bounce overscroll in iOS native
        bounces={Platform.OS !== "ios" ? true : false}
        // This prop disables scroll indicator "flash" bounce on web, but most important is the web style below
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
          {(searchQuery.length > 0) && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
            >
              <Icon name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

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

        {/* Tags Filter Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Filter by Tags</Text>
          {tagsLoading ? (
            <ActivityIndicator size="small" color="#9333ea" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagsScroll}
              contentContainerStyle={styles.tagsContainer}
            >
              {allTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTag(tag)}
                    style={[
                      styles.tagChip,
                      isSelected ? styles.tagChipSelected : styles.tagChipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        isSelected ? styles.tagTextSelected : styles.tagTextUnselected,
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
            </ScrollView>
          )}
        </View>

        {/* Clear Filters Button */}
        {(searchQuery.length > 0 || selectedTags.length > 0) && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
            <Icon name="close-circle-outline" size={16} color="#9333ea" />
            <Text style={styles.clearButtonText}>Clear all filters</Text>
          </TouchableOpacity>
        )}

        {/* Main Content (Results/Loader/Empty State) */}
        {mainContent}

      </ScrollView>
      <BottomNav visible />
    </View>
  );
}

// NOTE: Styles are largely preserved, but constants have been removed from the style object itself
// and placed outside/in the main component for better separation.

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
    // Row for back button + search text
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      position: "absolute",
      left: 0,
      top: 0,
      width: '100%',
      // Top padding as before
      paddingTop: (Platform.OS === "ios" ? 24 : ANDROID_STATUSBAR_HEIGHT) + 20,
      paddingLeft: 4, // moved left (was 24)
      zIndex: 30,
    },
    // Back button area - a bit lower and much more to the left
    backButtonTopLeft: {
      marginTop: 30,
      marginLeft: 10,        // moved further left (was 8)
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
      marginLeft: 4, // less space between back and text (was 10)
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
            overscrollBehavior: "contain", // web style: prevent bounce
            WebkitOverscrollBehavior: "contain", // webkit for Safari
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
      marginBottom: 20,
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
    },
    tagChipSelected: {
      backgroundColor: "#9333ea",
    },
    tagChipUnselected: {
      backgroundColor: "#f3f4f6",
      borderWidth: 1,
      borderColor: "#e5e7eb",
    },
    tagText: {
      fontSize: 14,
      fontWeight: "500",
    },
    tagTextSelected: {
      color: "#fff",
    },
    tagTextUnselected: {
      color: "#333",
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
});