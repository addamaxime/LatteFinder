import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Modal,
  TextInput,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFavorites } from '../src/context/FavoritesContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useTheme } from '../src/context/ThemeContext';
import { useCafes } from '../src/hooks/useCafes';

const LATTE_TYPES = [
  { id: 'matcha', name: 'Matcha', color: '#8BC34A', image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200' },
  { id: 'chai', name: 'Chai', color: '#FF9800', image: 'https://images.unsplash.com/photo-1578020190125-f4f7c18bc9cb?w=200' },
  { id: 'cafe', name: 'Café', color: '#795548', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200' },
  { id: 'iced', name: 'Iced', color: '#03A9F4', image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=200' },
];

export default function HomeScreen() {
  const [selectedLatte, setSelectedLatte] = useState('matcha');
  const [userLocation, setUserLocation] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [useCustomLocation, setUseCustomLocation] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const mapRef = useRef(null);
  const { favorites } = useFavorites();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { cafes, loading: cafesLoading } = useCafes(selectedLatte);

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
      setLocationLoading(false);
    })();
  }, []);

  const searchAddress = async () => {
    if (!addressInput.trim()) return;

    try {
      const results = await Location.geocodeAsync(addressInput);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        setSearchLocation({ latitude, longitude, address: addressInput });
        setUseCustomLocation(true);
        setShowAddressModal(false);
        setAddressInput('');
        Keyboard.dismiss();

        // Centrer la carte sur la nouvelle position
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
    } catch (error) {
      console.log('Erreur geocoding:', error);
    }
  };

  const resetToUserLocation = () => {
    setUseCustomLocation(false);
    setSearchLocation(null);
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  };

  const currentLocation = useCustomLocation ? searchLocation : userLocation;

  const selectedLatteData = LATTE_TYPES.find(l => l.id === selectedLatte);

  const handleSearch = () => {
    router.push({
      pathname: '/results',
      params: {
        latteType: selectedLatte,
        latteName: selectedLatteData?.name
      }
    });
  };

  // Message d'accueil selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { emoji: '☀️', text: t('greetings.goodMorning') };
    if (hour < 18) return { emoji: '👋', text: t('greetings.goodAfternoon') };
    return { emoji: '🌙', text: t('greetings.goodEvening') };
  };
  const greeting = getGreeting();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header moderne */}
        <LinearGradient
          colors={theme.mode === 'dark' ? ['#2D5A3D', '#1A3D2A', '#121212'] : ['#6BAF7B', '#4A7C59', '#2D5A3D']}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)' }]}
                onPress={() => setShowMenu(true)}
              >
                <Text style={[styles.menuIcon, { color: theme.mode === 'dark' ? '#FFFFFF' : '#3D6B4B' }]}>☰</Text>
              </TouchableOpacity>

              <View style={styles.headerTextContainer}>
                <Text style={styles.appTitle}>LatteFinder</Text>
                <Text style={styles.appSubtitle}>{t('home.findBestLattes')}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Latte Selection */}
        <View style={styles.selectionSection}>
          <View style={[styles.selectionBox, { backgroundColor: theme.card, borderColor: theme.primary }]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>{t('home.whatLatte')}</Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.latteList}
            >
              {LATTE_TYPES.map((latte) => {
                const isSelected = selectedLatte === latte.id;
                return (
                  <TouchableOpacity
                    key={latte.id}
                    style={[
                      styles.latteItem,
                      { backgroundColor: theme.inputBackground },
                      isSelected && styles.latteItemSelected
                    ]}
                    onPress={() => setSelectedLatte(latte.id)}
                    activeOpacity={0.7}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={theme.mode === 'dark' ? ['#3D6B4B', '#1A3D2A'] : ['#C8E6C9', '#A5D6A7', '#81C784']}
                        style={styles.latteItemGradient}
                      >
                        <Image source={{ uri: latte.image }} style={styles.latteImage} />
                        <Text style={[styles.latteName, styles.latteNameSelected, { color: theme.primary }]}>
                          {latte.name}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.latteItemInner}>
                        <Image source={{ uri: latte.image }} style={styles.latteImage} />
                        <Text style={[styles.latteName, { color: theme.textSecondary }]}>
                          {latte.name}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <LinearGradient
            colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.searchButtonGradient}
          >
            <Text style={styles.searchButtonText}>
              {t('home.findLatte')} {selectedLatteData?.name.split(' ')[0]} !
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: currentLocation?.latitude || 43.490,
              longitude: currentLocation?.longitude || -1.525,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
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
          {locationLoading && (
            <View style={styles.mapLoading}>
              <ActivityIndicator color="#3D6B4B" />
            </View>
          )}
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={() => router.push({ pathname: '/map', params: { latteType: selectedLatte, latteName: selectedLatteData?.name } })}
          >
            <Text style={styles.fullscreenIcon}>⛶</Text>
          </TouchableOpacity>
          {userLocation && (
            <TouchableOpacity
              style={styles.recenterButton}
              onPress={() => {
                mapRef.current?.animateToRegion({
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }, 500);
              }}
            >
              <Text style={styles.recenterIcon}>⌖</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            <Text style={[styles.infoNumber, { color: theme.primary }]}>{cafes.length}</Text> {cafes.length <= 1 ? t('home.cafeFound') : t('home.cafesFound')}
          </Text>
          <TouchableOpacity
            style={[styles.locationButton, { backgroundColor: theme.primaryLight }]}
            onPress={() => useCustomLocation ? resetToUserLocation() : setShowAddressModal(true)}
          >
            <Text style={[styles.locationButtonText, { color: theme.primary }]}>
              {useCustomLocation ? `📍 ${searchLocation?.address?.substring(0, 15)}...` : `📍 ${t('home.myPosition')}`}
            </Text>
            {!useCustomLocation && <Text style={[styles.editIcon, { color: theme.primary }]}>✎</Text>}
            {useCustomLocation && <Text style={[styles.resetIcon, { color: theme.primary }]}>✕</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal recherche adresse */}
      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.primary }]}>{t('home.searchPlace')}</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Text style={[styles.modalClose, { color: theme.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.addressInput, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder={t('home.enterAddress')}
              placeholderTextColor={theme.textMuted}
              value={addressInput}
              onChangeText={setAddressInput}
              onSubmitEditing={searchAddress}
              returnKeyType="search"
              autoFocus={true}
            />
            <TouchableOpacity style={[styles.searchAddressButton, { backgroundColor: theme.primary }]} onPress={searchAddress}>
              <Text style={styles.searchAddressButtonText}>{t('home.search')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menu latéral */}
      <Modal
        visible={showMenu}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={[styles.menuOverlay, { backgroundColor: theme.overlay }]}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
            <SafeAreaView edges={['top']} style={styles.menuSafeArea}>
              <View style={[styles.menuHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.menuTitle, { color: theme.primary }]}>{t('home.menu')}</Text>
                <TouchableOpacity onPress={() => setShowMenu(false)}>
                  <Text style={[styles.menuCloseIcon, { color: theme.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/favorites');
                }}
              >
                <Text style={styles.menuItemIcon}>❤️</Text>
                <Text style={[styles.menuItemText, { color: theme.text }]}>{t('home.myFavorites')}</Text>
                {favorites.length > 0 && (
                  <View style={[styles.menuItemBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.menuItemBadgeText}>{favorites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setShowMenu(false);
                  router.push('/settings');
                }}
              >
                <Text style={styles.menuItemIcon}>⚙️</Text>
                <Text style={[styles.menuItemText, { color: theme.text }]}>{t('home.settings')}</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FBF4',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerGradient: {
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 22,
    color: '#3D6B4B',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
    marginTop: 5,
  },
  greetingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  headerDecoration: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 28,
  },
  selectionSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  selectionBox: {
    borderWidth: 2,
    borderColor: '#4A7C59',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3D6B4B',
    marginBottom: 15,
    textAlign: 'center',
  },
  latteList: {
    paddingHorizontal: 5,
  },
  latteItem: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    marginHorizontal: 5,
    minWidth: 85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  latteItemSelected: {
    borderWidth: 2,
    borderColor: '#4A7C59',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  latteItemGradient: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: '100%',
  },
  latteItemInner: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  latteImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  latteName: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  latteNameSelected: {
    fontWeight: '700',
  },
  searchButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#3D6B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonGradient: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: SCREEN_HEIGHT * 0.4,
  },
  map: {
    flex: 1,
    borderRadius: 20,
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    color: '#3D6B4B',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    color: '#3D6B4B',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#555555',
  },
  infoNumber: {
    fontWeight: 'bold',
    color: '#3D6B4B',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  locationButtonText: {
    fontSize: 13,
    color: '#3D6B4B',
    fontWeight: '500',
  },
  editIcon: {
    fontSize: 12,
    color: '#3D6B4B',
    marginLeft: 5,
  },
  resetIcon: {
    fontSize: 14,
    color: '#3D6B4B',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3D6B4B',
  },
  modalClose: {
    fontSize: 22,
    color: '#888',
    padding: 5,
  },
  addressInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  searchAddressButton: {
    backgroundColor: '#3D6B4B',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
  },
  searchAddressButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  menuContainer: {
    width: '75%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  menuSafeArea: {
    flex: 1,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3D6B4B',
  },
  menuCloseIcon: {
    fontSize: 24,
    color: '#888',
    padding: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemIcon: {
    fontSize: 22,
    marginRight: 15,
  },
  menuItemText: {
    fontSize: 17,
    color: '#333',
    flex: 1,
  },
  menuItemBadge: {
    backgroundColor: '#3D6B4B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuItemBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
