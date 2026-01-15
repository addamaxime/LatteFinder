import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const lightTheme = {
  mode: 'light',
  background: '#F8FBF4',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#888888',
  primary: '#3D6B4B',
  primaryLight: '#E8F5E9',
  primaryDark: '#2D5A3D',
  border: '#E8E8E8',
  inputBackground: '#F5F5F5',
  headerBackground: '#FFFFFF',
  skeleton: '#E0E0E0',
  overlay: 'rgba(0,0,0,0.5)',
  statusOpen: '#4CAF50',
  statusClosed: '#F44336',
  statusOpenBg: '#E8F5E9',
  statusClosedBg: '#FFEBEE',
  star: '#FFD700',
};

export const darkTheme = {
  mode: 'dark',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#808080',
  primary: '#5D9B6B',
  primaryLight: '#2A3A2E',
  primaryDark: '#4A8B5B',
  border: '#333333',
  inputBackground: '#2A2A2A',
  headerBackground: '#1E1E1E',
  skeleton: '#333333',
  overlay: 'rgba(0,0,0,0.7)',
  statusOpen: '#66BB6A',
  statusClosed: '#EF5350',
  statusOpenBg: '#1B3D24',
  statusClosedBg: '#3D1B1B',
  star: '#FFD700',
};

// 'auto' = suivre le système, 'light' = toujours clair, 'dark' = toujours sombre
export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('auto'); // 'auto', 'light', 'dark'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem('themeMode');
      if (stored !== null) {
        setThemeMode(stored);
      }
    } catch (error) {
      console.log('Erreur chargement thème:', error);
    }
    setIsLoading(false);
  };

  const setThemeModeAndSave = async (mode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeMode(mode);
    } catch (error) {
      console.log('Erreur sauvegarde thème:', error);
    }
  };

  // Déterminer si on est en mode sombre
  const isDarkMode = themeMode === 'auto'
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, themeMode, setThemeMode: setThemeModeAndSave }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
