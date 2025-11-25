import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Load image asynchronously
  useEffect(() => {
    const loadImage = async () => {
      const photoFilename = item.photos_url && item.photos_url.length > 0 
        ? item.photos_url[0] 
        : null;
      
      if (photoFilename && item.user_id) {
        setImageLoading(true);
        const url = await getStorageImageUrl(photoFilename, item.user_id);
        setPhotoUrl(url);
        setImageLoading(false);
      } else {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [item.photos_url, item.user_id]);

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
          {photoUrl && !imageLoading ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.discoverImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderIcon}>📷</Text>
            </View>
          )}
          <View style={styles.cardOverlayInvisible}>
            <Text style={styles.cardTitleInvisible}>{item.store_name || 'Unnamed Store'}</Text>
            <View style={styles.cardRowInvisible}>
              <Icon name="location-outline" size={14} color="#be3e3e" />
              <Text style={styles.cardSubtitleInvisible}>{item.address || 'No address'}</Text>
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
  cardOverlayInvisible: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  },
  cardTitleInvisible: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textShadowColor: undefined,
    textShadowOffset: undefined,
    textShadowRadius: 0,
  },
  cardSubtitleInvisible: {
    fontSize: 12,
    color: '#be3e3e',
    marginTop: 2,
    textShadowColor: undefined,
    textShadowOffset: undefined,
    textShadowRadius: 0,
  },
  cardRowInvisible: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
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

