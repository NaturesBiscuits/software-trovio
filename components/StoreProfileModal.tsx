import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getStorageImageUrls } from '../lib/storageUtils';
import { supabase } from '../lib/supabase';
import type { StoreApplication } from './DiscoverFlipCard';
import StoreRouteMap from './StoreRouteMap';

interface StoreProfileModalProps {
  visible: boolean;
  store: StoreApplication | null;
  onClose: () => void;
  userCoords?: { latitude: number; longitude: number } | null;
}

interface OwnerProfile {
  username?: string;
  avatar_url?: string;
}

export default function StoreProfileModal({
  visible,
  store,
  onClose,
  userCoords,
}: StoreProfileModalProps) {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchOwner = async () => {
      if (!store?.user_id) {
        setOwner(null);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', store.user_id)
        .single();
      if (data) setOwner(data);
    };
    fetchOwner();
  }, [store?.user_id, visible]);

  useEffect(() => {
    if (!visible) {
      setPhotoUrls([]);
      return;
    }
    const loadPhotos = async () => {
      if (!store?.photos_url?.length || !store.user_id) {
        setPhotoUrls([]);
        return;
      }
      setLoadingPhotos(true);
      const urls = await getStorageImageUrls(store.photos_url, store.user_id);
      setPhotoUrls(urls.filter((url): url is string => Boolean(url)));
      setLoadingPhotos(false);
    };
    loadPhotos();
  }, [store?.photos_url, store?.user_id, visible]);

  if (!store) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{store.store_name || 'Store profile'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Collage */}
        <Text style={styles.sectionTitle}>Gallery</Text>
        {loadingPhotos ? (
          <ActivityIndicator style={{ marginVertical: 16 }} />
        ) : photoUrls.length ? (
          <View style={styles.collageGrid}>
            {photoUrls.map((url, idx) => (
              <Image key={`${url}-${idx}`} source={{ uri: url }} style={styles.collageImage} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No photos yet.</Text>
        )}

        {/* Owner */}
        <View style={styles.ownerCard}>
          <Image
            source={{
              uri: owner?.avatar_url || 'https://via.placeholder.com/80',
            }}
            style={styles.ownerAvatar}
          />
          <View>
            <Text style={styles.ownerLabel}>Uploaded by</Text>
            <Text style={styles.ownerName}>{owner?.username || 'Unknown'}</Text>
          </View>
        </View>

        {/* Description */}
        {store.description ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{store.description}</Text>
          </View>
        ) : null}

        {/* Address */}
        {store.address ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.descriptionText}>{store.address}</Text>
          </View>
        ) : null}

        {/* Tags */}
        {store.tags?.length ? (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {store.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Map */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Location & Route</Text>
          {store.latitude && store.longitude ? (
            <StoreRouteMap
              origin={userCoords ?? undefined}
              destination={{ latitude: store.latitude, longitude: store.longitude }}
            />
          ) : (
            <Text style={styles.emptyText}>Location unavailable.</Text>
          )}
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#191820',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
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
  collageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  collageImage: {
    width: '48%',
    height: 140,
    borderRadius: 12,
  },
  emptyText: {
    color: '#777',
    marginBottom: 12,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  ownerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  ownerLabel: {
    color: '#777',
    fontSize: 12,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: '700',
  },
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
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  tagPill: {
    backgroundColor: '#eef1ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    color: '#4f63d2',
    fontWeight: '600',
  },
});

