import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import BottomNav from "../../../components/BottomNav";
import TopNav from "../../../components/TopNav";

export default function ForYou() {
  const cafes = [
    {
      name: "Sullsewji Cafe",
      location: "Gabala (Gabala)",
      image:
        "https://cdn.pixabay.com/photo/2022/02/09/12/19/coffee-shop-7004150_1280.jpg",
    },
    {
      name: "Kho Nha Minh",
      location: "Gabala (Gabala)",
      image:
        "https://cdn.pixabay.com/photo/2016/11/29/12/54/cafe-1869656_1280.jpg",
    },
    {
      name: "The Travelling Gourmet",
      location: "Osaka (Japan)",
      image:
        "https://cdn.pixabay.com/photo/2016/03/09/15/10/cafe-1245776_1280.jpg",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <TopNav />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 120, paddingHorizontal: 16 }}
      >
        {cafes.map((cafe, index) => (
          <View key={index} style={s.card}>
            <Image source={{ uri: cafe.image }} style={s.image} />
            <View style={s.overlay}>
              <Text style={s.name}>{cafe.name}</Text>
              <Text style={s.location}>📍 {cafe.location}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      {/* show BottomNav on this screen */}
      <BottomNav visible />
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 16,
  },
  overlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  location: {
    color: "#ddd",
    fontSize: 14,
  },
});
