import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLocation } from '../src/context/LocationContext';
import { calculateDistance, formatDistance } from '../src/utils/distance';
import { isOpenNow } from '../src/utils/hours';
import { ResultsSkeletonLoader } from '../src/components/SkeletonLoader';
import { AnimatedImage } from '../src/components/AnimatedImage';
import { useTheme } from '../src/context/ThemeContext';
import { useLanguage } from '../src/context/LanguageContext';
import { useCafes } from '../src/hooks/useCafes';

export default function ResultsScreen() {
  const { latteType, latteName } = useLocalSearchParams();
  const { userLocation } = useLocation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { cafes: rawCafes, loading: cafesLoading } = useCafes(latteType);
  const [sortBy, setSortBy] = useState('distance');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const isLoading = cafesLoading;

  useEffect(() => {
    if (!cafesLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [cafesLoading]);

  const cafes = rawCafes
    .map(cafe => ({
      ...cafe,
      distance: userLocation
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            cafe.latitude,
            cafe.longitude
          )
        : null,
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 999) - (b.distance || 999);
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

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
              style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backArrow, { color: '#FFFFFF' }]}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerBrand}>LatteFinder</Text>
              <Text style={styles.headerSubtitle}>{t('results.resultsFor')} {latteName}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      <SafeAreaView edges={[]} style={styles.safeArea}>

        {/* Sort Options */}
        <View style={[styles.sortContainer, { backgroundColor: theme.headerBackground, borderBottomColor: theme.border }]}>
          <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>{t('results.sortBy')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
            {[
              { key: 'distance', icon: '📍', label: t('results.distance') },
              { key: 'rating', icon: '⭐', label: t('results.rating') },
              { key: 'name', icon: '🔤', label: t('results.name') },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => setSortBy(option.key)}
                activeOpacity={0.7}
              >
                {sortBy === option.key ? (
                  <LinearGradient
                    colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sortButtonGradient}
                  >
                    <Text style={styles.sortButtonTextActive}>{option.icon} {option.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.sortButtonText, { color: theme.textSecondary }]}>
                    {option.icon} {option.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <Text style={[styles.resultsCount, { color: theme.textMuted }]}>
          {isLoading ? t('results.loading') : `${cafes.length} ${cafes.length <= 1 ? t('results.nearbyCafe') : t('results.nearbyCafes')}`}
        </Text>

        {/* Cafe List */}
        {isLoading ? (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            <ResultsSkeletonLoader />
          </ScrollView>
        ) : (
          <Animated.ScrollView
            style={[styles.listContainer, { opacity: fadeAnim }]}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {cafes.map((cafe) => {
              const isOpen = cafe.hours ? isOpenNow(cafe.hours) : null;
              return (
                <TouchableOpacity
                  key={cafe.id}
                  style={[styles.cafeCard, { backgroundColor: theme.card }]}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/cafe/${cafe.id}`)}
                >
                  <AnimatedImage
                    source={{ uri: cafe.image }}
                    style={styles.cafeImage}
                  />
                  {isOpen !== null && (
                    <View style={[styles.statusIndicator, { backgroundColor: isOpen ? theme.statusOpen : theme.statusClosed }]}>
                      <Text style={styles.statusDot}>●</Text>
                    </View>
                  )}
                  <View style={styles.cafeInfo}>
                    <Text style={[styles.cafeName, { color: theme.primary }]}>{cafe.name}</Text>
                    <Text style={[styles.cafeDetails, { color: theme.textMuted }]}>
                      {cafe.distance ? `${t('common.at')} ${formatDistance(cafe.distance)}` : ''} - {cafe.description}
                    </Text>
                    <View style={styles.bottomRow}>
                      <View style={[styles.ratingContainer, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.rating, { color: theme.primary }]}>{cafe.rating}</Text>
                        <Text style={[styles.star, { color: theme.star }]}>★</Text>
                      </View>
                      {isOpen !== null && (
                        <Text style={[styles.statusText, { color: isOpen ? theme.statusOpen : theme.statusClosed }]}>
                          {isOpen ? t('results.open') : t('results.closed')}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </Animated.ScrollView>
        )}

        {/* Map Button */}
        <View style={[styles.bottomBar, { backgroundColor: theme.headerBackground, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.mapButton}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/map', params: { latteType, latteName } })}
          >
            <LinearGradient
              colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.mapButtonGradient}
            >
              <Text style={styles.mapButtonText}>{t('results.viewOnMap')}</Text>
              <Text style={styles.mapButtonArrow}>›</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sortButtonGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortButtonTextActive: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultsCount: {
    fontSize: 14,
    color: '#888888',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  cafeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cafeImage: {
    width: 130,
    height: 110,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOpen: {
    backgroundColor: '#4CAF50',
  },
  statusClosed: {
    backgroundColor: '#F44336',
  },
  statusDot: {
    fontSize: 8,
    color: '#FFFFFF',
  },
  cafeInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  cafeName: {
    fontSize: 19,
    fontWeight: '600',
    color: '#3D6B4B',
    marginBottom: 5,
  },
  cafeDetails: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  rating: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3D6B4B',
  },
  star: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#4CAF50',
  },
  statusTextClosed: {
    color: '#F44336',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  mapButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#3D6B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  mapButtonGradient: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 30,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapButtonArrow: {
    fontSize: 22,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '300',
  },
});
