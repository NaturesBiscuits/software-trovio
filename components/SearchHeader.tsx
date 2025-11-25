import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SearchHeader() {
  return (
    <View style={styles.topHeader}>
      <View>
        {/* You could place a small spacer here, or a back button if needed */}
        <Text style={styles.headerText}>Search</Text>
        <Text style={styles.subHeaderText}>Find stores and more</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: "#BFBFBF",
    fontSize: 14,
    marginTop: 10,
  },
});
