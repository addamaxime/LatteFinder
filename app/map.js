import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useCafes, useCafe } from '../src/hooks/useCafes';

export default function MapScreen() {
  const { latteType, latteName, cafeId } = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = React.useRef(null);

  // Fetch cafes based on latte type or all cafes
  const { cafes: allCafes, loading: cafesLoading } = useCafes(latteType || null);
  // Fetch specific cafe if cafeId is provided
  const { cafe: specificCafe, loading: cafeLoading } = useCafe(cafeId);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  // Si on vient d'une fiche café, on affiche ce café
  const cafes = specificCafe ? [specificCafe] : allCafes;

  // Centre de la carte basé sur le café spécifique, la position utilisateur ou les cafés
  const centerLat = specificCafe?.latitude || userLocation?.latitude || (cafes.reduce((sum, c) => sum + c.latitude, 0) / cafes.length);
  const centerLng = specificCafe?.longitude || userLocation?.longitude || (cafes.reduce((sum, c) => sum + c.longitude, 0) / cafes.length);
  const zoomDelta = specificCafe ? 0.02 : 0.08;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header avec dégradé */}
      <LinearGradient
        colors={theme.mode === 'dark' ? ['#2D5A3D', '#1A3D2A', '#121212'] : ['#6BAF7B', '#4A7C59', '#2D5A3D']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerBrand}>LatteFinder</Text>
              <Text style={styles.headerSubtitle}>
                {specificCafe ? specificCafe.name : latteName ? `${t('map.mapOf')} ${latteName}` : t('map.cafeMap')}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Full Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: centerLat || 43.490,
            longitude: centerLng || -1.525,
            latitudeDelta: zoomDelta,
            longitudeDelta: zoomDelta,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {cafes.map((cafe) => (
            <Marker
              key={cafe.id}
              coordinate={{
                latitude: cafe.latitude,
                longitude: cafe.longitude,
              }}
              title={cafe.name}
              description={cafe.description}
              onCalloutPress={() => router.push(`/cafe/${cafe.id}`)}
            />
          ))}
        </MapView>

        {/* Recenter Button */}
        {userLocation && (
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={() => {
              mapRef.current?.animateToRegion({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }, 500);
            }}
          >
            <Text style={styles.recenterIcon}>⌖</Text>
          </TouchableOpacity>
        )}

      {/* Info Bar */}
      <View style={[styles.infoBar, { backgroundColor: theme.headerBackground, borderTopColor: theme.border }]}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>{cafes.length} {cafes.length <= 1 ? t('map.cafeDisplayed') : t('map.cafesDisplayed')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF4',
  },
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 12,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backArrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerSpacer: {
    width: 36,
  },
  map: {
    flex: 1,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 80,
    right: 15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recenterIcon: {
    fontSize: 24,
    color: '#3D6B4B',
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
  },
});
