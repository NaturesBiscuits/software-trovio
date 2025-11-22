import React from "react";
import { Text, View } from "react-native";
import BottomNav from "../../../components/BottomNav";
import TopNav from "../../../components/TopNav";

export default function SearchScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <TopNav/>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 120 }}>
        <Text>Search</Text>
      </View>
      <BottomNav visible />
    </View>
  );
}
