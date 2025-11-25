import { usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View, Dimensions, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

// --- Types ---
type Tab = {
  key: string;
  label: string;
  route: string;
};

type TopNavProps = {
  forYouActive?: boolean;
};

// --- Component ---
export default function TopNav({ forYouActive }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Shared values for animation
  const indicatorPositionX = useSharedValue(0); // X-offset for the indicator
  const indicatorWidth = useSharedValue(0); // Width for the indicator

  const tabs: Tab[] = [
    { key: "search", label: "Search", route: "/(tabs)/topNavTabs/search" },
    { key: "forYou", label: "For You", route: "/(tabs)/topNavTabs/forYou" },
    { key: "profile", label: "Profile", route: "/(tabs)/topNavTabs/profile" },
  ];

  // Helper function to determine the active key
  const getActiveKey = () => {
    // 1. Check for the externally controlled "For You" state (highest priority)
    if (forYouActive === true) return "forYou";

    // 2. Check path-based logic
    if (
      pathname.includes("forYou") ||
      pathname.endsWith("/discover") ||
      pathname === "/"
    ) {
      return "forYou";
    }
    if (pathname.includes("search")) return "search";
    if (pathname.includes("profile")) return "profile";

    return ""; // Default or no match
  };

  const activeKey = getActiveKey();

  // Calculate tab width and positions (assuming equal flex distribution)
  const tabWidth = screenWidth / tabs.length;
  const indicatorWidthValue = tabWidth * 0.6; // 60% of tab width for indicator

  // Function to animate the indicator to the active tab
  const animateIndicator = (tabIndex: number) => {
    const centerX = tabIndex * tabWidth + tabWidth / 2 - indicatorWidthValue / 2;
    indicatorPositionX.value = withTiming(centerX, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    indicatorWidth.value = withTiming(indicatorWidthValue, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  };

  useEffect(() => {
    const activeIndex = tabs.findIndex(tab => tab.key === activeKey);
    if (activeIndex !== -1) {
      animateIndicator(activeIndex);
    }
  }, [activeKey]);

  // Animated style for the sliding indicator
  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorPositionX.value }],
      width: indicatorWidth.value,
      opacity: indicatorWidth.value > 0 ? 1 : 0, // Fade in when width is set
    };
  });

  return (
    <>
      {/* Background cover to prevent transparency and handle shadows */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120, // Covers enough vertical space for header
          backgroundColor: "#fff",
          zIndex: 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 6,
          borderBottomColor: "#e0e0e0",
          borderBottomWidth: 1,
        }}
        pointerEvents="none"
      />
      {/* Navigation Bar */}
      <View
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderColor: "#e0e0e0",
          zIndex: 10,
        }}
      >
        {/* Animated Indicator */}
        <Animated.View
          style={[
            {
              position: "absolute",
              height: 3,
              backgroundColor: "#007AFF",
              borderRadius: 2,
              top: 40, // Below the text
            },
            animatedIndicatorStyle,
          ]}
        />

        {/* Tab Buttons */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "flex-end",
            backgroundColor: "#fff",
            paddingTop: 10,
            paddingBottom: 10,
          }}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeKey;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => router.push(tab.route)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: isActive ? "bold" : "normal",
                    color: isActive ? "#1a1a1a" : "#7a7a7a",
                    letterSpacing: 0.1,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}
