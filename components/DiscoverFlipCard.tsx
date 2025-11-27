import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
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
}

interface DiscoverFlipCardProps {
  item: StoreApplication;
  userCoords: { latitude: number; longitude: number } | null;
  showFlipHint: boolean;
  onFirstFlip: () => void;
  isFlipped: boolean;
  flipCard: () => void;
  hasLocationPermission: boolean;
  onViewProfile?: (store: StoreApplication) => void;
}

// Calculate distance outside component to keep it pure
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d * 1000; // Return meters
}

// These constants ensure the name/address container is always the same height
const FIXED_NAME_ADDRESS_CONTAINER_HEIGHT = 60;

export default React.memo(function DiscoverFlipCard({
  item,
  userCoords,
  showFlipHint,
  onFirstFlip,
  isFlipped,
  flipCard,
  hasLocationPermission,
  onViewProfile,
}: DiscoverFlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Load image asynchronously with caching
  useEffect(() => {
    let isActive = true;
    const loadImages = async () => {
      if (item.photos_url?.length && item.user_id) {
        setImageLoading(true);
        // Use cached image URLs (cached in AsyncStorage, won't re-fetch if valid)
        const urls = await getCachedImageUrls(item.photos_url, item.user_id);
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
  }, [item.photos_url, item.user_id]);

  useEffect(() => {
    if (imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % imageUrls.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [imageUrls.length]);

  const { distanceStr, pathLink, locationStatus } = useMemo(() => {
    let status: 'has' | 'no-permission' | 'no-store-location' = 'has';
    let distStr: string | null = null;
    let link: string | null = null;

    if (!hasLocationPermission) status = 'no-permission';
    else if (!item.latitude || !item.longitude) status = 'no-store-location';
    else if (userCoords) {
      const meters = getDistanceFromLatLonInKm(
        userCoords.latitude,
        userCoords.longitude,
        item.latitude,
        item.longitude
      );
      distStr = meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
      link = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${item.latitude},${item.longitude}&travelmode=walking`;
    }

    return { distanceStr: distStr, pathLink: link, locationStatus: status };
  }, [userCoords, item.latitude, item.longitude, hasLocationPermission]);

  useEffect(() => {
    if (isFlipped) onFirstFlip();
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 180 : 0,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [isFlipped, onFirstFlip]);

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
    zIndex: isFlipped ? 0 : 1,
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
    zIndex: isFlipped ? 1 : 0,
  };

  const handleNavigate = () => {
    if (pathLink) Linking.openURL(pathLink);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.discoverCardWrapper}
      onLongPress={flipCard}
      delayLongPress={250}
    >
      {/* FRONT FACE */}
      <Animated.View style={[styles.flipCardFace, frontAnimatedStyle]}>
        <View style={styles.discoverCardContent}>
          {imageUrls.length > 0 && !imageLoading ? (
            <Image
              source={{ uri: imageUrls[currentPhotoIndex] }}
              style={styles.discoverImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk" // Use disk cache for persistence
              placeholderContentFit="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderIcon}>📷</Text>
            </View>
          )}
          {/* White fixed-size container for store name and location, no border radius */}
          <View style={styles.cardOverlayWhiteNoRadiusFixed}>
            <Text
              style={styles.cardTitleWhiteFixed}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.store_name || 'Unnamed Store'}
            </Text>
            <View style={styles.cardRowWhiteFixed}>
              <Icon name="location-outline" size={14} color="#be3e3e" />
              <Text
                style={styles.cardSubtitleWhiteFixed}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.address || 'No address'}
              </Text>
            </View>
          </View>
          {showFlipHint && (
            <View style={styles.flipHint}>
              <Icon name="sync" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.flipHintText}>Hold to flip</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* BACK FACE */}
      <Animated.View style={[styles.flipCardFace, styles.flipCardBack, backAnimatedStyle]}>
        <View style={styles.backContent}>
          <Text style={styles.backTitle}>{item.store_name}</Text>
          <ScrollView style={styles.descScroll} nestedScrollEnabled>
            <Text style={styles.descText}>{item.description || 'No description available.'}</Text>
          </ScrollView>

          <View style={styles.distanceContainer}>
            <Icon name="walk" size={18} color="#468dff" />
            <Text style={styles.distanceText}>
              {locationStatus === 'has' ? `~${distanceStr || '...'}` : 'Loc. Unavailable'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.navButton, { opacity: isFlipped && pathLink ? 1 : 0.5 }]}
            disabled={!isFlipped || !pathLink}
            onPress={handleNavigate}
          >
            <Icon name="navigate-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => onViewProfile?.(item)}
          >
            <Icon name="storefront-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>View Store</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  discoverCardWrapper: {
    width: 220,
    height: 260,
    marginRight: 15,
  },
  flipCardFace: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
  discoverCardContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f5f4f4',
  },
  flipCardBack: {
    padding: 15,
    justifyContent: 'space-between',
  },
  discoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },

  // White fixed-size container for store name/location (no border radius)
  cardOverlayWhiteNoRadiusFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    height: FIXED_NAME_ADDRESS_CONTAINER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    // No border radius
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    // Consistent subtle shadow for separation from photo
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitleWhiteFixed: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
    width: '100%',
  },
  cardSubtitleWhiteFixed: {
    fontSize: 12,
    color: '#be3e3e',
    marginLeft: 4,
    width: '88%', // So icon and address can fit on one line, but text truncates as needed
  },
  cardRowWhiteFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
    width: '100%',
  },

  // Hide the old invisible overlay styles (legacy, not used)
  cardOverlayInvisible: { display: 'none' },
  cardTitleInvisible: { display: 'none' },
  cardSubtitleInvisible: { display: 'none' },
  cardRowInvisible: { display: 'none' },

  flipHint: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 12,
    flexDirection: 'row',
  },
  flipHintText: {
    color: '#fff',
    fontSize: 12,
  },
  backContent: {
    flex: 1,
  },
  backTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  descScroll: {
    maxHeight: 100,
    marginBottom: 10,
  },
  descText: {
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  distanceText: {
    color: '#468dff',
    fontWeight: '600',
    marginLeft: 6,
  },
  navButton: {
    backgroundColor: '#468dff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  profileButton: {
    backgroundColor: '#2b825b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 25,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

