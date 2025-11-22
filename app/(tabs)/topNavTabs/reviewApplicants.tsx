import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

type StoreApplication = {
  id: string;
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

  useEffect(() => {
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from("store_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching applications:", error);
      else setApplications(data || []);
      setLoading(false);
    };

    fetchApplications();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applications</Text>
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
              const photoUrl = app.photos_url?.[0]
                ? supabase.storage.from("tus").getPublicUrl(app.photos_url[0]).data.publicUrl
                : null;

              return (
                <TouchableOpacity
                  key={app.id}
                  style={styles.card}
                  onPress={() => router.push(`/admin/review/${app.id}`)}
                >
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.thumbnail} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: { marginRight: 9 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
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
