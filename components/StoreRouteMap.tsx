import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MapView, { LatLng, Marker, Polyline, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

interface StoreRouteMapProps {
  origin?: LatLng | null;
  destination?: LatLng | null;
  containerStyle?: StyleProp<ViewStyle>;
  onNavigatePress?: () => void;
  navigateLabel?: string;
}

export default function StoreRouteMap({
  origin,
  destination,
  containerStyle,
  onNavigatePress,
  navigateLabel = 'Center on Route',
}: StoreRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

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

  const focusOnRoute = useCallback(
    (animated = true) => {
      if (!mapRef.current || !destination) return;
      const coordsToFit =
        routeCoords.length > 0
          ? routeCoords
          : origin
          ? [origin, destination]
          : [destination];
      if (coordsToFit.length > 1) {
        mapRef.current.fitToCoordinates(coordsToFit, {
          animated,
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        });
      } else {
        mapRef.current.animateToRegion(
          {
            latitude: coordsToFit[0].latitude,
            longitude: coordsToFit[0].longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          animated ? 500 : 0
        );
      }
    },
    [origin, destination, routeCoords]
  );

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords([]);
      return;
    }
    let isCancelled = false;
    const fetchRoute = async () => {
      setRouteLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        const coords = json?.routes?.[0]?.geometry?.coordinates;
        if (!isCancelled && Array.isArray(coords)) {
          setRouteCoords(
            coords.map(([lon, lat]: [number, number]) => ({
              latitude: lat,
              longitude: lon,
            }))
          );
        }
      } catch (error) {
        if (!isCancelled) {
          console.warn('Route fetch failed', error);
          setRouteCoords([]);
        }
      } finally {
        if (!isCancelled) setRouteLoading(false);
      }
    };
    fetchRoute();
    return () => {
      isCancelled = true;
    };
  }, [origin, destination]);

  useEffect(() => {
    focusOnRoute(false);
  }, [focusOnRoute]);

  const handleNavigatePress = () => {
    if (onNavigatePress) {
      onNavigatePress();
      return;
    }
    focusOnRoute();
  };

  if (!destination) {
    return <Text style={styles.infoText}>Location unavailable.</Text>;
  }

  return (
    <View style={[styles.container, containerStyle]}>
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
          {origin && destination && (
            <Polyline
              coordinates={
                routeCoords.length > 1 ? routeCoords : [origin, destination]
              }
              strokeColor="#d93a3a"
              strokeWidth={4}
            />
          )}
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
        <Text style={styles.navigateText}>{navigateLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 360,
    height: 220,
    alignSelf: 'center',
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

