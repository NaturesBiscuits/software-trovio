import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView as RNScrollView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// --- IMPORTS FROM YOUR PROJECT ---
import BottomNav from '../../components/BottomNav';
import TopNav from '../../components/TopNav';
import { useUserProfile } from '../../context/UserProfileContext';
import { supabase } from '../../lib/supabase';

// --- TYPES ---
interface StoreApplication {
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

// --- UTILITIES ---
const DESC_SNIPPET_LENGTH = 110;

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

const getStorageUrl = (filename: string | null, userId: string | null): string | null => {
  if (!filename || !userId) return null;
  const { data } = supabase.storage.from('tus').getPublicUrl(`applications/${userId}/store_photos/${filename}`);
  return data.publicUrl;
};

// --- SUB-COMPONENT: PROFILE SIDE PANEL ---
const ProfileSidePanel = ({
  visible,
  onClose,
  user
}: {
  visible: boolean;
  onClose: () => void;
  user: any;
}) => {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const panelWidth = Math.min(320, screenWidth * 0.86);
  const slideAnim = useRef(new Animated.Value(panelWidth)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) setShouldRender(true);
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : panelWidth,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start(() => {
      if (!visible) setShouldRender(false);
    });
  }, [visible]);

  if (!shouldRender) return null;

  // Handlers for panel buttons
  const handleProfile = () => {
    onClose();
    // Navigate to the Profile tab
    router.push('/(tabs)/topNavTabs/profile');
  };
  const handleSavedStores = () => {
    onClose();
  };
  const handleSettings = () => {
    onClose();
  };

  const handleLogout = async () => {
    onClose();
    // Confirm before signing out (optional UX improvement)
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Sign Out Failed', error.message || 'Unknown error');
      } else {
        // Optionally, clear navigation stack / redirect to login
        router.replace('/(auth)/login'); // Adjust the route to your login path if different
      }
    } catch (err: any) {
      Alert.alert('Sign Out Failed', err.message || 'Unknown error');
    }
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 110 }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.panelOverlay} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.sidePanel,
          { width: panelWidth, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.sidePanelBar}>
          <Text style={styles.panelTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidePanelInfoArea}>
          <Image
            source={{
              uri: user?.avatar_url || 'https://via.placeholder.com/120',
            }}
            style={styles.panelAvatar}
          />
          <View>
            <Text style={styles.panelName}>
              {user?.full_name || user?.username || 'Unknown User'}
            </Text>
            {user?.email && (
              <View style={styles.panelEmailRow}>
                <Icon name="mail-outline" color="#fff" size={17} style={{ marginRight: 7 }} />
                <Text style={styles.panelEmail} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.panelButtonsContainer}>
          <TouchableOpacity onPress={handleProfile} style={styles.panelButton}>
            <Icon name="person-circle-outline" size={28} color="#fff" style={styles.panelButtonIcon} />
            <Text style={styles.panelButtonText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSavedStores} style={styles.panelButton}>
            <Icon name="bookmark-outline" size={28} color="#fff" style={styles.panelButtonIcon} />
            <Text style={styles.panelButtonText}>Saved Stores</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSettings} style={styles.panelButton}>
            <Icon name="settings-outline" size={28} color="#fff" style={styles.panelButtonIcon} />
            <Text style={styles.panelButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.panelButton}>
            <Icon name="log-out-outline" size={28} color="#fff" style={styles.panelButtonIcon} />
            <Text style={styles.panelButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// --- SUB-COMPONENT: FLIP CARD ---
const DiscoverFlipCard = React.memo(({
  item,
  photoUrl,
  userCoords,
  showFlipHint,
  onFirstFlip,
  isFlipped,
  flipCard,
  hasLocationPermission,
}: {
  item: StoreApplication;
  photoUrl: string | null;
  userCoords: { latitude: number; longitude: number } | null;
  showFlipHint: boolean;
  onFirstFlip: () => void;
  isFlipped: boolean;
  flipCard: () => void;
  hasLocationPermission: boolean;
}) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  const { distanceStr, pathLink, locationStatus } = useMemo(() => {
    let status: 'has' | 'no-permission' | 'no-store-location' = 'has';
    let distStr: string | null = null;
    let link: string | null = null;

    if (!hasLocationPermission) status = 'no-permission';
    else if (!item.latitude || !item.longitude) status = 'no-store-location';
    else if (userCoords) {
      const meters = getDistanceFromLatLonInKm(userCoords.latitude, userCoords.longitude, item.latitude, item.longitude);
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
  }, [isFlipped]);

  const frontAnimatedStyle = {
    transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] }) }],
    zIndex: isFlipped ? 0 : 1,
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] }) }],
    zIndex: isFlipped ? 1 : 0,
  };

  const handleNavigate = () => {
    if (pathLink) Linking.openURL(pathLink);
  };

  return (
    <TouchableOpacity activeOpacity={1} style={styles.discoverCardWrapper} onPress={flipCard}>
      {/* FRONT FACE */}
      <Animated.View style={[styles.flipCardFace, frontAnimatedStyle]}>
        <View style={styles.discoverCardContent}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.discoverImage} />
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
              <Text style={styles.flipHintText}>Tap to flip</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* BACK FACE */}
      <Animated.View style={[styles.flipCardFace, styles.flipCardBack, backAnimatedStyle]}>
        <View style={styles.backContent}>
          <Text style={styles.backTitle}>{item.store_name}</Text>
          <RNScrollView style={styles.descScroll} nestedScrollEnabled>
             <Text style={styles.descText}>{item.description || 'No description available.'}</Text>
          </RNScrollView>
          
          <View style={styles.distanceContainer}>
             <Icon name="walk" size={18} color="#468dff" />
             <Text style={styles.distanceText}>
               {locationStatus === 'has' ? `~${distanceStr || '...'}` : 'Loc. Unavailable'}
             </Text>
          </View>

          <TouchableOpacity 
            style={[styles.navButton, { opacity: (isFlipped && pathLink) ? 1 : 0.5 }]} 
            disabled={!isFlipped || !pathLink}
            onPress={handleNavigate}
          >
            <Icon name="navigate-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

// --- MAIN SCREEN ---
export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  
  // State
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasLocPerm, setHasLocPerm] = useState(false);
  
  // UI State
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [flipHintDismissed, setFlipHintDismissed] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  
  // Animation Refs
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const topNavOpacity = useRef(new Animated.Value(0)).current;
  const topNavTranslateY = useRef(new Animated.Value(-100)).current;
  const lastScrollY = useRef(0);
  const isNavHidden = useRef(false);

  // 1. Fetch Location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        setHasLocPerm(true);
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (location?.coords) {
          setUserCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        }
      } catch (e) {
        console.log('Location Error', e);
      }
    })();
  }, []);

  // 2. Fetch Stores
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_applications')
        .select('*')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false }); // Let Supabase do the sorting

      if (!error && data) {
        setStores(data as StoreApplication[]);
      }
      setLoading(false);
    };
    fetchStores();
  }, []);

  // 3. Scroll Handler for Navbar and TopNav
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    const contentHeight = e.nativeEvent.contentSize.height;
    const scrollViewHeight = e.nativeEvent.layoutMeasurement.height;
    const maxScroll = contentHeight - scrollViewHeight;
    
    // Calculate scroll percentage (0-100%)
    const scrollPercentage = maxScroll > 0 ? (currentY / maxScroll) * 100 : 0;

    // Show TopNav when scrolled down 20% or more
    if (scrollPercentage >= 20 && currentY > 0) {
      Animated.parallel([
        Animated.timing(topNavOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(topNavTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(topNavOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(topNavTranslateY, { toValue: -100, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    // Scroll Down -> Hide Bottom Nav
    if (currentY > 50 && diff > 10 && !isNavHidden.current) {
      isNavHidden.current = true;
      Animated.timing(navTranslateY, { toValue: 100, duration: 250, useNativeDriver: true }).start();
    } 
    // Scroll Up -> Show Bottom Nav
    else if ((diff < -10 || currentY <= 0) && isNavHidden.current) {
      isNavHidden.current = false;
      Animated.timing(navTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    lastScrollY.current = currentY;
  }, []);

  const onCardFlip = useCallback((idx: number) => {
    setFlippedCardIndex((prev) => (prev === idx ? null : idx));
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Hi, {userProfile?.full_name?.split(' ')[0] || 'there'}!</Text>
            <Text style={styles.headerSubtitle}>Let's see where we take you next!</Text>
          </View>
          <TouchableOpacity onPress={() => setProfilePanelOpen(true)} style={styles.avatarContainer}>
            <Image source={{ uri: userProfile?.avatar_url || 'https://via.placeholder.com/60' }} style={styles.avatar} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/topNavTabs/search')} activeOpacity={0.8}>
          <Icon name="search-outline" size={20} color="#999" style={{ marginRight: 10 }} />
          <Text style={styles.searchText}>Search stores...</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#468dff" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Horizontal Scroll (Discover) */}
            <Text style={styles.sectionHeader}>Discover</Text>
            {stores.length > 0 ? (
              <FlatList
                horizontal
                data={stores}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <DiscoverFlipCard
                    item={item}
                    photoUrl={getStorageUrl(item.photos_url?.[0] || null, item.user_id)}
                    userCoords={userCoords}
                    hasLocationPermission={hasLocPerm}
                    showFlipHint={!flipHintDismissed && index === 0}
                    onFirstFlip={() => setFlipHintDismissed(true)}
                    isFlipped={flippedCardIndex === index}
                    flipCard={() => onCardFlip(index)}
                  />
                )}
                bounces={false}
                overScrollMode="never"
              />
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No stores found.</Text></View>
            )}

            {/* Vertical List (For You) */}
            <Text style={styles.sectionHeader}>For you</Text>
            {stores.map((item) => {
               const url = getStorageUrl(item.photos_url?.[0] || null, item.user_id);
               return (
                <TouchableOpacity key={item.id} style={styles.verticalCard} activeOpacity={0.9}>
                  {url ? (
                    <Image source={{ uri: url }} style={styles.verticalImg} />
                  ) : (
                    <View style={styles.verticalPlaceholder}><Text>📷</Text></View>
                  )}
                  <View style={styles.verticalContent}>
                    <Text style={styles.verticalTitle}>{item.store_name}</Text>
                    <View style={styles.verticalRow}>
                      <Icon name="location-outline" size={14} color="#be3e3e" />
                      <Text style={styles.verticalAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Overlays */}
      <ProfileSidePanel visible={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} user={userProfile} />
      
      {/* TopNav - Shows when scrolled down 20% */}
      <Animated.View 
        style={[
          styles.topNavContainer, 
          { 
            opacity: topNavOpacity,
            transform: [{ translateY: topNavTranslateY }] 
          }
        ]}
      >
        <TopNav />
      </Animated.View>
      
      <Animated.View style={[styles.bottomNavContainer, { transform: [{ translateY: navTranslateY }] }]}>
        <BottomNav visible />
      </Animated.View>
    </View>
  );
}

// Override discover card overlay/background/text for invisibility
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Header
  header: {
    backgroundColor: '#191820',
    paddingTop: 70,
    paddingBottom: 75,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },
  headerSubtitle: { color: '#ccc', fontSize: 16, marginTop: 5 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#fff', overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },

  // Search
  searchBar: {
    backgroundColor: '#fff',
    marginTop: 15, // moved from -25 to 15 for lowering
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  searchText: { color: '#999', fontSize: 16 },

  // Sections
  sectionHeader: { fontSize: 22, fontWeight: '700', marginLeft: 20, marginTop: 25, marginBottom: 15 },
  emptyBox: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#888' },

  // Discover Card (Flip)
  discoverCardWrapper: {
    width: 220, height: 260, marginRight: 15,
  },
  flipCardFace: {
    position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
    borderRadius: 20, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    borderWidth: 0,
  },
  discoverCardContent: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: '#f5f4f4' },
  flipCardBack: { padding: 15, justifyContent: 'space-between' },
  discoverImage: { width: '100%', height: '100%' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderIcon: { fontSize: 40 },

  // MODIFIED: Make cardOverlay and card text box invisible (no bg, no border, text overlays image)
  cardOverlayInvisible: { 
    position: 'absolute', 
    bottom: 0, left: 0, right: 0, 
    padding: 12, 
    backgroundColor: 'transparent', // Invisible background
    borderColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
  },
  cardTitleInvisible: { fontSize: 18, fontWeight: '700', color: '#111', textShadowColor: undefined, textShadowOffset: undefined, textShadowRadius: 0 },
  cardSubtitleInvisible: { fontSize: 12, color: '#be3e3e', marginTop: 2, textShadowColor: undefined, textShadowOffset: undefined, textShadowRadius: 0 },
  cardRowInvisible: { flexDirection: 'row', alignItems: 'center', marginTop: 4, backgroundColor: 'transparent', borderWidth: 0 },

  // LEGACY (not used in discover card now)
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(255,255,255,0.9)' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },

  flipHint: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12, flexDirection: 'row' },
  flipHintText: { color: '#fff', fontSize: 12 },

  // Back Face Specifics
  backContent: { flex: 1 },
  backTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  descScroll: { maxHeight: 100, marginBottom: 10 },
  descText: { color: '#555', fontSize: 13, lineHeight: 18 },
  distanceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  distanceText: { color: '#468dff', fontWeight: '600', marginLeft: 6 },
  navButton: { backgroundColor: '#468dff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 25 },
  navButtonText: { color: '#fff', fontWeight: 'bold' },

  // Vertical Card (For You)
  verticalCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: '#fff', borderRadius: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, overflow: 'hidden' },
  verticalImg: { width: '100%', height: 200 },
  verticalPlaceholder: { width: '100%', height: 200, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  verticalContent: { padding: 15 },
  verticalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 5 },
  verticalRow: { flexDirection: 'row', alignItems: 'center' },
  verticalAddress: { fontSize: 13, color: '#666', marginLeft: 4 },

  // Side Panel
  panelOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(25,24,32,0.99)',
    paddingTop: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    elevation: 10,
  },
  sidePanelBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  sidePanelInfoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 4,
    paddingRight: 8,
  },
  panelAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 20, backgroundColor: '#eee' },
  panelName: { fontSize: 20, fontWeight: 'bold', marginBottom: 2, color: '#fff', textAlign: 'left' },
  panelEmailRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  panelEmail: { color: '#fff', maxWidth: 190, textAlign: 'left' },
  panelButtonsContainer: {
    marginTop: 3,
  },
  panelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18, // bigger touch area
    paddingLeft: 4,
    borderRadius: 0,
    marginBottom: 1,
    backgroundColor: 'transparent', // invisible
    borderWidth: 0,
    elevation: 0,
  },
  panelButtonIcon: { marginRight: 18 },
  panelButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },

  // Top Nav
  topNavContainer: { 
    position: 'absolute', 
    left: 0, 
    right: 0, 
    top: 0, 
    zIndex: 100,
    backgroundColor: '#fff',
    paddingBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  
  // Bottom Nav
  bottomNavContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 100 },
});