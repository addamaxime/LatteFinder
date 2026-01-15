import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useLanguage } from '../../src/context/LanguageContext';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Google Auth
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Check Apple Sign-In availability
  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert(t('errors.signupError'), t('errors.fillAllFields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('errors.signupError'), t('errors.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('errors.signupError'), t('errors.passwordTooShort'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);

    if (error) {
      Alert.alert(t('errors.signupError'), error.message);
    } else {
      Alert.alert(t('success.signupSuccess'), t('success.checkEmail'), [
        { text: t('common.ok'), onPress: () => router.replace('/auth/login') }
      ]);
    }
  };

  const handleGoogleSignIn = async (idToken) => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(idToken);
    setGoogleLoading(false);

    if (error) {
      Alert.alert(t('errors.signupError'), error.message || 'Erreur de connexion Google');
    } else {
      router.replace('/');
    }
  };

  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    const { error } = await signInWithApple();
    setAppleLoading(false);

    if (error) {
      Alert.alert(t('errors.signupError'), error.message || 'Erreur de connexion Apple');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={theme.mode === 'dark' ? ['#2D5A3D', '#1A3D2A', '#121212'] : ['#6BAF7B', '#4A7C59', '#2D5A3D']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerBrand}>LatteFinder</Text>
              <Text style={styles.headerSubtitle}>{t('auth.signup')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.formTitle, { color: theme.primary }]}>{t('auth.signup')}</Text>
            <Text style={[styles.formSubtitle, { color: theme.textMuted }]}>{t('auth.signupSubtitle')}</Text>

            {/* OAuth Buttons */}
            <View style={styles.oauthContainer}>
              {/* Google Sign-In */}
              <TouchableOpacity
                style={[styles.oauthButton, { backgroundColor: theme.inputBackground }]}
                onPress={() => promptAsync()}
                disabled={!request || googleLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <>
                    <Text style={styles.oauthIcon}>G</Text>
                    <Text style={[styles.oauthText, { color: theme.text }]}>Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Apple Sign-In (iOS only) */}
              {Platform.OS === 'ios' && isAppleAvailable && (
                <TouchableOpacity
                  style={[styles.oauthButton, { backgroundColor: theme.mode === 'dark' ? '#FFFFFF' : '#000000' }]}
                  onPress={handleAppleSignIn}
                  disabled={appleLoading}
                >
                  {appleLoading ? (
                    <ActivityIndicator size="small" color={theme.mode === 'dark' ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <>
                      <Text style={[styles.oauthIcon, { color: theme.mode === 'dark' ? '#000000' : '#FFFFFF' }]}></Text>
                      <Text style={[styles.oauthText, { color: theme.mode === 'dark' ? '#000000' : '#FFFFFF' }]}>Apple</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>ou</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('auth.username')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t('auth.username')}
                placeholderTextColor={theme.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t('auth.email')}
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('auth.password')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t('auth.password')}
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('auth.confirmPassword')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                placeholder={t('auth.confirmPassword')}
                placeholderTextColor={theme.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient
                colors={theme.mode === 'dark' ? ['#6BAF7B', '#2D5A3D', '#1A3D2A'] : ['#5D9B6B', '#3D6B4B', '#1E4D2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signupButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>{t('auth.signUp')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.textMuted }]}>{t('auth.hasAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={[styles.loginLink, { color: theme.primary }]}> {t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formCard: {
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  oauthContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  oauthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  oauthIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  oauthText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 13,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  signupButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#3D6B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
    marginBottom: 20,
  },
  signupButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});
