import { Stack } from "expo-router";
import React from "react";

export default function TopNavTabsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="forYou" />
      <Stack.Screen name="search" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
