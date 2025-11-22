import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";

// ⭐ Add proper type for store application row
type StoreApplication = {
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
};

export default function HomeScreen() {
  // ⭐ Now TypeScript knows the structure
  const [stores, setStores] = useState<StoreApplication[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    const { data, error } = await supabase
      .from("store_applications")
      .select("*")
      .eq("status", "accepted");

    if (error) console.log(error);
    else setStores(data as StoreApplication[]); // ⭐ tell TS that this matches our type
  };

  const StoreCard = ({ store }: { store: StoreApplication }) => (
    <View style={styles.card}>
      {store.photos_url?.length ? (
        <Image source={{ uri: store.photos_url[0] }} style={styles.image} />
      ) : null}

      <Text style={styles.storeName}>{store.store_name}</Text>
      <Text style={styles.description}>{store.description}</Text>

      <View style={styles.tagsWrapper}>
        {store.tags?.map((tag, idx) => (
          <View key={idx} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Hi, (username)!</Text>
      <Text style={styles.subHeader}>Let's see where we take you next!</Text>

      <TextInput placeholder="Search" style={styles.searchBar} />

      <Text style={styles.sectionTitle}>Discover</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {stores.map((store) => (
          <View key={store.id} style={{ marginRight: 16 }}>
            <StoreCard store={store} />
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>For You</Text>

      {stores.map((store) => (
        <StoreCard key={store.id} store={store} />
      ))}

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#ffffff"
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 12,
  },
  searchBar: {
    backgroundColor: "#ededed",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  card: {
    width: 250,
    backgroundColor: "#f7f7f7",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 16,
  },
  image: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 8,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#333",
  },
});
