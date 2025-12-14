import React, { useEffect, useState } from "react";
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { supabase } from "@/lib/supabase";

export type TagItem = { id: string | number; name: string };

type TagSelectorProps = {
  selectedTags: TagItem[];
  onSelect: (tag: TagItem) => void;
  onDeselect: (tag: TagItem) => void;
};

export default function TagSelector({ selectedTags, onSelect, onDeselect }: TagSelectorProps) {
  const [query, setQuery] = useState("");
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Create tag UI removed per request; only search and select existing tags remain

  // Fetch all tags on mount
  useEffect(() => {
    const fetchAllTags = async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("id, name")
        .order("name", { ascending: true });

      if (!error && data) {
        setAllTags(data as TagItem[]);
      } else if (error) {
        console.error("Error fetching tags:", error);
      }
      setIsLoading(false);
    };

    fetchAllTags();
  }, []);

  // Filter tags based on search query
  const filteredTags = allTags.filter((tag) =>
    tag.name.toLowerCase().includes(query.toLowerCase())
  );

  const isSelected = (tag: TagItem) => {
    return selectedTags.some((t) => t.id === tag.id);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Add keyword tags to categorize your Store.</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Tags Grid */}
      {isLoading ? (
        <Text style={styles.loadingText}>Loading tags...</Text>
      ) : (
        <View style={styles.tagsGrid}>
          {filteredTags.map((tag) => {
            const selected = isSelected(tag);
            return (
              <TouchableOpacity
                key={String(tag.id)}
                onPress={() => (selected ? onDeselect(tag) : onSelect(tag))}
                style={[styles.tagChip, selected ? styles.tagChipSelected : styles.tagChipUnselected]}
              >
                <Text style={[styles.tagText, selected ? styles.tagTextSelected : styles.tagTextUnselected]}>
                  {tag.name}
                </Text>
                <Icon
                  name={selected ? "close" : "add"}
                  size={16}
                  color={selected ? "#fff" : "#333"}
                  style={styles.tagIcon}
                />
              </TouchableOpacity>
            );
          })}
          {filteredTags.length === 0 && query && (
            <Text style={styles.noResultsText}>No tags found matching "{query}"</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  allTagsLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9333ea", // Purple color
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#000",
    fontSize: 14,
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tagChipSelected: {
    backgroundColor: "#9333ea",
  },
  tagChipUnselected: {
    backgroundColor: "#f3f4f6",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagTextSelected: {
    color: "#fff",
  },
  tagTextUnselected: {
    color: "#333",
  },
  tagIcon: {
    marginLeft: 2,
  },
  loadingText: {
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  noResultsText: {
    color: "#999",
    textAlign: "center",
    padding: 20,
    fontStyle: "italic",
  },
});
