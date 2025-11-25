import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

type BottomNavProps = {
  /** Controls visibility. Defaults to false so the nav is hidden unless explicitly enabled. */
  visible?: boolean;
};

export default function BottomNav({ visible = false }: BottomNavProps) {
  // By default do not render the bottom nav. Pages that want it can render <BottomNav visible />
  if (!visible) return null;
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { 
      name: "notification", 
      iconOutline: "notifications-outline", 
      iconFilled: "notifications" 
    },
    { 
      name: "home", 
      iconOutline: "home-outline", 
      iconFilled: "home" 
    },
    { 
      name: "settings", 
      iconOutline: "settings-outline", 
      iconFilled: "settings" 
    },
  ] as const;

  const pathByTab = {
    notification: "/(tabs)/notification",
    home: "/(tabs)/discover",
    settings: "/(tabs)/settings",
  } as const;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#191820",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        paddingVertical: 15,
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
      }}
    >
      {tabs.map((tab) => {
        // For home tab, check if we're on discover route
        const isActive = tab.name === "home" 
          ? pathname?.includes("/discover")
          : pathname?.includes(tab.name);
        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(pathByTab[tab.name])}
            style={{ alignItems: "center" }}
          >
            <Icon
              name={isActive ? tab.iconFilled : tab.iconOutline}
              size={30}
              color={isActive ? "#FFFFFF" : "#FFFFFF"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
