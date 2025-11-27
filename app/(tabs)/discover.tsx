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
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../lib/supabase';

// --- YOUR COMPONENTS ---
import BottomNav from '../../components/BottomNav';
import DiscoverFlipCard, { StoreApplication } from '../../components/DiscoverFlipCard';
import StoreProfileModal from '../../components/StoreProfileModal';
import TopNav from '../../components/TopNav';
import VerticalStoreCard from '../../components/VerticalStoreCard';
import { useUserProfile } from '../../context/UserProfileContext';

// ---------------------------------------------------------
// 1. CUSTOM HOOKS (Logic Extraction)
// ---------------------------------------------------------

const useLocationTracker = () => {
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [hasLocPerm, setHasLocPerm] = useState(false);

  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return;
        setHasLocPerm(true);

        // Get initial position quickly
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (location?.coords) setUserCoords(location.coords);

        // Watch for changes
        watcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
          (pos) => pos?.coords && setUserCoords(pos.coords)
        );
      } catch (e) {
        console.log('Location Error', e);
      }
    })();
    return () => { watcher?.remove(); };
  }, []);

  return { userCoords, hasLocPerm };
};

const useStoreFeed = () => {
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('store_applications')
        .select('*')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (!error && data) setStores(data as StoreApplication[]);
      setLoading(false);
    };
    fetchStores();
  }, []);

  return { stores, loading };
};

// ---------------------------------------------------------
// 2. SUB-COMPONENTS
// ---------------------------------------------------------

const HoldIndicator = ({ text = "Hold card to view details" }) => (
  <View style={styles.holdIndicatorContainer}>
    <Icon name="hand-left-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
    <Text style={styles.holdIndicatorText}>{text}</Text>
  </View>
);

// (Ideally, move this ProfileSidePanel to its own file: components/ProfileSidePanel.tsx)
const ProfileSidePanel = ({ visible, onClose, user }: { visible: boolean; onClose: () => void; user: any }) => {
  const router = useRouter();
  const panelWidth = Math.min(320, Dimensions.get('window').width * 0.86);
  const slideAnim = useRef(new Animated.Value(panelWidth)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : panelWidth,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [visible]);

  if (!visible && slideAnim ===  new Animated.Value(panelWidth)) return null; // Simple render check

  // Updated logout action with confirmation
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) router.replace('/(auth)/login');
          }
        }
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    { label: 'Profile', icon: 'person-circle-outline', action: () => router.push('/(tabs)/topNavTabs/profile') },
    // CHANGED: Directly go to the actual myStore file
    { label: 'My Store', icon: 'storefront-outline', action: () => router.push('/(tabs)/mystore') },
    { label: 'Saved Stores', icon: 'bookmark-outline', action: () => router.push('/(tabs)/savedstores') },
    // Professional Tools button now pushes to /proftools
    { label: 'Professional Tools', icon: 'construct-outline', action: () => router.push('/(tabs)/proftools') },
    { label: 'Settings', icon: 'settings-outline', action: () => {} },
    // Only one logout: the one with confirmation dialog
    { label: 'Logout', icon: 'log-out-outline', action: handleLogout },
  ];

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 110, display: visible ? 'flex' : 'none' }]}>
      <TouchableWithoutFeedback onPress={onClose}><View style={styles.panelOverlay} /></TouchableWithoutFeedback>
      <Animated.View style={[styles.sidePanel, { width: panelWidth, transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidePanelBar}>
          <Text style={styles.panelTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose}><Icon name="close" size={26} color="#fff" /></TouchableOpacity>
        </View>

        <View style={styles.sidePanelInfoArea}>
          <Image source={{ uri: user?.avatar_url || 'https://via.placeholder.com/120' }} style={styles.panelAvatar} />
          <View>
            <Text style={styles.panelName}>{user?.full_name || 'User'}</Text>
            <Text style={styles.panelEmail} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => { onClose(); item.action(); }} style={styles.panelButton}>
              <Icon name={item.icon} size={28} color="#fff" style={styles.panelButtonIcon} />
              <Text style={styles.panelButtonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// ---------------------------------------------------------
// 3. MAIN SCREEN
// ---------------------------------------------------------

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();

  // Custom Hooks
  const { userCoords, hasLocPerm } = useLocationTracker();
  const { stores, loading } = useStoreFeed();

  // Filter out user's own stores
  const filteredStores = useMemo(() => {
    if (!userProfile?.id) return stores;
    return stores.filter(store => store.user_id !== userProfile.id);
  }, [stores, userProfile?.id]);

  // State
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);
  const [flipHintDismissed, setFlipHintDismissed] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreApplication | null>(null);

  // Animations
  const navTranslateY = useRef(new Animated.Value(0)).current;
  const topNavOpacity = useRef(new Animated.Value(0)).current;
  const topNavTranslateY = useRef(new Animated.Value(-100)).current;
  const lastScrollY = useRef(0);
  const isNavHidden = useRef(false);

  // SCROLL LIMIT LOGIC
  // Remove/rework scroll limiting so you can scroll all the way down.
  // Setting MAX_SCROLL to a very large number (or Infinity), or disabling the limit.
  //const MAX_SCROLL = 2500; // REMOVE OR ADJUST THIS!
  const MIN_SCROLL = 0;

  // --- Handlers ---

  // Track if we already forcibly scrolled, to avoid feedback loop
  const forceScrollRef = useRef(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // If programmatically set scroll, skip this pass
    if (forceScrollRef.current) {
      forceScrollRef.current = false;
      return;
    }

    let currentY = e.nativeEvent.contentOffset.y;
    let overriden = false;

    if (currentY < MIN_SCROLL) {
      overriden = true;
      currentY = MIN_SCROLL;
    }
    // Remove the max scroll limiting to allow full scroll down!
    // else if (currentY > MAX_SCROLL) {
    //   overriden = true;
    //   currentY = MAX_SCROLL;
    // }

    if (overriden && scrollViewRef.current) {
      forceScrollRef.current = true;
      scrollViewRef.current.scrollTo({ y: currentY, animated: false });
    }

    // Usual header logic
    const diff = currentY - lastScrollY.current;

    // Top Nav Logic
    const shouldShowTopNav = currentY > 150; // Simplified threshold
    Animated.parallel([
      Animated.timing(topNavOpacity, { toValue: shouldShowTopNav ? 1 : 0, duration: 200, useNativeDriver: true }),
      Animated.timing(topNavTranslateY, { toValue: shouldShowTopNav ? 0 : -100, duration: 200, useNativeDriver: true }),
    ]).start();

    // Bottom Nav Logic
    if (currentY > 50 && diff > 10 && !isNavHidden.current) {
      isNavHidden.current = true;
      Animated.timing(navTranslateY, { toValue: 100, duration: 250, useNativeDriver: true }).start();
    } else if ((diff < -10 || currentY <= 0) && isNavHidden.current) {
      isNavHidden.current = false;
      Animated.timing(navTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    lastScrollY.current = currentY;
  }, []);

  const renderDiscoverCard = useCallback(({ item, index }: { item: StoreApplication; index: number }) => (
    <View>
      <DiscoverFlipCard
        item={item}
        userCoords={userCoords}
        hasLocationPermission={hasLocPerm}
        showFlipHint={!flipHintDismissed && index === 0}
        onFirstFlip={() => setFlipHintDismissed(true)}
        isFlipped={flippedCardIndex === index}
        flipCard={() => setFlippedCardIndex((prev) => (prev === index ? null : index))}
        onViewProfile={(store) => setSelectedStore(store)}
      />
      {!flipHintDismissed && index === 0 && (
        <View style={styles.holdIndicatorPosition}>
          <HoldIndicator />
        </View>
      )}
    </View>
  ), [flippedCardIndex, flipHintDismissed, userCoords, hasLocPerm]);

  // --- THE SHADOW FIX IS HERE ---
  const renderForYouCard = (item: StoreApplication) => (
    <View style={styles.cardOuterShadowContainer} key={item.id}>
      <View style={styles.cardInnerContent}>
        <VerticalStoreCard
          store={item}
          onPress={() => setSelectedStore(item)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 140 }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        // overScrollMode and bounces left as before.
        overScrollMode="never"
        bounces={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Hi, {userProfile?.full_name?.split(' ')[0] || 'there'}!</Text>
            <Text style={styles.headerSubtitle}>Let's see where we take you next!</Text>
          </View>
          <TouchableOpacity onPress={() => setProfilePanelOpen(true)} style={styles.avatarContainer}>
            <Image source={{ uri: userProfile?.avatar_url || 'https://via.placeholder.com/60' }} style={styles.avatar} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/topNavTabs/search')}>
          <Icon name="search-outline" size={20} color="#999" style={{ marginRight: 10 }} />
          <Text style={styles.searchText}>Search stores...</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#468dff" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionHeader}>Discover</Text>
            {filteredStores.length > 0 ? (
              <FlatList
                horizontal
                data={filteredStores}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}
                keyExtractor={(item) => item.id}
                renderItem={renderDiscoverCard}
              />
            ) : (
              <View style={styles.emptyBox}><Text style={styles.emptyText}>No stores found.</Text></View>
            )}

            <Text style={styles.sectionHeader}>For you</Text>
            {filteredStores.map((item) => renderForYouCard(item))}
          </>
        )}
      </ScrollView>

      {/* Modals & Overlays */}
      <ProfileSidePanel visible={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} user={userProfile} />
      
      <StoreProfileModal
        visible={Boolean(selectedStore)}
        store={selectedStore}
        onClose={() => setSelectedStore(null)}
        userCoords={userCoords}
      />

      {/* Navigation Bars */}
      <Animated.View style={[styles.topNavContainer, { opacity: topNavOpacity, transform: [{ translateY: topNavTranslateY }] }]}>
        <TopNav />
      </Animated.View>
      
      <Animated.View style={[styles.bottomNavContainer, { transform: [{ translateY: navTranslateY }] }]}>
        <BottomNav visible />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------
// 4. STYLES
// ---------------------------------------------------------

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
    marginTop: 15,
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  searchText: { color: '#999', fontSize: 16 },

  // Content
  sectionHeader: { fontSize: 22, fontWeight: '700', marginLeft: 20, marginTop: 25, marginBottom: 15 },
  emptyBox: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#888' },

  // --- FOR YOU CARD SHADOW FIX ---
  // 1. The Outer Container has the Shadow
  cardOuterShadowContainer: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: 'transparent', // Let shadow be the only decoration here
    // iOS Shadow
    shadowColor: "#000",
    shadowOpacity: 0.2, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // Android Shadow
    elevation: 6,
  },
  // 2. The Inner Container has the rounding and clipping
  cardInnerContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden', // This clips the VerticalStoreCard to the rounded corners
  },

  // Hold Indicator
  holdIndicatorContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', opacity: 0.94, marginTop: 5, elevation: 3,
  },
  holdIndicatorText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  holdIndicatorPosition: { position: 'absolute', left: 18, bottom: 15, zIndex: 15 },

  // Side Panel
  panelOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sidePanel: {
    position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(25,24,32,0.99)',
    paddingTop: 40, paddingHorizontal: 20, borderTopLeftRadius: 30, borderBottomLeftRadius: 30,
    shadowColor: '#000', shadowOpacity: 0.2, elevation: 10,
  },
  sidePanelBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  panelTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  sidePanelInfoArea: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 4 },
  panelAvatar: { width: 64, height: 64, borderRadius: 32, marginRight: 20, backgroundColor: '#eee' },
  panelName: { fontSize: 20, fontWeight: 'bold', marginBottom: 2, color: '#fff' },
  panelEmail: { color: '#fff', maxWidth: 190 },
  panelButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, backgroundColor: 'transparent' },
  panelButtonIcon: { marginRight: 18 },
  panelButtonText: { color: '#fff', fontSize: 20, fontWeight: '600' },

  // Navs
  topNavContainer: { 
    position: 'absolute', left: 0, right: 0, top: 0, zIndex: 100, backgroundColor: '#fff', paddingBottom: 10,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  bottomNavContainer: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 100 },
});