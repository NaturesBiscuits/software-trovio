import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { getCachedImageUrl, getCachedImageUrls } from '../lib/imageCache';
import { recordPromotionClick } from '../lib/engagementTracking';
export type StorePromotion = {
  id: string;
  store_id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  expires_at: string;
  is_active: boolean;
  created_at: string;
};

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
  activePromotion?: StorePromotion | null;
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
  onNavigate?: (store: StoreApplication) => void;
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
  onNavigate,
}: DiscoverFlipCardProps) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [promoImageUrl, setPromoImageUrl] = useState<string | null>(null);
  const [promoImageLoading, setPromoImageLoading] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const loadPromotionImage = async () => {
      if (!item.activePromotion?.image_url || !item.user_id) {
        if (isMounted) {
          setPromoImageUrl(null);
          setPromoImageLoading(false);
        }
        return;
      }

      setPromoImageLoading(true);
      try {
        const url = await getCachedImageUrl(item.activePromotion.image_url, item.user_id, 'tus');
        if (isMounted) {
          setPromoImageUrl(url);
        }
      } finally {
        if (isMounted) {
          setPromoImageLoading(false);
        }
      }
    };

    loadPromotionImage();
    return () => {
      isMounted = false;
    };
  }, [item.activePromotion?.image_url, item.user_id]);

  const { distanceStr, locationStatus } = useMemo(() => {
    let status: 'has' | 'no-permission' | 'no-store-location' = 'has';
    let distStr: string | null = null;

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
    }

    return { distanceStr: distStr, locationStatus: status };
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

  const promotionDurationLabel = useMemo(() => {
    const expires = item.activePromotion?.expires_at ? new Date(item.activePromotion.expires_at) : null;
    if (!expires || Number.isNaN(expires.getTime())) return null;

    const diffMs = expires.getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';

    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) return `Ends in ${days}d ${hours}h`;
    if (hours > 0) return `Ends in ${hours}h ${minutes}m`;
    return `Ends in ${minutes}m`;
  }, [item.activePromotion?.expires_at]);

  const promotionValidUntil = useMemo(() => {
    const expires = item.activePromotion?.expires_at ? new Date(item.activePromotion.expires_at) : null;
    if (!expires || Number.isNaN(expires.getTime())) return null;

    return `Valid until ${expires.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} • ${expires.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }, [item.activePromotion?.expires_at]);

  const hasPromotion = Boolean(item.activePromotion);

  const canNavigate =
    Boolean(onNavigate) &&
    isFlipped &&
    locationStatus === 'has' &&
    typeof item.latitude === 'number' &&
    typeof item.longitude === 'number';

  const renderPromotionFront = () => (
    <View style={styles.promotionCardContent}>
      {promoImageUrl && !promoImageLoading ? (
        <Image
          source={{ uri: promoImageUrl }}
          style={styles.promotionImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={styles.promotionImageFallback}>
          <Icon name="gift-outline" size={42} color="#fff" />
          <Text style={styles.promotionFallbackText}>Promotion image</Text>
        </View>
      )}

      <View style={styles.promotionOverlay}>
        {promotionDurationLabel && (
          <View style={styles.promotionDurationChip}>
            <Icon name="time-outline" size={13} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.promotionDurationText}>{promotionDurationLabel}</Text>
          </View>
        )}
        <Text style={styles.promotionTitle} numberOfLines={2}>
          {item.activePromotion?.title}
        </Text>
        <Text style={styles.promotionDescription} numberOfLines={3}>
          {item.activePromotion?.description}
        </Text>
        <View style={styles.promotionStoreRow}>
          <Icon name="storefront-outline" size={14} color="#f4f4f4" style={{ marginRight: 6 }} />
          <Text style={styles.promotionStoreName} numberOfLines={1}>
            {item.store_name || 'Unnamed Store'}
          </Text>
        </View>
        {promotionValidUntil && (
          <Text style={styles.promotionSubtleDate}>{promotionValidUntil}</Text>
        )}
      </View>
    </View>
  );

  const renderStoreFront = () => (
    <>
      {imageUrls.length > 0 && !imageLoading ? (
        <Image
          source={{ uri: imageUrls[currentPhotoIndex] }}
          style={styles.discoverImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholderContentFit="cover"
        />
      ) : (
        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderIcon}>📷</Text>
        </View>
      )}
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
    </>
  );

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
          {hasPromotion ? renderPromotionFront() : renderStoreFront()}
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
            style={[styles.navButton, { opacity: canNavigate ? 1 : 0.5 }]}
            disabled={!canNavigate}
            onPress={() => onNavigate?.(item)}
          >
            <Icon name="navigate-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={styles.profileButton}
          onPress={async () => {
            // Open the store profile as before
            onViewProfile?.(item);

            // If there is an active promotion that hasn't expired yet,
            // count this as a promotion click for analytics.
            const promo = item.activePromotion;
            if (promo?.id && promo.is_active !== false && promo.expires_at) {
              const expires = new Date(promo.expires_at);
              if (!Number.isNaN(expires.getTime()) && expires.getTime() > Date.now()) {
                await recordPromotionClick(promo.id, item.id);
              }
            }
          }}
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
  promotionCardContent: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
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
  promotionImage: {
    width: '100%',
    height: '100%',
  },
  promotionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  promotionDurationChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  promotionDurationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  promotionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  promotionDescription: {
    color: '#f5f5f5',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  promotionStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  promotionStoreName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  promotionSubtleDate: {
    color: '#f0f0f0',
    fontSize: 12,
    opacity: 0.8,
  },
  promotionImageFallback: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promotionFallbackText: {
    color: '#fff',
    marginTop: 6,
    fontSize: 13,
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

