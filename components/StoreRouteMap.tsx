import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, SafeAreaView, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MapView, { LatLng, Marker, Polyline, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';

interface StoreRouteMapProps {
  origin?: LatLng | null;
  destination?: LatLng | null;
  containerStyle?: StyleProp<ViewStyle>;
  onNavigatePress?: () => void;
  navigateLabel?: string;
}

// Consistent map size across all devices
// Using percentage-based width with a max constraint for consistency
const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');
// Use 90% of screen width with max 350px and min padding of 20px on each side
const MAP_WIDTH = Math.min(350, deviceWidth - 40);
// Consistent aspect ratio (approximately 16:9)
const MAP_HEIGHT = Math.round(MAP_WIDTH * 0.55);

export default function StoreRouteMap({
  origin,
  destination,
  containerStyle,
  onNavigatePress,
  navigateLabel = 'Center on Route',
}: StoreRouteMapProps) {
  const mapRef = useRef<MapView | null>(null);
  const expandedMapRef = useRef<MapView | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, // also slight adjustment since container is smaller
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
        // Request route with alternatives to find the shortest path by road
        // OSRM returns routes sorted by duration, but we can compare distances
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(url);
        const json = await res.json();
        
        if (!isCancelled && json?.routes && Array.isArray(json.routes) && json.routes.length > 0) {
          // Find the shortest route by distance
          let shortestRoute = json.routes[0];
          let shortestDistance = json.routes[0]?.distance || Infinity;
          
          for (const route of json.routes) {
            if (route.distance && route.distance < shortestDistance) {
              shortestDistance = route.distance;
              shortestRoute = route;
            }
          }
          
          const coords = shortestRoute?.geometry?.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            setRouteCoords(
              coords.map(([lon, lat]: [number, number]) => ({
                latitude: lat,
                longitude: lon,
              }))
            );
          } else {
            setRouteCoords([]);
          }
        } else {
          setRouteCoords([]);
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

  const handleMapPress = () => {
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  const focusOnExpandedRoute = useCallback(
    (animated = true) => {
      if (!expandedMapRef.current || !destination) return;
      const coordsToFit =
        routeCoords.length > 0
          ? routeCoords
          : origin
          ? [origin, destination]
          : [destination];
      if (coordsToFit.length > 1) {
        expandedMapRef.current.fitToCoordinates(coordsToFit, {
          animated,
          edgePadding: { top: 100, right: 60, bottom: 100, left: 60 },
        });
      } else {
        expandedMapRef.current.animateToRegion(
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
    if (isExpanded) {
      // Focus on route when expanded modal opens
      setTimeout(() => focusOnExpandedRoute(false), 100);
    }
  }, [isExpanded, focusOnExpandedRoute]);

  if (!destination) {
    return <Text style={styles.infoText}>Location unavailable.</Text>;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.container, containerStyle]}
        activeOpacity={0.9}
        onPress={handleMapPress}
        disabled={!destination}
      >
        {region ? (
          <MapView ref={mapRef} style={styles.map} initialRegion={region} scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}>
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
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
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

        <View style={styles.expandHint}>
          <Icon name="expand-outline" size={16} color="#fff" />
          <Text style={styles.expandHintText}>Tap to expand</Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Map Modal */}
      <Modal
        visible={isExpanded}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseExpanded}
      >
        <SafeAreaView style={styles.expandedContainer}>
          <View style={styles.expandedHeader}>
            <TouchableOpacity style={styles.expandedBackButton} onPress={handleCloseExpanded}>
              <Icon name="chevron-back" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.expandedTitle}>Route Map</Text>
            <View style={styles.expandedSpacer} />
          </View>

          {region ? (
            <MapView
              ref={expandedMapRef}
              style={styles.expandedMap}
              initialRegion={region}
            >
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
                  strokeWidth={5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </MapView>
          ) : (
            <View style={[styles.expandedMap, styles.center]}>
              <Text style={styles.infoText}>Map unavailable.</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.expandedNavigateButton}
            onPress={() => focusOnExpandedRoute(true)}
            disabled={!destination}
          >
            <Icon name="navigate-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.expandedNavigateText}>Center on Route</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
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
  expandHint: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expandHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  expandedContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  expandedBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  expandedTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },
  expandedSpacer: {
    width: 40,
  },
  expandedMap: {
    flex: 1,
    width: '100%',
  },
  expandedNavigateButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#1f78ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  expandedNavigateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
