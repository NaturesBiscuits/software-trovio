import UserTagPreferences from "@/components/UserTagPreferences";
import { useUserProfile } from "@/context/UserProfileContext";
import { supabase } from "@/lib/supabase";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function ProfileScreen() {
  const { userProfile, isLoading, refreshProfile, updateProfile } = useUserProfile();
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Initialize username from cached profile data
  useEffect(() => {
    if (userProfile?.username) {
      setUsername(userProfile.username);
    }
  }, [userProfile?.username]);

  // Save username change
  const handleSaveUsername = async () => {
    if (!username.trim()) {
      Alert.alert(t("Invalid username"), t("Username cannot be empty."));
      return;
    }

    if (!userProfile) {
      Alert.alert(t("Error"), t("User profile not loaded."));
      return;
    }

    setIsSaving(true);

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim().toLowerCase())
      .maybeSingle();

    if (checkError) {
      console.error("Error checking username:", checkError);
      Alert.alert(t("Error"), t("Something went wrong while checking username."));
      setIsSaving(false);
      return;
    }

    if (existingUser && existingUser.id !== userProfile.id) {
      Alert.alert(t("Username taken"), t("That username is already in use. Please choose another."));
      setIsSaving(false);
      return;
    }

    // Update username
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: username.trim().toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", userProfile.id);

    if (updateError) {
      console.error("Error updating username:", updateError);
      Alert.alert(t("Error"), t("Failed to update username."));
    } else {
      // Update cached profile data
      updateProfile({ username: username.trim().toLowerCase() });
      Alert.alert(t("Success"), t("Your username has been updated!"));
      setIsEditingUsername(false);
    }

    setIsSaving(false);
  };

  // Handle username editing
  const handleUsernamePress = () => {
    setIsEditingUsername(true);
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    // Reset to original username if user cancels
    setUsername(userProfile?.username || "");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24 }}>
      {/* Back Button and Refresh */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={refreshProfile}
          disabled={isLoading}
          style={{ padding: 8 }}
        >
          <Icon name="refresh" size={24} color={isLoading ? "#ccc" : "#007AFF"} />
        </TouchableOpacity>
      </View>

      {/* Profile Image */}
      <View style={{ alignItems: "center", marginBottom: 15 }}>
        <View style={s.profileImageContainer}>
          <Image
            source={{ uri: userProfile?.avatar_url || "https://via.placeholder.com/100" }}
            style={s.profileImage}
          />
          <View style={s.cameraIconContainer}>
            <Icon name="camera" size={18} color="#fff" />
          </View>
        </View>
        <TouchableOpacity>
          <Text style={s.changePhotoText}>{t("Change photo")}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={s.infoCard}>
        {/* Username */}
        <View style={s.infoRow}>
          <Text style={s.label}>{t("Username")}</Text>
          <View style={s.rowRight}>
            {isEditingUsername ? (
              <>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  style={[s.valueInput]}
                  placeholder={t("Enter username")}
                  autoCapitalize="none"
                  autoFocus
                />
                <TouchableOpacity onPress={handleSaveUsername} disabled={isSaving}>
                  <Icon name="checkmark-circle" size={22} color={isSaving ? "#ccc" : "#007AFF"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUsernameCancel}>
                  <Icon name="close-circle" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={handleUsernamePress}>
                  <Text style={s.value}>{username || t("Loading username...")}</Text>
                </TouchableOpacity>
                <Icon name="chevron-forward" size={18} color="#000" />
              </>
            )}
          </View>
        </View>

        {/* Name */}
        <View style={s.infoRow}>
          <Text style={s.label}>{t("Name")}</Text>
          <View style={s.rowRight}>
            <Text style={s.value}>{userProfile?.full_name || t("Guest")}</Text>
            <Icon name="chevron-forward" size={18} color="#000" />
          </View>
        </View>

        {/* Email */}
        <View style={s.infoRow}>
          <Text style={s.label}>{t("Email")}</Text>
          <View style={s.rowRight}>
            <Text style={[s.value, { fontWeight: "700" }]}>
              {isLoading ? t("Loading...") : userProfile?.email || t("Loading...")}
            </Text>
          </View>
        </View>
      </View>
      
      {userProfile?.id && (
        <UserTagPreferences userId={userProfile.id} />
      )}


      {/* Professional Account Application */}
      <TouchableOpacity
        style={s.professionalButton}
        onPress={() => {
          router.push("/(tabs)/topNavTabs/Upload")
        }}
      >
        <View style={s.professionalButtonContent}>
          <Icon name="briefcase" size={20} color="#007AFF" />
          <Text style={s.professionalButtonText}>{t("Apply for a professional account")}</Text>
          <Icon name="chevron-forward" size={18} color="#007AFF" />
        </View>
      </TouchableOpacity>

      {/* Admin Applicants Button */}
      {userProfile?.type === 'admin' && (
        <TouchableOpacity
          style={s.adminButton}
          onPress={() => {
            // Navigate to the review applicants screen
            router.push('/(tabs)/topNavTabs/reviewApplicants');
          }}
        >
          <View style={s.adminButtonContent}>
            <Icon name="people" size={20} color="#007AFF" />
            <Text style={s.adminButtonText}>{t("Applicants  (admin)")}</Text>
            <Icon name="chevron-forward" size={18} color="#007AFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={s.logoutButton}
        disabled={isSigningOut}
        onPress={async () => {
          try {
            setIsSigningOut(true);
            await supabase.auth.signOut();
          } finally {
            setIsSigningOut(false);
          }
        }}
      >
        <Text style={s.logoutText}>{isSigningOut ? t("Logging out...") : t("Log out")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    position: "relative",
  },
  profileImage: { width: "100%", height: "100%" },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 6,
  },
  changePhotoText: {
    color: "#007AFF",
    fontWeight: "600",
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    color: "#777",
    fontWeight: "500",
  },
  value: {
    color: "#000",
    fontSize: 15,
  },
  valueInput: {
    color: "#000",
    fontSize: 15,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    borderRadius: 6,
    borderColor: "#ddd",
    borderWidth: 1,
    minWidth: 120,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  professionalButton: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  professionalButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  professionalButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  adminButton: {
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE5D9",
  },
  adminButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminButtonText: {
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
  },
});