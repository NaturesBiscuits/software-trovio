import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

export default function ProfileSidePanel({ visible, onClose }) {
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateX.value = withTiming(0, { duration: 350 });
    } else {
      translateX.value = withTiming(400, { duration: 350 }, (finished) => {
        if (finished) {
          // Delay unmount until animation is completely done
          setShouldRender(false);
        }
      });
    }
  }, [visible]);

  if (!shouldRender) return null;

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <>
      {/* Dark overlay */}
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      />

      {/* Sliding panel */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "70%",
            backgroundColor: "#141414",
            padding: 25,
            paddingTop: 80,
            borderTopLeftRadius: 35,
            borderBottomLeftRadius: 35,
          },
          panelStyle,
        ]}
      >
        {/* User Info */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Image
            source={{ uri: "https://via.placeholder.com/100" }}
            style={{ width: 70, height: 70, borderRadius: 35, marginBottom: 10 }}
          />
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            Esteve Buns
          </Text>
          <Text style={{ color: "#ccc", fontSize: 13 }}>
            teebuns@gmail.com
          </Text>
        </View>

        {/* Menu items */}
        <MenuItem label="Profile" />
        <MenuItem label="Saved Stores" />
        <MenuItem label="Settings" />
        <MenuItem label="Logout" />
      </Animated.View>
    </>
  );
}

function MenuItem({ label }) {
  return (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          backgroundColor: "#1f1f1f",
          borderRadius: 16,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>•</Text>
      </View>
      <Text style={{ color: "white", fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
}
