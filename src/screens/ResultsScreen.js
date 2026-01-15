import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import data from '../data/cafes.json';

export default function ResultsScreen({ route, navigation }) {
  const { latteType, latteName } = route.params;

  const cafes = data.cafes.filter(c => c.latteTypes.includes(latteType));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Résultats pour {latteName}</Text>
      </View>

      {/* Results Count */}
      <Text style={styles.resultsCount}>{cafes.length} cafés à proximité</Text>

      {/* Cafe List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
      >
        {cafes.map((cafe) => (
          <View key={cafe.id} style={styles.cafeCard}>
            <Image
              source={{ uri: cafe.image }}
              style={styles.cafeImage}
            />
            <View style={styles.cafeInfo}>
              <Text style={styles.cafeName}>{cafe.name}</Text>
              <Text style={styles.cafeDetails}>
                À {cafe.distance} m - {cafe.description}
              </Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>{cafe.rating}</Text>
                <Text style={styles.star}>★</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Map Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mapButton}>
          <Text style={styles.mapButtonText}>Voir sur la carte</Text>
          <Text style={styles.mapButtonArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backArrow: {
    fontSize: 24,
    color: '#4A7C59',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E5339',
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cafeImage: {
    width: 120,
    height: 100,
  },
  cafeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cafeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A7C59',
    marginBottom: 4,
  },
  cafeDetails: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9F0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C59',
  },
  star: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 3,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4A7C59',
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A7C59',
  },
  mapButtonArrow: {
    fontSize: 18,
    color: '#4A7C59',
    marginLeft: 10,
  },
});
