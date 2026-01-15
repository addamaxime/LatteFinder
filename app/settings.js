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
import { useLanguage } from '../src/context/LanguageContext';
import { useTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';

export default function SettingsScreen() {
  const { language, changeLanguage, t, languages } = useLanguage();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isAuthenticated } = useAuth();

  const themeOptions = [
    {
      code: 'auto',
      icon: '📱',
      name: t('settings.themeAuto'),
      description: t('settings.themeAutoDesc')
    },
    {
      code: 'light',
      icon: '☀️',
      name: t('settings.themeLight'),
      description: t('settings.themeLightDesc')
    },
    {
      code: 'dark',
      icon: '🌙',
      name: t('settings.themeDark'),
      description: t('settings.themeDarkDesc')
    },
  ];

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
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
              <Text style={styles.headerSubtitle}>{t('settings.title')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Account Section - Only show if not authenticated */}
          {!isAuthenticated && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
              <View>
                <Text style={styles.accountDescription}>{t('auth.syncFavorites')}</Text>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push('/auth/login')}
                >
                  <LinearGradient
                    colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>{t('auth.signIn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupLink}
                  onPress={() => router.push('/auth/signup')}
                >
                  <Text style={styles.signupLinkText}>
                    {t('auth.noAccount')} {t('auth.signUp')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Appearance Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
            <View style={styles.optionsContainer}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.themeOption,
                    themeMode === option.code && styles.themeOptionActive,
                  ]}
                  onPress={() => setThemeMode(option.code)}
                >
                  <Text style={styles.themeIcon}>{option.icon}</Text>
                  <View style={styles.themeTextContainer}>
                    <Text
                      style={[
                        styles.themeName,
                        themeMode === option.code && styles.themeNameActive,
                      ]}
                    >
                      {option.name}
                    </Text>
                    <Text style={styles.themeDescription}>{option.description}</Text>
                  </View>
                  {themeMode === option.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Language Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
            <View style={styles.optionsContainer}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionActive,
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      language === lang.code && styles.languageNameActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {language === lang.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('settings.version')}</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
        </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 15,
  },
  optionsContainer: {
    gap: 10,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionActive: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  themeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  themeNameActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  themeDescription: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 2,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: theme.primaryLight,
    borderColor: theme.primary,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
  },
  languageNameActive: {
    color: theme.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: theme.text,
  },
  infoValue: {
    fontSize: 15,
    color: theme.textMuted,
  },
  accountDescription: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 15,
    lineHeight: 20,
  },
  loginButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loginButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 25,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signupLinkText: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '500',
  },
});
