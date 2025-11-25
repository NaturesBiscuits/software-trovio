import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getStorageImageUrls } from '../lib/storageUtils';

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
}

interface VerticalStoreCardProps {
  store: StoreApplication;
  onPress?: () => void;
}

export default function VerticalStoreCard({ store, onPress }: VerticalStoreCardProps) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load image asynchronously
  useEffect(() => {
    let isActive = true;
    const loadImages = async () => {
      if (store.photos_url?.length && store.user_id) {
        setImageLoading(true);
        const urls = await getStorageImageUrls(store.photos_url, store.user_id);
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

  useEffect(() => {
    if (imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPhotoIndex((prev) => (prev + 1) % imageUrls.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [imageUrls.length, fadeAnim]);

  return (
    <TouchableOpacity
      style={styles.verticalCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {imageUrls.length > 0 && !imageLoading ? (
          <Animated.Image 
            source={{ uri: imageUrls[currentPhotoIndex] }} 
            style={[styles.verticalImg, { opacity: fadeAnim }]} 
            resizeMode="cover"
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

