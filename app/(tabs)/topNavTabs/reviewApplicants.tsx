import { getCachedImageUrls } from "@/lib/imageCache";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons as Icon } from "@expo/vector-icons";

type StoreApplication = {
  id: string;
  user_id: string | null;
  store_name: string | null;
  description: string | null;
  tags: string[] | null;
  photos_url: string[] | null;
  status: string | null;
  created_at: string | null;
};

export default function AdminReviewList() {
  const [applications, setApplications] = useState<StoreApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Map<string, string[]>>(new Map());
  const [imageLoading, setImageLoading] = useState<Map<string, boolean>>(new Map());

  const fetchApplications = useCallback(async () => {
    const { data, error } = await supabase
      .from("store_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return [];
    }

    // Sort: pending/accepted first (by created_at DESC), then declined (by created_at DESC)
    const sorted = (data || []).sort((a, b) => {
      const aStatus = a.status || "pending";
      const bStatus = b.status || "pending";
      
      // If both are declined, sort by created_at DESC
      if (aStatus === "declined" && bStatus === "declined") {
        const aDate = new Date(a.created_at || 0).getTime();
        const bDate = new Date(b.created_at || 0).getTime();
        return bDate - aDate;
      }
      
      // If only one is declined, put it at the bottom
      if (aStatus === "declined") return 1;
      if (bStatus === "declined") return -1;
      
      // Both are pending/accepted, sort by created_at DESC
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return bDate - aDate;
    });

    return sorted;
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const sorted = await fetchApplications();
    setApplications(sorted);

    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [fetchApplications]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load images for all applications
  useEffect(() => {
    const loadAllImages = async () => {
      const loadingMap = new Map<string, boolean>();
      const urlMap = new Map<string, string[]>();

      // Initialize loading state for all applications with photos
      applications.forEach((app) => {
        if (app.photos_url?.length && app.user_id) {
          loadingMap.set(app.id, true);
        }
      });
      setImageLoading(new Map(loadingMap));

      // Load images for each application
      const imagePromises = applications.map(async (app) => {
        if (!app.photos_url?.length || !app.user_id) {
          urlMap.set(app.id, []);
          loadingMap.set(app.id, false);
          return;
        }

        try {
          const urls = await getCachedImageUrls(app.photos_url, app.user_id);
          const filtered = urls.filter((url): url is string => Boolean(url));
          urlMap.set(app.id, filtered);
        } catch (error) {
          console.error(`Error loading images for application ${app.id}:`, error);
          urlMap.set(app.id, []);
        } finally {
          loadingMap.set(app.id, false);
        }
      });

      await Promise.all(imagePromises);
      setImageUrls(new Map(urlMap));
      setImageLoading(new Map(loadingMap));
    };

    if (applications.length > 0) {
      loadAllImages();
    }
  }, [applications]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications</Text>
        <TouchableOpacity 
          onPress={() => loadData(true)} 
          style={styles.refreshButton}
          disabled={refreshing}
        >
          <Icon 
            name="refresh" 
            size={24} 
            color={refreshing ? "#ccc" : "#000"} 
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {applications.length === 0 ? (
            <Text style={styles.noApplications}>No applications found.</Text>
          ) : (
            applications.map((app) => {
              const urls = imageUrls.get(app.id) || [];
              const isLoading = imageLoading.get(app.id) ?? false;
              const photoUrl = urls[0] || null;

              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.card}
                  onPress={() => router.push(`/admin/review/${app.id}`)}
                >
                  {isLoading ? (
                    <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                      <ActivityIndicator size="small" color="#468dff" />
                    </View>
                  ) : photoUrl ? (
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.thumbnail}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                      <Text style={{ color: "#999" }}>No Photo</Text>
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeName}>{app.store_name || "Unnamed Store"}</Text>
                    <Text numberOfLines={2} style={styles.description}>
                      {app.description || "No description provided."}
                    </Text>
                    {app.tags && app.tags.length > 0 && (
                      <Text style={styles.tags}>Tags: {app.tags.join(", ")}</Text>
                    )}
                    <Text style={[styles.status, getStatusStyle(app.status)]}>
                      Status: {app.status || "pending"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Helper for colored status
const getStatusStyle = (status: string | null) => {
  switch (status) {
    case "accepted":
      return { color: "green" };
    case "declined":
      return { color: "red" };
    default:
      return { color: "gray" };
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { marginRight: 9 },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginRight: 33, // Balance the back button width
  },
  refreshButton: {
    padding: 4,
  },
  scrollContent: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  thumbnail: { width: 90, height: 90, borderRadius: 10, marginRight: 12 },
  thumbnailPlaceholder: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  description: { fontSize: 13, color: "#555", marginBottom: 4 },
  tags: { fontSize: 12, color: "#777" },
  status: { fontWeight: "bold", marginTop: 6 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  noApplications: { textAlign: "center", color: "#888", marginTop: 40 },
});
