import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export default function BoostPromotionsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="rocket-outline" size={80} color="#191820" style={styles.icon} />
        <Text style={styles.title}>Boost Promotions</Text>
        <Text style={styles.message}>
          Sorry! Boost promotions feature is currently under development. Stay tuned for more updates.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/discover")}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Back to Discover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#191820",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

