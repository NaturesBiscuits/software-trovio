import UserTagPreferences from "@/components/UserTagPreferences";
import { useUserProfile } from "@/context/UserProfileContext";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function ProfileScreen() {
  const { userProfile, isLoading, refreshProfile } = useUserProfile();
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>(undefined); // immediate UI update

  // Helper: upload image and update avatar_url in supabase
  const handleChangePhoto = async () => {
    let permissionResult;
    if (Platform.OS === "ios" || Platform.OS === "android") {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t("Permission denied"), t("Permission to access photos is required."));
        return;
      }
    }
    try {
      setUploadingPhoto(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      let uri = asset.uri;
      const ext = uri.split(".").pop() || "jpg";
      const userId = userProfile?.id || "user";
      const filePath = `profiles/${userId}/avatar.${ext}`;

      let file: any;
      file = await fetch(uri).then(res => res.blob());

      const { error: uploadError } = await supabase.storage
        .from("tus")
        .upload(filePath, file, {
          upsert: true,
          contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        });
      if (uploadError) {
        Alert.alert(t("Upload failed"), uploadError.message);
        return;
      }

      // Update DB with the storage path (not a public URL)
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: filePath })
        .eq("id", userProfile?.id);

      if (updateErr) {
        Alert.alert(t("Failed to update avatar"), updateErr.message);
        return;
      }

      // Show image immediately by generating a public URL for rendering
      const { data: publicData } = supabase.storage.from("tus").getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl;
      setAvatar(publicUrl);
      refreshProfile && (await refreshProfile());
    } catch (e: any) {
      Alert.alert(t("Failed to change photo"), e?.message || String(e));
    } finally {
      setUploadingPhoto(false);
    }
  };
  // Compute public URL only for rendering; DB stores the path
  const avatarUri =
    avatar ??
    (userProfile?.avatar_url
      ? supabase.storage.from("tus").getPublicUrl(userProfile.avatar_url).data.publicUrl
      : undefined);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24 }}>
      {/* Back Button and Refresh */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/discover')}
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

      {/* Profile Image and Camera Icon in bottom right */}
      <View style={{ alignItems: "center", marginBottom: 15 }}>
        <View style={s.profileImageContainer}>
          <View style={s.profileImageWrapper}>
            {uploadingPhoto ? (
              <View style={[s.profileImage, { justifyContent: "center", alignItems: "center", backgroundColor: "#eee" }]}>
                <ActivityIndicator size={32} color="#007AFF" />
              </View>
            ) : avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.profileImage} />
            ) : (
              <View style={[s.profileImage, s.defaultProfileContainer]}>
                <Icon name="person" size={50} color="#999" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={s.cameraBottomRightOverlay}
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            activeOpacity={0.6}
          >
            <View style={s.cameraCircleLarger}>
              <Icon name="camera" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleChangePhoto} disabled={uploadingPhoto}>
          <Text style={s.changePhotoText}>{uploadingPhoto ? t("Changing photo...") : t("Change photo")}</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={s.infoCard}>
        {/* Username (redirect to change name screen) */}
        <View style={s.infoRow}>
          <Text style={s.label}>{t("Username")}</Text>
          <TouchableOpacity style={s.rowRight} onPress={() => router.push("/(tabs)/topNavTabs/changeusername")}>
            <Text style={s.value}>
              {userProfile?.username ?? t("Loading username...")}
            </Text>
            <Icon name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>
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
            router.push('/(tabs)/topNavTabs/reviewApplicants');
          }}
        >
          <View style={s.adminButtonContent}>
            <Icon name="people" size={20} color="#007AFF" />
            <Text style={s.adminButtonText}>{t("Review Applicants")}</Text>
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
            // Clear image cache before logout
            const { clearImageCache } = await import('@/lib/imageUtils');
            const { clearImageUrlCache } = await import('@/lib/imageCache');
            await clearImageCache();
            await clearImageUrlCache();
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
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    // Subtle outline (barely visible)
    borderWidth: 1.2,
    borderColor: "rgba(60,60,60,0.07)",
    backgroundColor: "#fff",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 50,
  },
  defaultProfileContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  cameraBottomRightOverlay: {
    position: "absolute",
    bottom: -10,
    right: -10,
    zIndex: 10,
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraCircleLarger: {
    backgroundColor: "#007AFF",
    borderRadius: 21,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.10,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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