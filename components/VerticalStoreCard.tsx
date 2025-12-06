import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getCachedImageUrls } from '../lib/imageCache';

export interface StoreApplication {
  id: string;
  user_id: string | null;
  full_name: string | null;
  store_name: string | null;
  address: string | null;
  photos_url: string[] | null;
  status: string | null;
  created_at: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
  final_score?: number;
}

interface VerticalStoreCardProps {
  store: StoreApplication;
  onPress?: () => void;
}

export default function VerticalStoreCard({ store, onPress }: VerticalStoreCardProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Load image asynchronously with caching
  useEffect(() => {
    let isActive = true;
    const loadImages = async () => {
      if (store.photos_url?.length && store.user_id) {
        setImageLoading(true);
        // Use cached image URLs (cached in AsyncStorage, won't re-fetch if valid)
        const urls = await getCachedImageUrls(store.photos_url, store.user_id);
        if (!isActive) return;
        const filtered = urls.filter((url): url is string => Boolean(url));
        setImageUrls(filtered);
        setCurrentPhotoIndex(0);
      } else {
        setImageUrls([]);
      }
      if (isActive) setImageLoading(false);
    };

    loadImages();
    return () => {
      isActive = false;
    };
  }, [store.photos_url, store.user_id]);

  // Auto-rotate images
  useEffect(() => {
    if (imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % imageUrls.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [imageUrls.length]);

  return (
    <TouchableOpacity
      style={styles.verticalCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {imageUrls.length > 0 && !imageLoading ? (
          <Image
            source={{ uri: imageUrls[currentPhotoIndex] }}
            style={styles.verticalImg}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk" // Use disk cache for persistence
            placeholderContentFit="cover"
          />
        ) : (
          <View style={styles.verticalPlaceholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
          </View>
        )}
      </View>
      <View style={styles.verticalContent}>
        <Text style={styles.verticalTitle}>{store.store_name || 'Unnamed Store'}</Text>
        <View style={styles.verticalRow}>
          <Icon name="location-outline" size={14} color="#be3e3e" />
          <Text style={styles.verticalAddress} numberOfLines={1}>
            {store.address || 'No address'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  verticalCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
  },
  verticalImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  verticalPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  verticalContent: {
    padding: 15,
  },
  verticalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 5,
    color: '#333',
  },
  verticalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalAddress: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
});

