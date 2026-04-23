import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

interface MapPickerProps {
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location access in settings.");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMarker({ latitude, longitude });
      onLocationSelect({ latitude, longitude });
    })();
  }, [onLocationSelect]);

  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setMarker({ latitude, longitude });
    onLocationSelect({ latitude, longitude });
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(newRegion: Region, gesture): void => {
            if(!gesture.isGesture) {
              return
            }
            setRegion(newRegion)
          }}
        onPress={handleMapPress}
      >
        {marker && <Marker coordinate={marker} />}
      </MapView>

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (marker) onLocationSelect(marker);
          Alert.alert("Location Selected", "Store location saved!");
        }}
      >
        <Text style={styles.buttonText}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 300, borderRadius: 12, overflow: "hidden" },
  map: { flex: 1 },
  button: {
    position: "absolute",
    bottom: 20,
    left: "25%",
    right: "25%",
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
});
