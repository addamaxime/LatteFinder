import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useReviews(cafeId) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = useCallback(async () => {
    if (!cafeId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('cafe_id', cafeId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReviews(data || []);

      // Calculate average
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [cafeId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, loading, error, averageRating, refetch: fetchReviews };
}

export function useUserReview(cafeId) {
  const { user } = useAuth();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserReview() {
      if (!user || !cafeId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('cafe_id', cafeId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error;
        }

        setReview(data);
      } catch (err) {
        console.error('Error fetching user review:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserReview();
  }, [user, cafeId]);

  const submitReview = async (rating, comment, latteType) => {
    if (!user) {
      return { error: { message: 'Vous devez être connecté pour laisser un avis' } };
    }

    try {
      const reviewData = {
        cafe_id: cafeId,
        user_id: user.id,
        rating,
        comment,
        latte_type: latteType,
      };

      let result;

      if (review) {
        // Update existing review
        result = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', review.id)
          .select()
          .single();
      } else {
        // Insert new review
        result = await supabase
          .from('reviews')
          .insert(reviewData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setReview(result.data);
      return { data: result.data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const deleteReview = async () => {
    if (!review) return { error: { message: 'Aucun avis à supprimer' } };

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id);

      if (error) throw error;

      setReview(null);
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  return { review, loading, submitReview, deleteReview };
}
