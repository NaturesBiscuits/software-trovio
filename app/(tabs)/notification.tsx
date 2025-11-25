import React from "react";
import { Text, View, Image, StyleSheet } from "react-native";
import BottomNav from "../../components/BottomNav";

export default function NotificationScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      
      {/* ===== HEADER ===== */}
      <View style={styles.topHeader}>
        <View>
          <View></View>
          <Text style={styles.headerText}>Notifications</Text>
          <Text style={styles.subHeaderText}>Stay updated with new alerts</Text>
        </View>
      </View>

      {/* ===== BODY ===== */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>No notifications yet</Text>
      </View>

      <BottomNav visible />
    </View>
  );
}


const styles = StyleSheet.create({
  /* ---------------- HEADER ---------------- */
  topHeader: {
    backgroundColor: "#191820",
    paddingVertical: 80,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    justifyContent: "flex-end",
    marginBottom: 15,
  },
  headerText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 15,
  },
  subHeaderText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 10,
  },
});
