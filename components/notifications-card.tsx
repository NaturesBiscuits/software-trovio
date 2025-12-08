import React from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

export type PromotionNotification = {
  id: string;
  store_id: string;
  store_name: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

interface NotificationCardProps {
  item: PromotionNotification;
  onPress: (notification: PromotionNotification) => void;
}

export default function NotificationCard({ item, onPress }: NotificationCardProps) {
  let createdDate = "";
  try {
    createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    createdDate = "";
  }

  return (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationImageWrapper}>
        <Icon name="pricetag" size={28} color="#191820" />
      </View>
      <View style={styles.notificationInfo}>
        <Text style={styles.notificationStore}>{item.store_name}</Text>
        <Text style={styles.notificationDescription}>
          has posted an ongoing promotion. Click this to check it out
        </Text>
        <Text style={styles.notificationDate}>{createdDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#f9fafc",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "#ebedf3",
    alignItems: "center",
  },
  notificationImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 58,
    height: 58,
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationStore: {
    fontSize: 14,
    fontWeight: "600",
    color: "#191820",
    marginBottom: 6,
  },
  notificationDescription: {
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: "#9a9a9c",
  },
});

