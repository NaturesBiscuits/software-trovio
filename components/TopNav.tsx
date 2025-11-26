import { usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get("window");

type Tab = {
  key: string;
  label: string;
  route: string;
};

type TopNavProps = {
  forYouActive?: boolean;
};

export default function TopNav({ forYouActive }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const indicatorPositionX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  const tabs: Tab[] = [
    { key: "search", label: "Search", route: "/(tabs)/topNavTabs/search" },
    { key: "forYou", label: "For You", route: "/(tabs)/topNavTabs/forYou" },
    { key: "profile", label: "Profile", route: "/(tabs)/topNavTabs/profile" },
  ];

  const getActiveKey = () => {
    if (forYouActive === true) return "forYou";
    if (
      pathname.includes("forYou") ||
      pathname.endsWith("/discover") ||
      pathname === "/"
    ) {
      return "forYou";
    }
    if (pathname.includes("search")) return "search";
    if (pathname.includes("profile")) return "profile";
    return "";
  };

  const activeKey = getActiveKey();
  const tabWidth = screenWidth / tabs.length;
  const indicatorWidthValue = tabWidth * 0.6;

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
    const activeIndex = tabs.findIndex(tab => tab.key === activeKey && tab.key !== "forYou");
    if (activeIndex !== -1) {
      animateIndicator(activeIndex);
    } else {
      indicatorWidth.value = withTiming(0, { duration: 200 });
    }
  }, [activeKey]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPositionX.value }],
    width: indicatorWidth.value,
    opacity: indicatorWidth.value > 0 ? 1 : 0,
  }));

  return (
    <>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 120,
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
        {/* Animated Indicator for Search/Profile */}
        <Animated.View
          style={[
            {
              position: "absolute",
              height: 3,
              backgroundColor: "#007AFF",
              borderRadius: 2,
              top: 40,
            },
            animatedIndicatorStyle,
          ]}
        />
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
            const showForYouUnderline = tab.key === "forYou" && isActive;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => router.push(tab.route)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                  justifyContent: "flex-end",
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
                {/* Black underline, shorter for For You tab when active */}
                {showForYouUnderline && (
                  <View
                    style={{
                      marginTop: 6,
                      height: 2.5,
                      width: tabWidth * 0.35, // Shorter line
                      backgroundColor: "#000",
                      borderRadius: 1.5,
                      alignSelf: "center",
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );
}
