import UserTagPreferences from "@/components/UserTagPreferences";
import { useUserProfile } from "@/context/UserProfileContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
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