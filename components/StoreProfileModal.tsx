import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  Platform,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import { getCachedImageUrls } from '../lib/imageCache';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StoreApplication } from './DiscoverFlipCard';
import StoreRouteMap from './StoreRouteMap';

const { width: deviceWidth } = Dimensions.get('window');
const PLACEHOLDER_WIDTH = Math.min(350, deviceWidth - 40);
const PLACEHOLDER_HEIGHT = 220;

// Use persistent heart storage
const SAVED_STORE_IDS_KEY = 'saved_store_ids_v1';

interface StoreProfileModalProps {
  visible: boolean;
  store: StoreApplication | null;
  onClose: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
}

export async function getSavedStoreIds(): Promise<string[]> {
  try {
    const idsStr = await AsyncStorage.getItem(SAVED_STORE_IDS_KEY);
    if (!idsStr) return [];
    return JSON.parse(idsStr);
  } catch {
    return [];
  }
}

export async function addSavedStoreId(storeId: string) {
  const ids = await getSavedStoreIds();
  if (!ids.includes(storeId)) {
    ids.push(storeId);
    await AsyncStorage.setItem(SAVED_STORE_IDS_KEY, JSON.stringify(ids));
  }
}

export async function removeSavedStoreId(storeId: string) {
  let ids = await getSavedStoreIds();
  if (ids.includes(storeId)) {
    ids = ids.filter(id => id !== storeId);
    await AsyncStorage.setItem(SAVED_STORE_IDS_KEY, JSON.stringify(ids));
  }
}

/**
 * You can import { getSavedStoreIds } from this file in
 * @software-trovio/app/(tabs)/savedstores.tsx to show all the stores that are hearted here.
 */

export default function StoreProfileModal({
  visible,
  store,
  onClose,
  userCoords,
}: StoreProfileModalProps) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList<string>>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isStoreOwner, setIsStoreOwner] = useState(false);
  const lastLoggedViewRef = useRef<{ storeId: string | null; visibleAt: number }>({
    storeId: null,
    visibleAt: 0,
  });

  // Per-store heart state and for showing saved message
  const [isLiked, setIsLiked] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Sync isLiked state with AsyncStorage on store change/modal open
  useEffect(() => {
    let ignore = false;
    if (store?.id) {
      getSavedStoreIds().then(ids => {
        if (!ignore) setIsLiked(ids.includes(store.id!));
        setShowSaved(false);
      });
    }
    return () => { ignore = true; };
  }, [store?.id, visible]);

  // Record a store profile view whenever a signed-in, non-owner user opens the modal
  useEffect(() => {
    if (!visible || !store?.id || !store.user_id) {
      return;
    }

    const now = Date.now();
    if (
      lastLoggedViewRef.current.storeId === store.id &&
      now - lastLoggedViewRef.current.visibleAt < 2000
    ) {
      // Debounce duplicate log attempts happening in quick succession for the same store
      return;
    }
    lastLoggedViewRef.current = { storeId: store.id, visibleAt: now };

    const logProfileView = async () => {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser();
        const viewerId = userData?.user?.id;

        if (authError || !viewerId || viewerId === store.user_id) {
          return;
        }

        const { data: favoriteRow } = await supabase
          .from('user_favorite_stores')
          .select('store_id')
          .eq('user_id', viewerId)
          .eq('store_id', store.id)
          .limit(1)
          .maybeSingle();

        await supabase.from('store_profile_views').insert({
          store_id: store.id,
          store_owner_id: store.user_id,
          viewed_by: viewerId,
          is_follower: Boolean(favoriteRow),
        });
      } catch (logError) {
        console.error('Error logging store profile view:', logError);
      }
    };

    logProfileView();
  }, [visible, store?.id, store?.user_id]);

  // Handle heart-press, persist to AsyncStorage
  const handleHeartPress = async () => {
    if (!store?.id) return;

    // Ensure we have an authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (userError || !userId) {
      alert('You need to be signed in to save stores.');
      return;
    }

    if (!isLiked) {
      // Optimistic UI update
      setIsLiked(true);
      setShowSaved(true);

      // Persist locally for saved-stores screen
      await addSavedStoreId(store.id);

      // Persist in Supabase favorites table
      const { error: insertError } = await supabase
        .from('user_favorite_stores')
        .insert([{ user_id: userId, store_id: store.id }]);

      if (insertError) {
        // If it's a uniqueness violation, we can safely ignore since the row already exists
        const message = insertError.message || '';
        const isUniqueViolation =
          insertError.code === '23505' ||
          message.toLowerCase().includes('duplicate key') ||
          message.toLowerCase().includes('already exists');

        if (isUniqueViolation) {
          setTimeout(() => {
            setShowSaved(false);
          }, 2000);
          return;
        }

        // Roll back optimistic update on failure
        setIsLiked(false);
        setShowSaved(false);
        await removeSavedStoreId(store.id);
        console.error('Error saving favorite store:', insertError);
        alert('Failed to save this store. Please try again.');
        return;
      }

      setTimeout(() => {
        setShowSaved(false);
      }, 2000);
    } else {
      // Unfavorite
      setIsLiked(false);
      setShowSaved(false);

      // Remove from local storage
      await removeSavedStoreId(store.id);

      // Remove from Supabase favorites table
      const { error: deleteError } = await supabase
        .from('user_favorite_stores')
        .delete()
        .match({ user_id: userId, store_id: store.id });

      if (deleteError) {
        console.error('Error removing favorite store:', deleteError);
        // No user-facing rollback here; the local state already reflects intent.
      }
    }
  };

  // Load store photos when modal opens or changes
  useEffect(() => {
    if (!visible) {
      setPhotoUrls([]);
      setCarouselIndex(0);
      return;
    }
    const loadPhotos = async () => {
      if (!store || !Array.isArray(store.photos_url) || !store.photos_url.length || !store.user_id) {
        setPhotoUrls([]);
        setCarouselIndex(0);
        return;
      }
      setLoadingPhotos(true);
      try {
        const urls = await getCachedImageUrls(store.photos_url, store.user_id);
        setPhotoUrls(urls.filter((url): url is string => Boolean(url)));
      } catch (error) {
        setPhotoUrls([]);
      } finally {
        setLoadingPhotos(false);
        setCarouselIndex(0);
      }
    };
    loadPhotos();
  }, [store?.photos_url, store?.user_id, visible, store]);

  // Only show upload if user is the store owner
  useEffect(() => {
    let isMounted = true;

    const checkStoreOwner = async () => {
      if (!store?.user_id) {
        if (isMounted) setIsStoreOwner(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.getUser();
        if (!isMounted || error || !data?.user) {
          if (isMounted) setIsStoreOwner(false);
          return;
        }

        if (isMounted) {
          setIsStoreOwner(data.user.id === store.user_id);
        }
      } catch {
        if (isMounted) setIsStoreOwner(false);
      }
    };

    checkStoreOwner();

    return () => {
      isMounted = false;
    };
  }, [store?.user_id, visible]);

  // Handle photo upload (multiple images)
  const handleImagePicker = async () => {
    try {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        alert('You need to enable permission to access photos!');
        return;
      }
      let pickedResult = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        selectionLimit: 10,
        // No cropping for batch upload
      });

      if (pickedResult.canceled) return;

      let files: ImagePicker.ImagePickerAsset[] = pickedResult.assets || [];

      // Upload each file to Supabase Storage
      if (!store?.user_id || !store.id) return;
      setUploading(true);

      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (!file.uri) continue;
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const response = await fetch(file.uri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
          .from('user-uploaded-photos')
          .upload(`${store.user_id}/${filename}`, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          // Logging error is fine, but do not continue
          console.error('Error uploading photo:', error);
          continue;
        }

        // Construct the path for storage retrieval:
        uploadedUrls.push(`${store.user_id}/${filename}`);
      }

      // Append to store.photos_url in DB
      if (uploadedUrls.length) {
        const photoArray = Array.isArray(store.photos_url) ? store.photos_url : [];
        const newPhotosArray = [...photoArray, ...uploadedUrls];
        await supabase
          .from('store_applications')
          .update({ photos_url: newPhotosArray })
          .eq('id', store.id);

        const newPhotoUrls = await getCachedImageUrls(uploadedUrls, store.user_id!);
        setPhotoUrls(prev => prev.concat(newPhotoUrls.filter(Boolean) as string[]));
      }
    } catch (e) {
      alert('Failed to upload photo(s)');
    } finally {
      setUploading(false);
    }
  };

  // Carousel navigation logic for FlatList
  const onViewRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCarouselIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  // For arrow button navigation (not used anymore)
  // const scrollToIndex = (idx: number) => {
  //   setCarouselIndex(idx);
  //   flatListRef.current?.scrollToIndex({ index: idx, animated: true });
  // };

  if (!store) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{store.store_name || 'Store profile'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Carousel Area (no 'Gallery' text and dots inside photos - white, smaller) */}
        <View style={{ alignItems: 'center', marginBottom: 18 }}>
          {loadingPhotos ? (
            <ActivityIndicator style={{ marginTop: 16 }} />
          ) : photoUrls.length > 0 ? (
            <View style={styles.carouselContainerNoBG}>
              {/* Swipeable Carousel using FlatList */}
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
                    {/* Dots overlayed inside photo, at bottom center */}
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
                contentContainerStyle={{ alignItems: 'center' }}
              />
              {/* Arrows removed */}
            </View>
          ) : (
            <View style={styles.photoPlaceholderContainer}>
              <Icon name="image-outline" size={52} color="#bbb" />
              <Text style={styles.placeholderText}>Store photos will appear here</Text>
              <Text style={styles.placeholderSubtext}>Size: 350 x 180</Text>
            </View>
          )}
          {isStoreOwner && (
            <TouchableOpacity
              style={styles.uploadBtn}
              onPress={handleImagePicker}
              disabled={uploading}
              activeOpacity={0.67}
            >
              <Icon name="cloud-upload-outline" size={18} color="#fff" />
              <Text style={styles.uploadBtnText}>
                {uploading ? 'Uploading...' : 'Upload Photo(s)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unified Info Card for Description, Address, Tags, and Map */}
        <View style={styles.infoCard}>
          {/* Heart button on the right side of the description container with "saved" message */}
          {store.description ? (
            <>
              <View style={styles.descriptionRow}>
                <Text style={styles.sectionTitle}>Description</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.heartButton}
                  onPress={handleHeartPress}
                  activeOpacity={0.7}
                  testID="description-heart"
                >
                  <Icon
                    name={isLiked ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isLiked ? 'red' : '#aaa'}
                  />
                </TouchableOpacity>
                {isLiked && showSaved && (
                  <Text style={styles.savedMessage}>Saved</Text>
                )}
              </View>
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
          {typeof store.latitude === 'number' &&
          typeof store.longitude === 'number' ? (
            <StoreRouteMap
              origin={userCoords ?? undefined}
              destination={{ latitude: store.latitude, longitude: store.longitude }}
            />
          ) : (
            <Text style={styles.emptyText}>Location unavailable.</Text>
          )}
        </View>

        {/* Current Promotions Container */}
        <View style={styles.promotionsCard}>
          <Text style={styles.promotionsTitle}>Current Promotions</Text>
          {/* You may add dynamic promotions data display here in the future */}
          <Text style={styles.promotionsText}>
            No promotions currently available.
          </Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

// @ts-ignore: PLACEHOLDER_WIDTH may not be a static value for StyleSheet -- safe in practice
const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  // Heart button style for inside the infoCard beside Description (right side)
  heartButton: {
    marginLeft: 10,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  // "saved" message style
  savedMessage: {
    marginLeft: 6,
    fontSize: 13,
    color: 'red',
    fontWeight: '600',
    alignSelf: 'center',
  },
  // Row for section header (Description) + push heart to right side
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  // Carousel Area (No BG behind photos)
  carouselContainerNoBG: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT + 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 8,
    position: 'relative',
  },
  carouselScrollNoBG: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    borderRadius: 16,
    // No backgroundColor, remove box
  },
  carouselImageWrapperNoBG: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 0,
    borderRadius: 16,
    // No backgroundColor, remove box
    position: 'relative',
  },
  carouselImage: {
    width: PLACEHOLDER_WIDTH,
    height: PLACEHOLDER_HEIGHT,
    borderRadius: 16,
  },
  // Dots overlay *inside* the carousel image at the bottom center
  dotsContainerInPhoto: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 5,
  },
  arrowsContainer: {
    // Removed arrow buttons, keep style for legacy
    display: 'none',
  },
  arrowButton: {
    // Remove arrow button style
    display: 'none',
  },
  dotsContainer: {
    // Not used anymore, but kept for compatibility
    display: 'none',
  },
  dotSmallWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  activeDotSmallWhite: {
    backgroundColor: '#fff',
    opacity: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  photoPlaceholderContainer: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
    // No background box
  },
  // Removed photoPlaceholder style: no box behind
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#aaa',
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
  },
  // Upload button
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4f63d2',
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: -10,
    minWidth: 120,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
  // Info Card and shared styles
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  descriptionText: {
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // 'gap' is not yet supported in react-native StyleSheet, replaced with margin.
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: '#eef1ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: '#4f63d2',
    fontWeight: '600',
  },
  emptyText: {
    color: '#777',
    marginBottom: 12,
  },
  // Promotions card styles
  promotionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 34,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  promotionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  promotionsText: {
    color: '#444',
    fontSize: 15,
    marginBottom: 6,
  },
});