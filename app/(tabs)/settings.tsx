import React, { useState } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const privacySubOptions = [
  {
    title: "Password Reset",
    icon: "key-outline",
    onPress: (router: any) => { /* Route to password reset */ },
  },
  {
    title: "Account Deletion",
    icon: "trash-outline",
    // This navigates using Expo Router to the Account Deletion screen
    onPress: (router: any) => { router.push("/accountdeletion"); },
  },
];

const preferenceSubOptions = [
  {
    title: "Store Preference",
    icon: "storefront-outline",
    onPress: (router: any) => { /* Route to store preference */ },
  },
  {
    title: "Manage Notifications",
    icon: "notifications-outline",
    onPress: (router: any) => { /* Route to manage notifications */ },
  },
  {
    title: "Light Mode",
    icon: "sunny-outline",
    onPress: (router: any) => { /* Route to light mode or toggle */ },
  },
];

const languageOptions = [
  { title: "English", code: "en", icon: "ellipse-outline" },
  { title: "Filipino", code: "fil", icon: "ellipse-outline" },
  { title: "简体中文", code: "zh", icon: "ellipse-outline" },
  { title: "Español", code: "es", icon: "ellipse-outline" },
  { title: "हिन्दी", code: "hi", icon: "ellipse-outline" },
  { title: "日本語", code: "ja", icon: "ellipse-outline" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [preferenceExpanded, setPreferenceExpanded] = useState(false);
  const [languageExpanded, setLanguageExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // default "English"

  return (
    <View style={{ flex: 1, backgroundColor: "#191820" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingTop: 50, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginRight: 10 }}>
          <Icon name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>Settings</Text>
      </View>

      {/* Buttons are below the header now */}
      <View style={{ flex: 1, paddingHorizontal: 24, marginTop: 38 }}>
        {/* PRIVACY BUTTON */}
        <View key="Privacy" style={{ marginBottom: privacyExpanded ? 2 : 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1E1D25",
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              borderBottomLeftRadius: privacyExpanded ? 0 : 14,
              borderBottomRightRadius: privacyExpanded ? 0 : 14,
              paddingVertical: 18,
              paddingHorizontal: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 5,
              elevation: 2,
            }}
            activeOpacity={0.8}
            onPress={() => setPrivacyExpanded((prev) => !prev)}
          >
            <Icon name="lock-closed-outline" size={24} color="#D7D7D7" style={{ marginRight: 18 }} />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", flex: 1 }}>Privacy</Text>
            <Icon
              name={privacyExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={22}
              color="#BFBFBF"
            />
          </TouchableOpacity>
          {privacyExpanded && (
            <View
              style={{
                backgroundColor: "#1E1D25",
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: "hidden",
                marginTop: -2,
                paddingBottom: 4,
              }}
            >
              {privacySubOptions.map((sub) => (
                <TouchableOpacity
                  key={sub.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 13,
                    paddingHorizontal: 32,
                  }}
                  activeOpacity={0.85}
                  onPress={() => sub.onPress && sub.onPress(router)}
                >
                  <Icon name={sub.icon} size={20} color="#D7D7D7" style={{ marginRight: 16 }} />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>{sub.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* PREFERENCE BUTTON */}
        <View key="Preference" style={{ marginBottom: preferenceExpanded ? 2 : 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1E1D25",
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              borderBottomLeftRadius: preferenceExpanded ? 0 : 14,
              borderBottomRightRadius: preferenceExpanded ? 0 : 14,
              paddingVertical: 18,
              paddingHorizontal: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 5,
              elevation: 2,
            }}
            activeOpacity={0.8}
            onPress={() => setPreferenceExpanded((prev) => !prev)}
          >
            <Icon name="options-outline" size={24} color="#D7D7D7" style={{ marginRight: 18 }} />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", flex: 1 }}>Preference</Text>
            <Icon
              name={preferenceExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={22}
              color="#BFBFBF"
            />
          </TouchableOpacity>
          {preferenceExpanded && (
            <View
              style={{
                backgroundColor: "#1E1D25",
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: "hidden",
                marginTop: -2,
                paddingBottom: 4,
              }}
            >
              {preferenceSubOptions.map((sub) => (
                <TouchableOpacity
                  key={sub.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 13,
                    paddingHorizontal: 32,
                  }}
                  activeOpacity={0.85}
                  onPress={() => sub.onPress && sub.onPress(router)}
                >
                  <Icon name={sub.icon} size={20} color="#D7D7D7" style={{ marginRight: 16 }} />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "500" }}>{sub.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* LANGUAGE BUTTON */}
        <View key="Language" style={{ marginBottom: languageExpanded ? 2 : 16 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#1E1D25",
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              borderBottomLeftRadius: languageExpanded ? 0 : 14,
              borderBottomRightRadius: languageExpanded ? 0 : 14,
              paddingVertical: 18,
              paddingHorizontal: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 5,
              elevation: 2,
            }}
            activeOpacity={0.8}
            onPress={() => setLanguageExpanded((prev) => !prev)}
          >
            <Icon name="language-outline" size={24} color="#D7D7D7" style={{ marginRight: 18 }} />
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600", flex: 1 }}>
              Language
            </Text>
            <Text style={{ color: "#BFBFBF", fontSize: 16, marginRight: 5 }}>
              {languageOptions.find((o) => o.code === selectedLanguage)?.title ?? "English"}
            </Text>
            <Icon
              name={languageExpanded ? "chevron-up-outline" : "chevron-down-outline"}
              size={22}
              color="#BFBFBF"
            />
          </TouchableOpacity>
          {languageExpanded && (
            <View
              style={{
                backgroundColor: "#1E1D25",
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                overflow: "hidden",
                marginTop: -2,
                paddingBottom: 4,
              }}
            >
              {languageOptions.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 13,
                    paddingHorizontal: 32,
                  }}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLanguage(lang.code)}
                >
                  <Text style={{
                    color: selectedLanguage === lang.code ? "#fff" : "#BFBFBF",
                    fontWeight: selectedLanguage === lang.code ? "700" : "500",
                    fontSize: 16,
                  }}>
                    {lang.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* HELP CENTER BUTTON */}
        <TouchableOpacity
          key="Help Center"
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#1E1D25",
            borderRadius: 14,
            paddingVertical: 18,
            paddingHorizontal: 10,
            marginBottom: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 5,
            elevation: 2,
          }}
          activeOpacity={0.8}
          onPress={() => {/* Add route here if desired */}}
        >
          {/* Show "?" as the icon */}
          <Icon name={"help-outline"} size={24} color="#D7D7D7" style={{ marginRight: 18 }} />
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>Help Center</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
