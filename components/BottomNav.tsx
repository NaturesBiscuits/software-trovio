import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useNotifications } from "../context/NotificationContext"; // Assuming this path is correct

// --- Constants ---
const ACTIVE_COLOR = "#FFFFFF"; // White
const INACTIVE_COLOR = "#9A9A9A"; // A softer color for inactive icons
const BACKGROUND_COLOR = "#191820"; // Dark background
const ICON_SIZE = 28;
const NOTIFICATION_DOT_COLOR = "#ff3b30"; // Red
const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Types ---
type TabName = "notification" | "home" | "settings";

type TabConfig = {
  name: TabName;
  iconOutline: React.ComponentProps<typeof Icon>["name"];
  iconFilled: React.ComponentProps<typeof Icon>["name"];
};

const TABS: readonly TabConfig[] = [
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
];

const PATH_BY_TAB: Readonly<Record<TabName, string>> = {
  notification: "/(tabs)/notification",
  home: "/(tabs)/discover",
  settings: "/(tabs)/settings",
};

type BottomNavProps = {
  /** Controls visibility. Defaults to false so the nav is hidden unless explicitly enabled. */
  visible?: boolean;
};

// --- Component ---
export default function BottomNav({ visible = false }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasUnreadNotifications } = useNotifications();

  if (!visible) return null;

  // Helper function to determine if a tab is active
  const getIsActive = (tabName: TabName) => {
    // Special case for 'home' which maps to '/discover' route
    if (tabName === "home") {
      return pathname?.includes("/discover");
    }
    // General case: check if the pathname includes the tab name
    // This is a bit fragile, a better approach might be checking for exact path match or using a dedicated tab stack context.
    return pathname?.includes(`/${tabName}`);
  };

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = getIsActive(tab.name);
        const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => router.push(PATH_BY_TAB[tab.name])}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityLabel={`${tab.name} tab`}
            accessibilityState={{ selected: isActive }}
          >
            <Icon
              name={isActive ? tab.iconFilled : tab.iconOutline}
              size={ICON_SIZE}
              color={iconColor}
            />
            {/* Notification badge for the 'notification' tab */}
            {tab.name === "notification" && hasUnreadNotifications && (
              <View style={styles.notificationDot} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    // Styles for the main bottom navigation bar
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: BACKGROUND_COLOR,
    paddingVertical: 15,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // Add shadow/elevation for better visual separation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    width: SCREEN_WIDTH, // Explicitly setting width to handle some edge cases
  },
  tabButton: {
    // Styles for each individual tab
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    // This makes the touch area slightly larger
    paddingHorizontal: 10, 
    paddingVertical: 5,
  },
  notificationDot: {
    // Styles for the unread notification indicator
    position: "absolute",
    top: -2, // Adjusted for better placement relative to the icon
    right: 0, // Adjusted for better placement relative to the icon
    width: 10, // Slightly smaller dot
    height: 10,
    borderRadius: 5,
    backgroundColor: NOTIFICATION_DOT_COLOR,
    borderWidth: 2,
    borderColor: BACKGROUND_COLOR, // Border color matches the background
    zIndex: 10,
  },
});
