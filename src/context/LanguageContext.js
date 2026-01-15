import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, availableLanguages } from '../i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('language');
      if (stored && translations[stored]) {
        setLanguage(stored);
      }
    } catch (error) {
      console.log('Erreur chargement langue:', error);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem('language', newLanguage);
      setLanguage(newLanguage);
    } catch (error) {
      console.log('Erreur sauvegarde langue:', error);
    }
  };

  // Function to get translation by dot notation path (e.g., 'home.findBestLattes')
  const t = (path) => {
    const keys = path.split('.');
    let result = translations[language];

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        // Fallback to French if key not found
        result = translations.fr;
        for (const k of keys) {
          if (result && typeof result === 'object' && k in result) {
            result = result[k];
          } else {
            return path; // Return the path if not found
          }
        }
        break;
      }
    }

    return result || path;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      t,
      languages: availableLanguages,
      translations: translations[language]
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
