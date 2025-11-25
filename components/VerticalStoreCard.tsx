import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
  photoUrl: string | null;
  onPress?: () => void;
}

export default function VerticalStoreCard({ store, photoUrl, onPress }: VerticalStoreCardProps) {
  return (
    <TouchableOpacity
      key={store.id}
      style={styles.verticalCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.verticalImg} resizeMode="cover" />
      ) : (
        <View style={styles.verticalPlaceholder}>
          <Text style={styles.placeholderIcon}>📷</Text>
        </View>
      )}
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
  verticalImg: {
    width: '100%',
    height: 200,
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

