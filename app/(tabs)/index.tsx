import React from "react";
import { Redirect } from "expo-router";

export default function TabsIndex() {
  // When navigating to the (tabs) group root, send users to Discover
  return <Redirect href="/discover" />;
}
