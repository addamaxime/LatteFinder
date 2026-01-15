import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  ActionSheetIOS,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFavorites } from '../../src/context/FavoritesContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useCafe } from '../../src/hooks/useCafes';
import { isOpenNow, getTodayHours, getClosingInfo, getDayLabel, formatHoursForDay, getAllDaysOrdered, getCurrentDay } from '../../src/utils/hours';
import { AnimatedImage } from '../../src/components/AnimatedImage';

export default function CafeScreen() {
  const { id } = useLocalSearchParams();
  const { cafe, loading: cafeLoading } = useCafe(id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [showAllHours, setShowAllHours] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = React.useRef(null);

  React.useEffect(() => {
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

  const isOpen = cafe?.hours ? isOpenNow(cafe.hours) : null;
  const todayHours = cafe?.hours ? getTodayHours(cafe.hours, language) : null;
  const closingInfo = cafe?.hours ? getClosingInfo(cafe.hours, language) : null;

  if (cafeLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>{t('common.loading')}</Text>
      </View>
    );
  }

  const openNavigation = (app) => {
    const { latitude, longitude } = cafe;
    let url;

    switch (app) {
      case 'apple':
        url = `maps://maps.apple.com/?daddr=${latitude},${longitude}`;
        break;
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;
      case 'waze':
        url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
        break;
    }

    Linking.openURL(url);
  };

  const showNavigationOptions = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: t('cafe.goThereWith'),
        options: [t('cafe.cancel'), t('cafe.appleMaps'), t('cafe.googleMaps'), t('cafe.waze')],
        cancelButtonIndex: 0,
      },
      (buttonIndex) => {
        if (buttonIndex === 1) openNavigation('apple');
        if (buttonIndex === 2) openNavigation('google');
        if (buttonIndex === 3) openNavigation('waze');
      }
    );
  };

  const openPhone = () => {
    if (cafe.phone) {
      Linking.openURL(`tel:${cafe.phone}`);
    }
  };

  const openSocial = (type) => {
    let url;
    switch (type) {
      case 'instagram':
        url = `https://instagram.com/${cafe.social.instagram}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${cafe.social.facebook}`;
        break;
      case 'website':
        url = cafe.social.website;
        break;
    }
    if (url) Linking.openURL(url);
  };

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
              <Text style={styles.headerSubtitle}>{cafe.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => toggleFavorite(cafe.id)}
            >
              <Text style={styles.favoriteIcon}>
                {isFavorite(cafe.id) ? '❤️' : '♡'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image */}
          <AnimatedImage source={{ uri: cafe.image }} style={styles.cafeImage} />

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.cafeName, { color: theme.primary }]}>{cafe.name}</Text>
              <View style={[styles.ratingContainer, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.rating, { color: theme.primary }]}>{cafe.rating}</Text>
                <Text style={[styles.star, { color: theme.star }]}>★</Text>
              </View>
            </View>

            <Text style={[styles.description, { color: theme.textSecondary }]}>{cafe.description}</Text>

            <View style={styles.addressRow}>
              <Text style={styles.addressIcon}>📍</Text>
              <Text style={[styles.address, { color: theme.textMuted }]}>{cafe.address}</Text>
            </View>

            {/* Phone */}
            {cafe.phone && (
              <TouchableOpacity style={styles.phoneRow} onPress={openPhone}>
                <Text style={styles.phoneIcon}>📞</Text>
                <Text style={[styles.phoneNumber, { color: theme.primary }]}>{cafe.phone}</Text>
              </TouchableOpacity>
            )}

            {/* Social Links */}
            {cafe.social && (
              <View style={styles.socialRow}>
                {cafe.social.instagram && (
                  <TouchableOpacity style={styles.socialButton} onPress={() => openSocial('instagram')} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#E1306C', '#C13584', '#833AB4']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.socialButtonGradient}
                    >
                      <Text style={styles.socialIcon}>📷</Text>
                      <Text style={styles.socialLabel}>Instagram</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {cafe.social.facebook && (
                  <TouchableOpacity style={styles.socialButton} onPress={() => openSocial('facebook')} activeOpacity={0.8}>
                    <LinearGradient
                      colors={['#4267B2', '#3B5998']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.socialButtonGradient}
                    >
                      <Text style={styles.socialIcon}>👤</Text>
                      <Text style={styles.socialLabel}>Facebook</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                {cafe.social.website && (
                  <TouchableOpacity style={styles.socialButton} onPress={() => openSocial('website')} activeOpacity={0.8}>
                    <LinearGradient
                      colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.socialButtonGradient}
                    >
                      <Text style={styles.socialIcon}>🌐</Text>
                      <Text style={styles.socialLabel}>{t('cafe.website')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Hours */}
            {cafe.hours && (
              <View style={[styles.hoursSection, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.hoursHeader}
                  onPress={() => setShowAllHours(!showAllHours)}
                >
                  <View style={styles.hoursLeft}>
                    <Text style={styles.hoursIcon}>🕐</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isOpen ? theme.statusOpenBg : theme.statusClosedBg }]}>
                      <Text style={[styles.statusText, { color: isOpen ? theme.statusOpen : theme.statusClosed }]}>
                        {isOpen ? t('results.open') : t('results.closed')}
                      </Text>
                    </View>
                    <Text style={[styles.todayHours, { color: theme.textSecondary }]}>
                      {closingInfo || todayHours}
                    </Text>
                  </View>
                  <Text style={[styles.hoursChevron, { color: theme.textMuted }]}>{showAllHours ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showAllHours && (
                  <View style={styles.allHours}>
                    {getAllDaysOrdered().map((day) => {
                      const isToday = day === getCurrentDay();
                      return (
                        <View key={day} style={[styles.dayRow, isToday && { backgroundColor: theme.primaryLight }]}>
                          <Text style={[styles.dayName, { color: theme.textSecondary }, isToday && { color: theme.primary, fontWeight: '600' }]}>
                            {getDayLabel(day, language)}
                          </Text>
                          <Text style={[styles.dayHours, { color: theme.textSecondary }, isToday && { color: theme.primary, fontWeight: '600' }]}>
                            {formatHoursForDay(cafe.hours[day], language)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Latte Types */}
            <View style={[styles.latteSection, { borderTopColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t('cafe.availableLattes')}</Text>
              <View style={styles.latteTypes}>
                {cafe.latteTypes?.map((type) => (
                  <View key={type} style={[styles.latteTag, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.latteTagText, { color: theme.primary }]}>
                      {type === 'matcha' && `🍵 ${t('lattes.matcha')}`}
                      {type === 'chai' && `🫖 ${t('lattes.chai')}`}
                      {type === 'cafe' && `🥛 ${t('lattes.cafe')}`}
                      {type === 'iced' && `🧊 ${t('lattes.iced')}`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Mini Map */}
          <View style={styles.mapSection}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t('cafe.location')}</Text>
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                  latitude: cafe.latitude,
                  longitude: cafe.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
              >
                <Marker
                  coordinate={{
                    latitude: cafe.latitude,
                    longitude: cafe.longitude,
                  }}
                  title={cafe.name}
                />
              </MapView>
              <TouchableOpacity
                style={[styles.fullscreenButton, { backgroundColor: theme.card }]}
                onPress={() => router.push({ pathname: '/map', params: { cafeId: cafe.id } })}
              >
                <Text style={[styles.fullscreenIcon, { color: theme.primary }]}>⛶</Text>
              </TouchableOpacity>
              {userLocation && (
                <TouchableOpacity
                  style={[styles.recenterButton, { backgroundColor: theme.card }]}
                  onPress={() => {
                    mapRef.current?.animateToRegion({
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }, 500);
                  }}
                >
                  <Text style={[styles.recenterIcon, { color: theme.primary }]}>⌖</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { backgroundColor: theme.headerBackground, borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.directionsButton} onPress={showNavigationOptions}>
            <LinearGradient
              colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.directionsButtonGradient}
            >
              <Text style={styles.directionsButtonText}>{t('cafe.goThere')}</Text>
              <Text style={styles.directionsIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  cafeImage: {
    width: '100%',
    height: 220,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cafeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3D6B4B',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3D6B4B',
  },
  star: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 4,
  },
  description: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 15,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  address: {
    fontSize: 14,
    color: '#888888',
    flex: 1,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  phoneIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 14,
    color: '#3D6B4B',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  socialButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  socialButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  socialIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  socialLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hoursSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hoursIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  statusOpen: {
    backgroundColor: '#E8F5E9',
  },
  statusClosed: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#2E7D32',
  },
  statusTextClosed: {
    color: '#C62828',
  },
  todayHours: {
    fontSize: 14,
    color: '#666',
  },
  hoursChevron: {
    fontSize: 12,
    color: '#999',
  },
  allHours: {
    marginTop: 15,
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dayRowToday: {
    backgroundColor: '#E8F5E9',
  },
  dayName: {
    fontSize: 14,
    color: '#666',
  },
  dayNameToday: {
    color: '#3D6B4B',
    fontWeight: '600',
  },
  dayHours: {
    fontSize: 14,
    color: '#666',
  },
  dayHoursToday: {
    color: '#3D6B4B',
    fontWeight: '600',
  },
  latteSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D6B4B',
    marginBottom: 12,
  },
  latteTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  latteTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  latteTagText: {
    fontSize: 13,
    color: '#3D6B4B',
    fontWeight: '500',
  },
  mapSection: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  mapContainer: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenIcon: {
    fontSize: 18,
    color: '#3D6B4B',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterIcon: {
    fontSize: 18,
    color: '#3D6B4B',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  directionsButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#3D6B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  directionsButtonGradient: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  directionsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  directionsIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 10,
  },
});
