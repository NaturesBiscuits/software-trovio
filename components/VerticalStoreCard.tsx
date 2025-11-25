import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getStorageImageUrl } from '../lib/storageUtils';

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
}

interface VerticalStoreCardProps {
  store: StoreApplication;
  onPress?: () => void;
}

export default function VerticalStoreCard({ store, onPress }: VerticalStoreCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Load image asynchronously
  useEffect(() => {
    const loadImage = async () => {
      const photoFilename = store.photos_url && store.photos_url.length > 0 
        ? store.photos_url[0] 
        : null;
      
      if (photoFilename && store.user_id) {
        setImageLoading(true);
        const url = await getStorageImageUrl(photoFilename, store.user_id);
        setPhotoUrl(url);
        setImageLoading(false);
      } else {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [store.photos_url, store.user_id]);

  return (
    <TouchableOpacity
      key={store.id}
      style={styles.verticalCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {photoUrl && !imageLoading ? (
          <Image 
            source={{ uri: photoUrl }} 
            style={styles.verticalImg} 
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

