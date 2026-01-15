import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export function SkeletonLoader({ width, height, borderRadius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function CafeCardSkeleton() {
  return (
    <View style={styles.cafeCard}>
      <SkeletonLoader width={130} height={110} borderRadius={0} />
      <View style={styles.cafeInfo}>
        <SkeletonLoader width="70%" height={20} borderRadius={4} />
        <SkeletonLoader width="90%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonLoader width={60} height={28} borderRadius={14} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
}

export function ResultsSkeletonLoader() {
  return (
    <View style={styles.container}>
      <CafeCardSkeleton />
      <CafeCardSkeleton />
      <CafeCardSkeleton />
    </View>
  );
}

export function MapSkeleton() {
  return (
    <View style={styles.mapSkeleton}>
      <SkeletonLoader width="100%" height="100%" borderRadius={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  container: {
    paddingHorizontal: 15,
  },
  cafeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cafeInfo: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  mapSkeleton: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
