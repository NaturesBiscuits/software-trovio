import { Stack, usePathname } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import BottomNav from "../../components/BottomNav";

export default function TabsLayout() {
    const pathname = usePathname();
    const hideBottomNav = pathname?.includes("/topNavTabs/Upload");
    return ( 
        <React.Fragment>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="notification" />
                <Stack.Screen name="home" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="discover" />
            </Stack>
            {!hideBottomNav && <BottomNav />}
        </React.Fragment>
    );
}
//currently on comment cause it causes dark screen when launching.