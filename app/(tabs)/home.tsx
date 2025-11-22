import React from "react";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  // Redirect to Discover as the default screen after login/app open
  return <Redirect href="/Discover" />;
}
