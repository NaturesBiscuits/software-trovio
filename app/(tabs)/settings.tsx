import React from "react";
import { Text, View } from "react-native";
import BottomNav from "../..//components/BottomNav";

export default function ProfileScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Settings</Text>
      </View>
      <BottomNav visible />
    </View>
  );
}


