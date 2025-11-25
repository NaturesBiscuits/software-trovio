import React, { useEffect, useMemo, useRef } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { LatLng, Marker, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

interface StoreRouteMapProps {
  origin?: LatLng | null;
  destination?: LatLng | null;
}

export default function StoreRouteMap({
  origin,
  destination,
}: StoreRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo<Region | undefined>(() => {
    if (destination) {
      return {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return undefined;
  }, [destination]);

  useEffect(() => {
    if (origin && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: origin,
          pitch: 0,
          heading: 0,
        },
        { duration: 500 }
      );
    }
  }, [origin]);

  const handleNavigatePress = () => {
    if (!destination) return;
    const dest = `${destination.latitude},${destination.longitude}`;
    const originPart = origin ? `${origin.latitude},${origin.longitude}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      dest
    )}${originPart ? `&origin=${encodeURIComponent(originPart)}` : ''}&travelmode=driving`;
    Linking.openURL(url);
  };

  if (!destination) {
    return <Text style={styles.infoText}>Location unavailable.</Text>;
  }

  return (
    <View style={styles.container}>
      {region ? (
        <MapView ref={mapRef} style={styles.map} initialRegion={region}>
          {origin && (
            <Marker coordinate={origin}>
              <View style={styles.userMarkerOuter}>
                <View style={styles.userMarkerInner} />
              </View>
            </Marker>
          )}
          <Marker coordinate={destination} title="Store" pinColor="#be3e3e" />
        </MapView>
      ) : (
        <View style={[styles.map, styles.center]}>
          <Text style={styles.infoText}>Map unavailable.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.navigateButton,
          !destination ? styles.buttonDisabled : undefined,
        ]}
        onPress={handleNavigatePress}
        disabled={!destination}
      >
        <Icon name="navigate-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.navigateText}>Navigate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  infoText: {
    color: '#777',
    textAlign: 'center',
  },
  userMarkerOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(70, 141, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1f78ff',
  },
  navigateButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#1f78ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  navigateText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

