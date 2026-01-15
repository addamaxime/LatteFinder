import React, { useState } from 'react';
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

export default function HomeScreen({ navigation }) {
  const [selectedLatte, setSelectedLatte] = useState('matcha');

  const selectedLatteData = data.latteTypes.find(l => l.id === selectedLatte);
  const cafesWithLatte = data.cafes.filter(c => c.latteTypes.includes(selectedLatte));

  const handleSearch = () => {
    navigation.navigate('Results', {
      latteType: selectedLatte,
      latteName: selectedLatteData?.name
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Latte Finder</Text>
          <Text style={styles.subtitle}>Trouvez votre boisson latte !</Text>
        </View>

        {/* Latte Selection */}
        <View style={styles.selectionSection}>
          <Text style={styles.sectionTitle}>Quel latte recherchez-vous ?</Text>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.latteList}
          >
            {data.latteTypes.map((latte) => (
              <TouchableOpacity
                key={latte.id}
                style={[
                  styles.latteItem,
                  selectedLatte === latte.id && styles.latteItemSelected
                ]}
                onPress={() => setSelectedLatte(latte.id)}
              >
                <Text style={styles.latteEmoji}>{latte.emoji}</Text>
                <Text style={[
                  styles.latteName,
                  selectedLatte === latte.id && styles.latteNameSelected
                ]}>
                  {latte.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>
            Trouvez des {selectedLatteData?.name.split(' ')[0]} !
          </Text>
        </TouchableOpacity>

        {/* Map Preview */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapEmoji}>🗺️</Text>
            {cafesWithLatte.slice(0, 3).map((cafe, index) => (
              <View
                key={cafe.id}
                style={[
                  styles.mapPin,
                  { top: 30 + (index * 40), left: 50 + (index * 60) }
                ]}
              >
                <Text style={styles.pinEmoji}>📍</Text>
                <View style={styles.pinLabel}>
                  <Text style={styles.pinName}>{cafe.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Info Bar */}
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>
            {cafesWithLatte.length} Cafés trouvés à proximité
          </Text>
          <Text style={styles.infoRadius}>Rayon : 1 km</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F0',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#4A7C59',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    marginTop: 5,
  },
  selectionSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E5339',
    marginBottom: 15,
    textAlign: 'center',
  },
  latteList: {
    paddingHorizontal: 10,
  },
  latteItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginHorizontal: 5,
    minWidth: 85,
  },
  latteItemSelected: {
    backgroundColor: '#4A7C59',
  },
  latteEmoji: {
    fontSize: 30,
    marginBottom: 8,
  },
  latteName: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
  },
  latteNameSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#4A7C59',
    marginHorizontal: 20,
    marginTop: 25,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginTop: 25,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    height: 180,
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapEmoji: {
    fontSize: 60,
    opacity: 0.3,
  },
  mapPin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinEmoji: {
    fontSize: 24,
  },
  pinLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pinName: {
    fontSize: 10,
    color: '#2E5339',
    fontWeight: '500',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#2E5339',
    fontWeight: '500',
  },
  infoRadius: {
    fontSize: 14,
    color: '#666666',
  },
});
