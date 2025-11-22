import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useRouter, usePathname } from "expo-router";

export default function TopNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { name: "search", icon: "search-outline", label: "Search" },
    { name: "home", icon: "home-outline", label: "For You" },
    { name: "profile", icon: "person-outline", label: "Profile" },
  ] as const;

  const pathByTab = {
    search: "/(tabs)/topNavTabs/search",
    home: "/(tabs)/topNavTabs/forYou",
    profile: "/(tabs)/topNavTabs/profile",
  } as const;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        marginTop: 70
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.name);
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(pathByTab[tab.name])}
            style={{ alignItems: "center" }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "bold"
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}