import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useCafes() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCafes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('coffees')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;

      // Transform data to match app's expected format
      const transformedCafes = data.map(cafe => ({
        ...cafe,
        rating: cafe.average_rating || 4.5, // Default rating if no reviews
      }));

      setCafes(transformedCafes);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching cafes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  return { cafes, loading, error, refetch: fetchCafes };
}

export function useCafe(id) {
  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCafe() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('coffees')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        // Transform data
        const transformedCafe = {
          ...data,
          rating: data.average_rating || 4.5,
        };

        setCafe(transformedCafe);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching cafe:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCafe();
  }, [id]);

  return { cafe, loading, error };
}

export function useNearestCafes(latitude, longitude, radius = 10) {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNearestCafes() {
      if (!latitude || !longitude) return;

      try {
        setLoading(true);
        setError(null);

        // For now, fetch all cafes and filter by distance client-side
        // In production, you might want to use PostGIS for geospatial queries
        const { data, error: fetchError } = await supabase
          .from('coffees')
          .select('*')
          .eq('is_active', true);

        if (fetchError) throw fetchError;

        // Calculate distance and filter
        const cafesWithDistance = data
          .map(cafe => ({
            ...cafe,
            rating: cafe.average_rating || 4.5,
            distance: calculateDistance(
              latitude,
              longitude,
              cafe.latitude,
              cafe.longitude
            ),
          }))
          .filter(cafe => cafe.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        setCafes(cafesWithDistance);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching nearest cafes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNearestCafes();
  }, [latitude, longitude, radius]);

  return { cafes, loading, error };
}

// Haversine formula for distance calculation
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
