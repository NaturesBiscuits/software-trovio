import React from "react";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  // Redirect to forYou as the default screen
  return <Redirect href="/(tabs)/topNavTabs/forYou" />;
}
