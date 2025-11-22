import { supabase } from "@/lib/supabase";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Icon from "react-native-vector-icons/Ionicons";

type PreferenceRow = {
  tag_id: string;
  tags: { name: string };
};

type TagItem = {
  id: string;
  name: string;
  removing?: boolean;
};

export default function UserTagPreferences({ userId }: { userId: string }) {
  const [allTags, setAllTags] = useState<{ id: string; name: string; categories?: string[] }[]>([]);
  const [userTags, setUserTags] = useState<TagItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      // Fetch all tags
    const { data: tagList } = await supabase
      .from("tags")
      .select("id, name, categories")
      .order("name", { ascending: true });

      // Fetch user-selected tags
      const { data: preferenceList } = await supabase
        .from("user_tags")
        .select("tag_id, tags(name)")
        .eq("user_id", userId)
        .returns<PreferenceRow[]>();

      setAllTags(tagList ?? []);

      setUserTags(
        (preferenceList ?? []).map((row) => ({
          id: row.tag_id,
          name: row.tags.name,
        }))
      );

      setLoading(false);
    };

    loadData();
  }, [userId]);

  const addTag = async (tag: { id: string; name: string }) => {
    const { error } = await supabase.from("user_tags").insert({
      user_id: userId,
      tag_id: tag.id,
      weight: 1.0,
    });

    if (!error) {
      setUserTags([...userTags, { id: tag.id, name: tag.name }]);
    }
  };

  const deleteTag = async (tag: TagItem) => {
    const { error } = await supabase
      .from("user_tags")
      .delete()
      .eq("user_id", userId)
      .eq("tag_id", tag.id);

    if (!error) {
      setUserTags(userTags.filter((t) => t.id !== tag.id));
    }
  };

const filteredTags = search.length
  ? allTags.filter((t) => {
      const query = search.toLowerCase();

      const matchName = t.name.toLowerCase().includes(query);
      const matchCategory =
        t.categories?.some((c) =>
          c.toLowerCase().includes(query)
        ) ?? false;

      return matchName || matchCategory;
    })
  : [];

  const isSelected = (tagId: string) => {
    return userTags.some((t) => t.id === tagId);
  };

  return (
  <KeyboardAwareScrollView
    extraScrollHeight={60}
    enableOnAndroid={true}
    keyboardShouldPersistTaps="handled"
  >
      <View style={styles.box}>
        <Text style={styles.title}>Your Preferences</Text>
        <Text style={styles.subtitle}>
          Add or remove tags to personalize your feed.
        </Text>

        {/* Search Input */}
        <View style={styles.searchRow}>
          <Icon name="search-outline" size={18} color="#999" />
          <TextInput
            placeholder="Search tags..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* User tags */}
        <Text style={styles.sectionTitle}>Your Tags</Text>
        <View style={styles.tagGrid}>
          {userTags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.selectedChip,
                tag.removing && styles.deleteChip,
              ]}
              onLongPress={() =>
                setUserTags((prev) =>
                  prev.map((t) =>
                    t.id === tag.id ? { ...t, removing: true } : t
                  )
                )
              }
              onPress={() => {
                if (tag.removing) deleteTag(tag);
              }}
            >
              <Text style={styles.selectedChipText}>{tag.name}</Text>
              {tag.removing && (
                <Icon name="trash" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          ))}

          {userTags.length === 0 && (
            <Text style={styles.empty}>No tags yet.</Text>
          )}
        </View>

        {/* Search results */}
        {search.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <View style={styles.tagGrid}>
              {filteredTags.length === 0 && (
                <Text style={styles.empty}>No tags found.</Text>
              )}

              {filteredTags.map((tag) =>
                isSelected(tag.id) ? null : (
                  <TouchableOpacity
                    key={tag.id}
                    style={styles.unselectedChip}
                    onPress={() => addTag(tag)}
                  >
                    <Text style={styles.unselectedChipText}>
                      {tag.name}
                    </Text>
                    <Icon name="add" size={16} color="#333" />
                  </TouchableOpacity>
                )
              )}
            </View>
          </>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}


const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "#666", marginBottom: 10 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    marginLeft: 6,
    height: 20,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 8,
  },

  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  // selected tag chip (normal)
  selectedChip: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChipText: { color: "#fff", fontWeight: "600" },

  // chip while in "removing" state (long-press)
  deleteChip: {
    backgroundColor: "#E53935", // red
    transform: [{ scale: 1.02 }],
  },

  // unselected tag chip (search results)
  unselectedChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  unselectedChipText: { color: "#333", fontWeight: "600" },

  empty: { color: "#999", fontStyle: "italic", marginTop: 6 },

  // small helpers for the weight row etc (kept minimal since weight removed)
  weightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  weightText: { color: "#fff", marginHorizontal: 6, minWidth: 30, textAlign: "center" },
});
