import { Stack } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";

export default function TabsLayout() {
    return ( 
        <React.Fragment>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="discover" />
                <Stack.Screen name="notification" />
                <Stack.Screen name="home" />
                <Stack.Screen name="settings" />
            </Stack>
        </React.Fragment>
    );
}
//currently on comment cause it causes dark screen when launching.