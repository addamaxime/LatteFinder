import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { menuState } from '../src/utils/menuState';
import { useFavorites } from '../src/context/FavoritesContext';
import { useLocation } from '../src/context/LocationContext';
import { useLanguage } from '../src/context/LanguageContext';
import { calculateDistance, formatDistance } from '../src/utils/distance';
import { AnimatedImage } from '../src/components/AnimatedImage';
import { useTheme } from '../src/context/ThemeContext';
import { useCafes } from '../src/hooks/useCafes';

export default function FavoritesScreen() {
  const { favorites } = useFavorites();
  const { userLocation } = useLocation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { cafes: allCafes } = useCafes();

  const favoriteCafes = allCafes.filter(cafe => favorites.includes(cafe.id));

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
              onPress={() => {
                menuState.shouldOpenOnFocus = true;
                router.back();
              }}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerBrand}>LatteFinder</Text>
              <Text style={styles.headerSubtitle}>{t('favorites.title')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {favoriteCafes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={[styles.emptyTitle, { color: theme.primary }]}>{t('favorites.noFavorites')}</Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {t('favorites.addFavoritesHint')}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {favoriteCafes.map((cafe) => {
              const distance = userLocation
                ? calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    cafe.latitude,
                    cafe.longitude
                  )
                : null;

              return (
                <TouchableOpacity
                  key={cafe.id}
                  style={[styles.cafeCard, { backgroundColor: theme.card }]}
                  activeOpacity={0.9}
                  onPress={() => router.push(`/cafe/${cafe.id}`)}
                >
                  <AnimatedImage source={{ uri: cafe.image || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' }} style={styles.cafeImage} />
                  <View style={styles.cafeInfo}>
                    <Text style={[styles.cafeName, { color: theme.primary }]}>{cafe.name}</Text>
                    <Text style={[styles.cafeDetails, { color: theme.textMuted }]}>
                      {distance ? `${t('common.at')} ${formatDistance(distance)}` : ''} - {cafe.description}
                    </Text>
                    <View style={[styles.ratingContainer, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.rating, { color: theme.primary }]}>{cafe.rating}</Text>
                      <Text style={[styles.star, { color: theme.star }]}>★</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D6B4B',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5ED',
    alignSelf: 'flex-start',
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
});
