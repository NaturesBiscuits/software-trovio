import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomNav from '../../components/BottomNav';
import { supabase } from '../../lib/supabase';
import { useUserProfile } from '../../context/UserProfileContext';

interface StoreApplication {
  id: string;
  user_id: string | null;
  full_name: string | null;
  store_name: string | null;
  address: string | null;
  tags: string[] | null;
  id_url: string[] | null;
  license_url: string[] | null;
  photos_url: string[] | null;
  status: string | null;
  created_at: string | null;
  description: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const [stores, setStores] = useState<StoreApplication[]>([]);
  const [forYouStores, setForYouStores] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get Supabase Storage URL
  // Path structure: applications/{user_id}/store_photos/{filename}
  const getStorageUrl = (filename: string | null, userId: string | null): string | null => {
    if (!filename || !userId) return null;
    
    // Construct the storage path: applications/{user_id}/store_photos/{filename}
    const storagePath = `applications/${userId}/store_photos/${filename}`;
    
    // Get public URL from Supabase Storage bucket "tus"
    const { data } = supabase.storage.from('tus').getPublicUrl(storagePath);
    return data.publicUrl;
  };

  // ---------------- FETCH STORE APPLICATIONS ---------------- //
  // Fetches from store_applications table:
  // - store_name: used for card name
  // - address: used for card address  
  // - photos_url: array of photo URLs, first element (photos_url[0]) used as thumbnail
  const fetchStores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_applications')
      .select('*')
      .eq('status', 'accepted'); // only show accepted stores

    if (error) {
      console.error('Error fetching stores:', error);
      setLoading(false);
      return;
    }

    if (!data) {
      console.log('No data returned from store_applications');
      setLoading(false);
      return;
    }

    console.log(`Fetched ${data.length} stores with 'accepted' status`);

    // sort newest first
    const sorted = (data as StoreApplication[]).sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    );

    setStores(sorted);
    // For "For you" section, show all stores (or you can filter based on user preferences)
    setForYouStores(sorted);
    setLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>

        {/* ===== TOP HEADER ===== */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.headerText}>
              Hi, {userProfile?.full_name || userProfile?.username || 'there'}!
            </Text>
            <Text style={styles.subHeaderText}>
              Let's see where we take you next!
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/topNavTabs/profile')}
            style={styles.profileButtonContainer}
          >
            <Image
              source={{
                uri: userProfile?.avatar_url || 'https://via.placeholder.com/60',
              }}
              style={styles.profilePic}
            />
          </TouchableOpacity>
        </View>

        {/* ===== SEARCH BAR ===== */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="Search"
            placeholderTextColor="#999"
            style={styles.searchInput}
          />
          <Image
            source={{
              uri: 'https://img.icons8.com/ios-filled/50/search.png',
            }}
            style={styles.searchIcon}
          />
        </View>

        {/* ===== LOADING ===== */}
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 30 }} />
        )}

        {/* ===== DISCOVER SCROLL (Horizontal - Slide Right) ===== */}
        {!loading && (
          <>
            <Text style={styles.sectionTitle}>Discover</Text>
            {stores.length > 0 ? (
              <View style={styles.discoverContainer}>
                <FlatList
                  horizontal
                  data={stores}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    // Get the first photo filename and construct storage URL
                    const photoFilename = item.photos_url && item.photos_url.length > 0 
                      ? item.photos_url[0] 
                      : null;
                    const photoUrl = getStorageUrl(photoFilename, item.user_id);
                    
                    return (
                      <TouchableOpacity style={styles.discoverCard}>
                        {/* Thumbnail: Using photos_url[0] from store_applications table */}
                        {photoUrl ? (
                          <Image
                            source={{ uri: photoUrl }}
                            style={styles.discoverImage}
                          />
                        ) : (
                          <View style={styles.placeholderBox}>
                            <Text style={styles.placeholderIcon}>📷</Text>
                            <Text style={styles.placeholderText}>Upload Photo</Text>
                          </View>
                        )}

                      <View style={styles.discoverOverlay}>
                        {/* Name: Using store_name from store_applications table */}
                        <Text style={styles.discoverName}>
                          {item.store_name || 'Unnamed Store'}
                        </Text>
                        {/* Address: Using address from store_applications table */}
                        <Text style={styles.discoverLocation}>
                          {item.address || 'No address'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.discoverListContent}
                />
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No stores available yet</Text>
                <Text style={styles.emptyStateSubtext}>Stores will appear here once approved</Text>
              </View>
            )}
          </>
        )}

        {/* ===== FOR YOU (Vertical Scroll - Scroll Down) ===== */}
        {!loading && forYouStores.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>For you</Text>
            {forYouStores.map((item) => {
              // Get the first photo filename and construct storage URL
              const photoFilename = item.photos_url && item.photos_url.length > 0 
                ? item.photos_url[0] 
                : null;
              const photoUrl = getStorageUrl(photoFilename, item.user_id);
              
              return (
                <TouchableOpacity key={item.id} style={styles.forYouCard}>
                  {photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.forYouImage}
                    />
                  ) : (
                    <View style={styles.forYouPlaceholderBox}>
                      <Text style={styles.forYouPlaceholderIcon}>📷</Text>
                      <Text style={styles.forYouPlaceholderText}>Upload Photo</Text>
                    </View>
                  )}

                <View style={styles.forYouContent}>
                  <Text style={styles.forYouName}>
                    {item.store_name || 'Unnamed Store'}
                  </Text>
                  <Text style={styles.forYouAddress}>
                    {item.address || 'No address'}
                  </Text>
                  {item.description && (
                    <Text style={styles.forYouDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <BottomNav visible />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* ---------------- HEADER ---------------- */
  topHeader: {
    backgroundColor: '#0F0F0F',
    paddingVertical: 80,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 10,
  },
  subHeaderText: {
    color: '#BFBFBF',
    fontSize: 14,
    marginTop: 10,
  },
  profileButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#333',
  },
  profilePic: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  /* ---------------- SEARCH BAR ---------------- */
  searchBar: {
    marginTop: 5,
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchIcon: {
    width: 20,
    height: 30,
    tintColor: '#444',
    marginLeft: -10
  },

  /* ---------------- TITLES ---------------- */
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 15,
    marginLeft: 20,
  },

  /* ---------------- DISCOVER CARDS (Horizontal Scroll) ---------------- */
  discoverContainer: {
    marginBottom: 10,
  },
  discoverListContent: {
    paddingRight: 20,
  },
  discoverCard: {
    width: 180,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  discoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  discoverOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  discoverName: {
    color: '#494848ff',
    fontSize: 17,
    fontWeight: '700',
  },
  discoverLocation: {
    color: '#be3e3eff',
    fontSize: 13,
  },

  /* ---------------- FOR YOU CARDS (Vertical Scroll) ---------------- */
  forYouCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  forYouImage: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
  },
  forYouPlaceholderBox: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
  },
  forYouPlaceholderIcon: {
    fontSize: 30,
    marginBottom: 4,
  },
  forYouPlaceholderText: {
    color: '#999',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  forYouContent: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  forYouName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#494848',
    marginBottom: 6,
  },
  forYouAddress: {
    fontSize: 14,
    color: '#be3e3e',
    marginBottom: 8,
  },
  forYouDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  featureCard: {
    width: '90%',
    height: 250,
    alignSelf: 'center',
    borderRadius: 25,
    overflow: 'hidden',
    marginVertical: 15,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  featureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featurePlaceholderBox: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D0D0D0',
    borderStyle: 'dashed',
  },
  featurePlaceholderIcon: {
    fontSize: 60,
    marginBottom: 12,
  },
  featurePlaceholderText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  featureOverlay: {
    position: 'absolute',
    top: 25,
    left: 20,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  featureButton: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  featureButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

