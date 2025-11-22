import { usePathname, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";

type BottomNavProps = {
  /** Controls visibility. Defaults to false so the nav is hidden unless explicitly enabled. */
  visible?: boolean;
};

export default function BottomNav({ visible = false }: BottomNavProps) {
  // By default do not render the bottom nav. Pages that want it can render <BottomNav visible />
  if (!visible) return null;
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { name: "notification", labelKey: "Notifications" },
    { name: "home", labelKey: "Home" },
    { name: "settings", labelKey: "Settings" },
  ] as const;

  const pathByTab = {
    notification: "/notification",
    home: "/home",
    settings: "/settings",
  } as const;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingVertical: 10,
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
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
                color: isActive ? "#FFFFFF" : "#8E8E93",
                fontSize: 15,
              }}
            >
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
