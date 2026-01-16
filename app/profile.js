import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { menuState } from '../src/utils/menuState';
import { useLanguage } from '../src/context/LanguageContext';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [favoriteDrinkId, setFavoriteDrinkId] = useState(null);
  const [showDrinkPicker, setShowDrinkPicker] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/');
          }
        },
      ]
    );
  };

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setUsername(profile.username || '');
      setFavoriteDrinkId(profile.favorite_drink_id || null);
    }
  }, [profile]);

  useEffect(() => {
    fetchDrinks();
  }, []);

  const fetchDrinks = async () => {
    const { data, error } = await supabase
      .from('drinks')
      .select('*')
      .order('category')
      .order('name');

    if (!error && data) {
      setDrinks(data);
    }
  };

  const getSelectedDrink = () => {
    return drinks.find(d => d.id === favoriteDrinkId);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(t('common.error'), t('profile.permissionDenied'));
      return;
    }

    // Open picker quickly without base64 conversion
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      const asset = result.assets[0];

      try {
        // Convert to base64 after selection
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error } = await uploadAvatar(base64, asset.uri);

        if (error) {
          Alert.alert(t('common.error'), t('profile.uploadError'));
        }
      } catch (err) {
        Alert.alert(t('common.error'), t('profile.uploadError'));
      }

      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      username: username.trim(),
      favorite_drink_id: favoriteDrinkId,
    });
    setSaving(false);

    if (error) {
      Alert.alert(t('common.error'), t('profile.updateError'));
    } else {
      Alert.alert(t('common.success'), t('profile.updateSuccess'));
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) return firstName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return '?';
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
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
              <Text style={styles.headerSubtitle}>{t('profile.title')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} disabled={uploadingImage}>
              <View style={styles.avatarContainer}>
                {uploadingImage ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials()}</Text>
                )}
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditIcon}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.emailText}>{user?.email}</Text>
            <Text style={styles.avatarHint}>{t('profile.tapToChange')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.inputLabel}>{t('profile.firstName')}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('profile.firstNamePlaceholder')}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.inputLabel}>{t('profile.lastName')}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('profile.lastNamePlaceholder')}
                placeholderTextColor={theme.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.username')}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('profile.usernamePlaceholder')}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.email')}</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{user?.email}</Text>
            </View>
            <Text style={styles.inputHint}>{t('profile.emailHint')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('profile.favoriteDrink')}</Text>
            <TouchableOpacity
              style={styles.drinkSelector}
              onPress={() => setShowDrinkPicker(true)}
            >
              {getSelectedDrink() ? (
                <View style={styles.selectedDrink}>
                  <Text style={styles.drinkIcon}>{getSelectedDrink().icon || '☕'}</Text>
                  <Text style={styles.drinkName}>{getSelectedDrink().name}</Text>
                </View>
              ) : (
                <Text style={styles.drinkPlaceholder}>{t('profile.selectDrink')}</Text>
              )}
              <Text style={styles.drinkArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D'] : ['#5D9B6B', '#3D6B4B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('common.save')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDrinkPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDrinkPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.selectDrink')}</Text>
              <TouchableOpacity onPress={() => setShowDrinkPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={drinks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.drinkOption,
                    favoriteDrinkId === item.id && styles.drinkOptionSelected,
                  ]}
                  onPress={() => {
                    setFavoriteDrinkId(item.id);
                    setShowDrinkPicker(false);
                  }}
                >
                  <Text style={styles.drinkOptionIcon}>{item.icon || '☕'}</Text>
                  <View style={styles.drinkOptionInfo}>
                    <Text style={[
                      styles.drinkOptionName,
                      favoriteDrinkId === item.id && styles.drinkOptionNameSelected,
                    ]}>{item.name}</Text>
                    {item.category && (
                      <Text style={styles.drinkOptionCategory}>{item.category}</Text>
                    )}
                  </View>
                  {favoriteDrinkId === item.id && (
                    <Text style={styles.drinkOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyDrinks}>{t('profile.noDrinks')}</Text>
              }
            />
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFavoriteDrinkId(null);
                setShowDrinkPicker(false);
              }}
            >
              <Text style={styles.clearButtonText}>{t('profile.clearSelection')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    backgroundColor: theme.card,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.card,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarEditIcon: {
    fontSize: 14,
  },
  emailText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  avatarHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputDisabled: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    opacity: 0.6,
  },
  inputDisabledText: {
    fontSize: 16,
    color: theme.textMuted,
  },
  inputHint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  saveButton: {
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 25,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 25,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signOutButton: {
    marginHorizontal: 15,
    marginBottom: 30,
    backgroundColor: theme.card,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53935',
  },
  drinkSelector: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDrink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  drinkIcon: {
    fontSize: 20,
  },
  drinkName: {
    fontSize: 16,
    color: theme.text,
  },
  drinkPlaceholder: {
    fontSize: 16,
    color: theme.textMuted,
  },
  drinkArrow: {
    fontSize: 20,
    color: theme.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  modalClose: {
    fontSize: 20,
    color: theme.textMuted,
    padding: 5,
  },
  drinkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  drinkOptionSelected: {
    backgroundColor: theme.primaryLight,
  },
  drinkOptionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  drinkOptionInfo: {
    flex: 1,
  },
  drinkOptionName: {
    fontSize: 16,
    color: theme.text,
  },
  drinkOptionNameSelected: {
    color: theme.primary,
    fontWeight: '600',
  },
  drinkOptionCategory: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  drinkOptionCheck: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '700',
  },
  emptyDrinks: {
    textAlign: 'center',
    padding: 40,
    color: theme.textMuted,
  },
  clearButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.textMuted,
  },
});
