import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const FavoritesContext = createContext();

// Import useAuth lazily to avoid circular dependency issues
let useAuthHook = null;
const getAuth = () => {
  if (!useAuthHook) {
    try {
      const { useAuth } = require('./AuthContext');
      useAuthHook = useAuth;
    } catch {
      return { user: null, isAuthenticated: false };
    }
  }
  try {
    return useAuthHook();
  } catch {
    return { user: null, isAuthenticated: false };
  }
};

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Try to get auth state, fallback to local-only mode
  let user = null;
  let isAuthenticated = false;
  try {
    const auth = getAuth();
    user = auth.user;
    isAuthenticated = auth.isAuthenticated;
  } catch {
    // Auth not available, use local storage only
  }

  // Load favorites based on auth state
  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);

      if (isAuthenticated && user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('favorites')
          .select('cafe_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const favoriteIds = data.map(f => f.cafe_id);
        setFavorites(favoriteIds);

        // Sync local favorites to Supabase if any
        await syncLocalToSupabase(favoriteIds);
      } else {
        // Load from AsyncStorage
        const stored = await AsyncStorage.getItem('favorites');
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.log('Erreur chargement favoris:', error);
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Sync local favorites to Supabase when user logs in
  const syncLocalToSupabase = async (existingFavorites) => {
    try {
      const stored = await AsyncStorage.getItem('favorites');
      if (!stored || !user) return;

      const localFavorites = JSON.parse(stored);
      const newFavorites = localFavorites.filter(id => !existingFavorites.includes(id));

      if (newFavorites.length > 0) {
        const inserts = newFavorites.map(cafe_id => ({
          user_id: user.id,
          cafe_id,
        }));

        await supabase.from('favorites').insert(inserts);

        // Update state with merged favorites
        setFavorites([...existingFavorites, ...newFavorites]);
      }

      // Clear local storage after sync
      await AsyncStorage.removeItem('favorites');
    } catch (error) {
      console.log('Erreur sync favoris:', error);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const saveFavoritesLocal = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.log('Erreur sauvegarde favoris:', error);
    }
  };

  const addFavorite = async (cafeId) => {
    const newFavorites = [...favorites, cafeId];
    setFavorites(newFavorites);

    if (isAuthenticated && user) {
      try {
        await supabase.from('favorites').insert({
          user_id: user.id,
          cafe_id: cafeId,
        });
      } catch (error) {
        console.log('Erreur ajout favori Supabase:', error);
      }
    } else {
      saveFavoritesLocal(newFavorites);
    }
  };

  const removeFavorite = async (cafeId) => {
    const newFavorites = favorites.filter(id => id !== cafeId);
    setFavorites(newFavorites);

    if (isAuthenticated && user) {
      try {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('cafe_id', cafeId);
      } catch (error) {
        console.log('Erreur suppression favori Supabase:', error);
      }
    } else {
      saveFavoritesLocal(newFavorites);
    }
  };

  const isFavorite = (cafeId) => {
    return favorites.includes(cafeId);
  };

  const toggleFavorite = (cafeId) => {
    if (isFavorite(cafeId)) {
      removeFavorite(cafeId);
    } else {
      addFavorite(cafeId);
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      loading,
      addFavorite,
      removeFavorite,
      isFavorite,
      toggleFavorite,
      refetch: loadFavorites,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
