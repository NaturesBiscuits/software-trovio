import React, { useState, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUserProfile } from "@/context/UserProfileContext";

const MAX_USERNAME_LENGTH = 20;
const PLACEHOLDER_TEXT = "Enter new name";
const IMAGE_URI = "file:///mnt/data/bf40f1d6-13df-4732-ac2e-a34c79bbf380.png"; // Note: This local path might fail in a real app

export default function EditNameScreen() {
  const router = useRouter();
  const { userProfile, isLoading: profileLoading, refreshProfile } = useUserProfile();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile?.username && name === "") {
      setName(userProfile.username);
    }
  }, [userProfile]);

  const canSave = useMemo(() => {
    if (saving || profileLoading) return false;
    const currentName = name.trim();
    if (currentName.length === 0) return false;
    return currentName !== userProfile?.username;
  }, [name, saving, profileLoading, userProfile?.username]);

  const chars = name.length;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const trimmedName = name.trim();

    try {
      // userProfile may be null
      if (!userProfile) {
        Alert.alert("Error", "No user profile found.");
        setSaving(false);
        return;
      }
      if (trimmedName.length > MAX_USERNAME_LENGTH) {
        Alert.alert("Error", `Name exceeds the maximum length of ${MAX_USERNAME_LENGTH} characters.`);
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ username: trimmedName })
        .eq("id", userProfile.id);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        await refreshProfile();
        router.back();
      }
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "An unexpected error occurred while updating your name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.topButton}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            style={styles.topButton}
            disabled={!canSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={styles.saveText.color} /> 
            ) : (
              <Text style={[styles.saveText, !canSave && styles.saveDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Name edit area without square background, but with a styled placeholder box */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "transparent" }}
        >
          {/* Optional decorative image */}
          <Image
            source={{ uri: IMAGE_URI }}
            style={styles.headerImage}
            resizeMode="cover"
          />

          <View style={styles.nakedContent}>
            <Text style={styles.nakedTitle}>Name</Text>
            <Text style={styles.nakedSubtitle}>
              Update the name associated with your account.
              {"\n"}Changes will be visible across your profile.
            </Text>

            <View style={styles.inputRow}>
              {/* Placeholder "text box" style around the text input */}
              <View style={styles.placeholderBox}>
                <TextInput
                  style={styles.inputNoBg}
                  onChangeText={setName}
                  value={name}
                  placeholder={PLACEHOLDER_TEXT}
                  placeholderTextColor="#BFBFBF"
                  maxLength={MAX_USERNAME_LENGTH}
                  returnKeyType="done"
                  underlineColorAndroid="transparent"
                  editable={!saving && !profileLoading}
                  onSubmitEditing={handleSave}
                  testID="name-input"
                />
              </View>
              <Text style={styles.charCount}>
                {chars}/{MAX_USERNAME_LENGTH}
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },

  topBar: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topButton: { padding: 8 },
  cancelText: { color: "#111", fontSize: 16 },
  saveText: { color: "#E53935", fontWeight: "600", fontSize: 16 },
  saveDisabled: { color: "#EFCFCF" },

  contentWrap: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerImage: {
    width: "100%",
    height: 40,
  },

  // Remove square background; paddings adjusted
  nakedContent: {
    flex: 1,
    marginHorizontal: 0,
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  nakedTitle: { fontSize: 28, fontWeight: "700", color: "#333", marginBottom: 8 },
  nakedSubtitle: { fontSize: 13, color: "#6C6C6C", marginBottom: 18, lineHeight: 18 },

  inputRow: {
    marginTop: 6,
  },

  // Placeholder styled "box" for the input, but not a full background block
  placeholderBox: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F1F1F1",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 0,
  },

  // TextInput itself has no background, no border. Placeholder box contains it.
  inputNoBg: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontSize: 16,
    color: "#333",
    width: "100%",
  },

  charCount: {
    alignSelf: "flex-end",
    marginTop: 8,
    fontSize: 12,
    color: "#8A8A8A",
  },
});